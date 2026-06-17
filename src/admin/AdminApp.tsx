/* Admin-root: parken-rail links + per-attractie editor-blokken rechts.
 * Rides starten collapsed; één ride tegelijk open. */

import { useEffect, useState } from "react"
import type { Park, PhotoCandidate, PropKey } from "../shared/types"
import { PARK_DATA, parks } from "../shared/data"
import { Avatar } from "../shared/components/Avatar"
import { Flag } from "../shared/components/Flag"
import { RideBlock, type RideFieldPatch } from "./RideBlock"
import { apiCandidates, apiPhoto, apiSave } from "./api"
import { attSlug, parkSlug } from "../shared/helpers"

type SaveState = "idle" | "saving" | "saved" | "error"

export function AdminApp() {
  // We muteren een lokale kopie van PARK_DATA zodat React's render reageert.
  // Saven gebeurt via /api/save met de volledige park-JSON.
  const [parksState, setParksState] = useState<Park[]>(() =>
    PARK_DATA.map((p) => structuredClone(p)),
  )

  // Initial state komt uit de URL-hash. Schema:
  //   #/<park-slug>           → park geselecteerd, niets open
  //   #/<park-slug>/<att-slug> → park + open ride
  //   leeg / onbekend          → parks[0], niets open (hash wordt stilzwijgend gecorrigeerd)
  const initial = parseHash(parksState)
  const [selectedPark, setSelectedPark] = useState<string | null>(
    initial.park ?? (parks[0] || null),
  )
  const [openRide, setOpenRide] = useState<string | null>(initial.ride)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveMsg, setSaveMsg] = useState("")

  // Houd de hash gesynchroniseerd met de state (replaceState — geen history-rommel).
  useEffect(() => {
    if (!selectedPark) return
    const slug = parkSlug(selectedPark)
    const p = parksState.find((pp) => pp.park === selectedPark)
    const ride = openRide && p ? p.rides.find((r) => r.att === openRide) : null
    const h = "#/" + slug + (ride ? "/" + attSlug(ride.att) : "")
    if (location.hash !== h) {
      history.replaceState(null, "", location.pathname + location.search + h)
    }
  }, [selectedPark, openRide, parksState])

  // Externe hash-wijziging (back/forward, handmatig typen) overneemt de state.
  // We corrigeren de hash hier ook actief — als parseHash niets vindt en de
  // state onveranderd blijft, zou de sync-effect onder niet triggeren en
  // bleef een ongeldige hash (`#/blah/foo`) zichtbaar.
  useEffect(() => {
    function onChange() {
      const r = parseHash(parksState)
      const newPark = r.park ?? (parks[0] || null)
      setSelectedPark(newPark)
      setOpenRide(r.ride)
      if (newPark) {
        const slug = parkSlug(newPark)
        const p = parksState.find((pp) => pp.park === newPark)
        const ride = r.ride && p ? p.rides.find((rr) => rr.att === r.ride) : null
        const h = "#/" + slug + (ride ? "/" + attSlug(ride.att) : "")
        if (location.hash !== h) {
          history.replaceState(null, "", location.pathname + location.search + h)
        }
      }
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
    // parksState verandert bij elke save — we willen alleen luisteren, niet re-binden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Candidate-cache per (park_slug, att)
  type CandEntry = PhotoCandidate[] | "loading" | { __error: string }
  const [candidates, setCandidates] = useState<Record<string, CandEntry>>({})

  // Save-indicator-timer
  useEffect(() => {
    if (saveState === "saved") {
      const t = setTimeout(() => setSaveState("idle"), 1500)
      return () => clearTimeout(t)
    }
  }, [saveState])

  function park(): Park | null {
    return parksState.find((p) => p.park === selectedPark) || null
  }

  function updateRide(
    parkName: string,
    att: string,
    mutate: (r: Park["rides"][number]) => void,
  ) {
    const next = parksState.map((p) => {
      if (p.park !== parkName) return p
      const np: Park = { ...p, rides: p.rides.map((r) => ({ ...r })) }
      const ride = np.rides.find((r) => r.att === att)
      if (ride) mutate(ride)
      return np
    })
    setParksState(next)
    const live = next.find((p) => p.park === parkName)
    if (live) doSave(live)
  }

  async function doSave(p: Park) {
    setSaveState("saving")
    try {
      await apiSave(p)
      setSaveState("saved")
    } catch (e: unknown) {
      setSaveState("error")
      setSaveMsg((e as Error).message || "onbekende fout")
    }
  }

  function candKey(parkName: string, att: string): string {
    return parkName + "|" + att
  }

  async function loadCands(parkName: string, att: string, extra?: string) {
    const k = candKey(parkName, att)
    setCandidates((c) => ({ ...c, [k]: "loading" }))
    try {
      const arr = await apiCandidates(parkName, att, extra)
      setCandidates((c) => ({ ...c, [k]: arr }))
    } catch (e: unknown) {
      setCandidates((c) => ({
        ...c,
        [k]: { __error: (e as Error).message || "laden mislukt" },
      }))
    }
  }

  // Kick candidate-fetches voor het geselecteerde park.
  useEffect(() => {
    const p = park()
    if (!p) return
    p.rides.forEach((r) => {
      const k = candKey(p.park, r.att)
      if (candidates[k] == null) {
        loadCands(p.park, r.att)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPark])

  async function pickCandidate(
    parkName: string,
    att: string,
    cand: PhotoCandidate,
    opts?: { focusX?: number; focusY?: number },
  ) {
    setSaveState("saving")
    try {
      const image = await apiPhoto(parkName, att, cand, opts)
      // cache-buster zodat de browser de nieuwe webp ophaalt
      const withBust = { ...image, url: image.url + "?t=" + Date.now() }
      const next = parksState.map((p) => {
        if (p.park !== parkName) return p
        const np: Park = { ...p, rides: p.rides.map((r) => ({ ...r })) }
        const ride = np.rides.find((r) => r.att === att)
        if (ride) ride.image = withBust
        return np
      })
      setParksState(next)
      const live = next.find((p) => p.park === parkName)
      if (live) {
        // Persisteer de URL zonder ?t=… in de JSON
        const toSave: Park = {
          ...live,
          rides: live.rides.map((r) =>
            r.att === att && r.image
              ? { ...r, image: { ...r.image, url: r.image.url.split("?")[0]! } }
              : r,
          ),
        }
        await apiSave(toSave)
      }
      setSaveState("saved")
    } catch (e: unknown) {
      setSaveState("error")
      setSaveMsg((e as Error).message || "onbekende fout")
    }
  }

  function selectPark(name: string) {
    if (name === selectedPark) return
    setSelectedPark(name)
    setOpenRide(null) // park-switch sluit alle open rides
  }

  function toggleRide(rid: string) {
    setOpenRide((cur) => (cur === rid ? null : rid))
  }

  return (
    <div id="view-admin" className="layout admin-layout">
      <aside className="rail admin-rail">
        <div className="rail-brand">
          <a className="brand" href="/" aria-label="Magikal Kompas">
            <img
              src={`${import.meta.env.BASE_URL}assets/brand/logo.png`}
              alt="Magikal Kompas"
              className="brand-logo"
            />
          </a>
          <span className="admin-badge">Admin</span>
        </div>
        <div className="rail-sec">
          <div className="rail-head">
            <span className="rail-title">Parken</span>
            <a className="minibtn" href="/" title="Terug naar de app">↩ Naar app</a>
          </div>
          <div className="admin-park-list">
            {parksState.map((p) => (
              <button
                key={p.park}
                className={"admin-rail-park " + (p.park === selectedPark ? "on" : "")}
                onClick={() => selectPark(p.park)}
              >
                <Avatar park={p.park} />
                <span className="arp-name">{p.park}</span>
                <Flag park={p.park} />
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="admin-main-col">
        <div className="adminbar">
          <b>Admin · alle wereld-data per attractie</b>
          <span className="sp"></span>
          <SaveIndicator state={saveState} msg={saveMsg} />
        </div>

        {!selectedPark ? (
          <div className="hint">Geen parken in de data.</div>
        ) : (() => {
          const p = park()
          if (!p) return null
          if (!p.rides.length) return <div className="muted">Geen attracties.</div>
          return p.rides.map((r) => (
            <RideBlock
              key={r.att}
              parkName={p.park}
              ride={r}
              candidates={candidates[candKey(p.park, r.att)]}
              open={openRide === r.att}
              onToggleOpen={() => toggleRide(r.att)}
              onSetType={(t) =>
                updateRide(p.park, r.att, (ride) => {
                  ride.type = t
                  ride.tag_source = "admin"
                  ride.tag_confidence = "verified"
                })
              }
              onToggleProp={(pr) =>
                updateRide(p.park, r.att, (ride) => {
                  const cur = new Set(ride.props || [])
                  if (cur.has(pr)) cur.delete(pr)
                  else cur.add(pr)
                  ride.props = [...cur] as PropKey[]
                  ride.tag_source = "admin"
                  ride.tag_confidence = "verified"
                })
              }
              onSetField={(patch) =>
                updateRide(p.park, r.att, (ride) => {
                  applyFieldPatch(ride, patch)
                  ride.tag_source = "admin"
                  ride.tag_confidence = "verified"
                })
              }
              onRefresh={(extra) => loadCands(p.park, r.att, extra)}
              onPick={(c, opts) => pickCandidate(p.park, r.att, c, opts)}
            />
          ))
        })()}
      </div>
    </div>
  )
}

/** Past één veld-patch toe op de ride (mutatie in-place). `oms` wordt
 *  bewust als string overschreven — bij een i18n-object-vorm zou je de
 *  NL-tak corrumperen door 'em ineens een string te maken; ADR-015 staat
 *  toe dat de bron-taal als string blijft, dus we vervangen 't object door
 *  de bewerkte NL-string. Toekomstige multilang-edit krijgt z'n eigen UI. */
function applyFieldPatch(ride: Park["rides"][number], p: RideFieldPatch) {
  switch (p.kind) {
    case "beg":
      ride.beg = p.value
      break
    case "zelf":
      ride.zelf = p.value
      break
    case "max":
      ride.max = p.value
      break
    case "min_age_beg":
      ride.min_age_beg = p.value
      break
    case "min_age_zelf":
      ride.min_age_zelf = p.value
      break
    case "max_age":
      ride.max_age = p.value
      break
    case "oms":
      ride.oms = p.value
      break
    case "source_url":
      ride.source_url = p.value
      break
    case "park_url":
      ride.park_url = p.value
      break
  }
}

/** Parsed de huidige `location.hash` naar park + ride. Onbekende slugs → null. */
function parseHash(parks: Park[]): { park: string | null; ride: string | null } {
  const h = (typeof location !== "undefined" ? location.hash : "") || ""
  const m = h.match(/^#\/([^/]+)(?:\/([^/]+))?$/)
  if (!m) return { park: null, ride: null }
  const ps = decodeURIComponent(m[1]!)
  const as = m[2] ? decodeURIComponent(m[2]) : null
  const park = parks.find((p) => parkSlug(p.park) === ps)
  if (!park) return { park: null, ride: null }
  if (!as) return { park: park.park, ride: null }
  const ride = park.rides.find((r) => attSlug(r.att) === as)
  return { park: park.park, ride: ride ? ride.att : null }
}

function SaveIndicator({ state, msg }: { state: SaveState; msg: string }) {
  let txt = ""
  let cls = ""
  if (state === "saving") {
    txt = "opslaan…"
    cls = "saving"
  } else if (state === "saved") {
    txt = "opgeslagen ✓"
    cls = "saved"
  } else if (state === "error") {
    txt = "fout: " + msg
    cls = "error"
  }
  return <span className={"save-ind " + cls}>{txt}</span>
}
