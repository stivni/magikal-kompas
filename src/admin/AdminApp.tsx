/* Admin-root: parken-rail links + per-attractie editor-blokken rechts.
 * Rides starten collapsed; één ride tegelijk open. */

import { useEffect, useState } from "react"
import type { ActivityEntry, Park, PhotoCandidate, PropKey, Ride } from "../shared/types"
import { PARK_DATA, parks } from "../shared/data"
import { Avatar } from "../shared/components/Avatar"
import { Flag } from "../shared/components/Flag"
import { RideBlock, type RideFieldPatch } from "./RideBlock"
import { CategorizeView } from "./CategorizeView"
import { apiCandidates, apiPhoto, apiSave } from "./api"
import { attSlug, parkSlug } from "../shared/helpers"

type SaveState = "idle" | "saving" | "saved" | "error"
type Mode = "curate" | "categorize"

export function AdminApp() {
  // We muteren een lokale kopie van PARK_DATA zodat React's render reageert.
  // Saven gebeurt via /api/save met de volledige park-JSON.
  const [parksState, setParksState] = useState<Park[]>(() =>
    PARK_DATA.map((p) => structuredClone(p)),
  )

  // Initial state komt uit de URL-hash. Schema:
  //   #/categorize            → categorize-experiment-view
  //   #/<park-slug>           → park geselecteerd, niets open
  //   #/<park-slug>/<att-slug> → park + open ride
  //   leeg / onbekend          → parks[0], niets open (hash wordt stilzwijgend gecorrigeerd)
  const initial = parseHash(parksState)
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [selectedPark, setSelectedPark] = useState<string | null>(
    initial.park ?? (parks[0] || null),
  )
  const [openRide, setOpenRide] = useState<string | null>(initial.ride)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveMsg, setSaveMsg] = useState("")

  // Houd de hash gesynchroniseerd met de state (replaceState — geen history-rommel).
  useEffect(() => {
    let h: string
    if (mode === "categorize") {
      h = "#/categorize"
    } else {
      if (!selectedPark) return
      const slug = parkSlug(selectedPark)
      const p = parksState.find((pp) => pp.park === selectedPark)
      const ride = openRide && p ? p.rides.find((r) => r.att === openRide) : null
      h = "#/" + slug + (ride ? "/" + attSlug(ride.att) : "")
    }
    if (location.hash !== h) {
      history.replaceState(null, "", location.pathname + location.search + h)
    }
  }, [mode, selectedPark, openRide, parksState])

  // Externe hash-wijziging (back/forward, handmatig typen) overneemt de state.
  // We corrigeren de hash hier ook actief — als parseHash niets vindt en de
  // state onveranderd blijft, zou de sync-effect onder niet triggeren en
  // bleef een ongeldige hash (`#/blah/foo`) zichtbaar.
  useEffect(() => {
    function onChange() {
      const r = parseHash(parksState)
      setMode(r.mode)
      if (r.mode !== "curate") return
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
    mutate: (r: Ride, prev: Ride) => void,
  ) {
    const next = parksState.map((p) => {
      if (p.park !== parkName) return p
      const np: Park = { ...p, rides: p.rides.map((r) => ({ ...r })) }
      const ride = np.rides.find((r) => r.att === att)
      if (ride) {
        const prev = structuredClone(ride)
        mutate(ride, prev)
      }
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

  async function loadCands(
    parkName: string,
    att: string,
    extra?: string,
    opts?: { refresh?: boolean },
  ) {
    const k = candKey(parkName, att)
    setCandidates((c) => ({ ...c, [k]: "loading" }))
    try {
      const arr = await apiCandidates(parkName, att, extra, opts)
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
    if (mode !== "curate") return
    const p = park()
    if (!p) return
    p.rides.forEach((r) => {
      const k = candKey(p.park, r.att)
      if (candidates[k] == null) {
        loadCands(p.park, r.att)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedPark])

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

  if (mode === "categorize") {
    return (
      <div id="view-admin" className="admin-full">
        <header className="admin-fullbar">
          <a className="brand" href="/" aria-label="Magikal Kompas">
            <img
              src={`${import.meta.env.BASE_URL}assets/brand/logo.png`}
              alt="Magikal Kompas"
              className="brand-logo"
            />
          </a>
          <span className="admin-badge">Admin</span>
          <ModeSwitch mode={mode} setMode={setMode} />
          <div className="spacer" />
          <a className="linkbtn" href="/" title="Terug naar de app">↩ Naar app</a>
        </header>
        <main className="admin-full-main">
          <CategorizeView parks={parksState} />
        </main>
      </div>
    )
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
          <ModeSwitch mode={mode} setMode={setMode} />
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

      <SaveIndicator state={saveState} msg={saveMsg} />

      <div className="admin-main-col">
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
                updateRide(p.park, r.att, (ride, prev) => {
                  ride.type = t
                  ride.tag_source = "admin"
                  const changes = computeChanges(prev, ride, ["type"])
                  if (Object.keys(changes).length) {
                    pushActivity(ride, { at: nowIso(), by: "admin", changes })
                  }
                })
              }
              onToggleProp={(pr) =>
                updateRide(p.park, r.att, (ride, prev) => {
                  const cur = new Set(ride.props || [])
                  if (cur.has(pr)) cur.delete(pr)
                  else cur.add(pr)
                  ride.props = [...cur] as PropKey[]
                  ride.tag_source = "admin"
                  const changes = computeChanges(prev, ride, ["props"])
                  if (Object.keys(changes).length) {
                    pushActivity(ride, { at: nowIso(), by: "admin", changes })
                  }
                })
              }
              onSetField={(patch) =>
                updateRide(p.park, r.att, (ride, prev) => {
                  applyFieldPatch(ride, patch)
                  ride.tag_source = "admin"
                  const changes = computeChanges(prev, ride, [patch.kind])
                  if (Object.keys(changes).length) {
                    pushActivity(ride, { at: nowIso(), by: "admin", changes })
                  }
                })
              }
              onVerify={() =>
                updateRide(p.park, r.att, (ride) => {
                  ride.tag_source = "admin"
                  ride.tag_confidence = "verified"
                  pushActivity(ride, { at: nowIso(), by: "admin", verified: true })
                })
              }
              onRefresh={(extra) => loadCands(p.park, r.att, extra, { refresh: true })}
              onPick={(c, opts) => pickCandidate(p.park, r.att, c, opts)}
            />
          ))
        })()}
      </div>
    </div>
  )
}

function nowIso(): string {
  return new Date().toISOString()
}

const MERGE_WINDOW_MS = 10 * 60 * 1000

/** Cap = 3, nieuwste vooraan. Samenvoegen als laatste entry van dezelfde auteur
 *  binnen het merge-venster valt en ook een changes-entry is (geen verified). */
function pushActivity(ride: Ride, entry: ActivityEntry) {
  const cur = ride.activity ?? []
  const last = cur[0]
  if (
    "changes" in entry &&
    last &&
    "changes" in last &&
    last.by === entry.by &&
    new Date(entry.at).getTime() - new Date(last.at).getTime() < MERGE_WINDOW_MS
  ) {
    const mergedChanges = { ...last.changes }
    for (const [k, change] of Object.entries(entry.changes)) {
      const existing = mergedChanges[k]
      if (existing) {
        if (equals(existing.from, change.to)) {
          delete mergedChanges[k] // teruggedraaid naar origineel
        } else {
          mergedChanges[k] = { from: existing.from, to: change.to }
        }
      } else {
        mergedChanges[k] = change
      }
    }
    const merged: ActivityEntry = {
      at: entry.at,
      by: entry.by,
      changes: mergedChanges,
    }
    ride.activity = [merged, ...cur.slice(1)].slice(0, 3)
  } else {
    ride.activity = [entry, ...cur].slice(0, 3)
  }
}

/** Bereken diff per opgegeven veld; alleen velden die echt veranderden. Voor
 *  arrays/objecten plaatst hij hele waarde in `from`/`to`. */
function computeChanges(
  prev: Ride,
  next: Ride,
  fieldKeys: string[],
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {}
  for (const k of fieldKeys) {
    const a = (prev as unknown as Record<string, unknown>)[k]
    const b = (next as unknown as Record<string, unknown>)[k]
    if (!equals(a, b)) out[k] = { from: a, to: b }
  }
  return out
}

function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!equals(a[i], b[i])) return false
    return true
  }
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>
    const bo = b as Record<string, unknown>
    const ak = Object.keys(ao)
    const bk = Object.keys(bo)
    if (ak.length !== bk.length) return false
    for (const k of ak) if (!equals(ao[k], bo[k])) return false
    return true
  }
  return false
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
    case "sources":
      ride.sources = p.value
      break
    case "park_url":
      ride.park_url = p.value
      break
    case "intensity":
      if (p.value == null) delete (ride as { intensity?: number }).intensity
      else ride.intensity = p.value
      break
    case "height_intensity":
      if (p.value == null) delete (ride as { height_intensity?: number }).height_intensity
      else ride.height_intensity = p.value
      break
    case "theming":
      if (p.value == null) delete (ride as { theming?: string }).theming
      else ride.theming = p.value
      break
  }
}

/** Parsed de huidige `location.hash` naar mode + park + ride. */
function parseHash(parks: Park[]): { mode: Mode; park: string | null; ride: string | null } {
  const h = (typeof location !== "undefined" ? location.hash : "") || ""
  if (h === "#/categorize") return { mode: "categorize", park: null, ride: null }
  const m = h.match(/^#\/([^/]+)(?:\/([^/]+))?$/)
  if (!m) return { mode: "curate", park: null, ride: null }
  const ps = decodeURIComponent(m[1]!)
  const as = m[2] ? decodeURIComponent(m[2]) : null
  const park = parks.find((p) => parkSlug(p.park) === ps)
  if (!park) return { mode: "curate", park: null, ride: null }
  if (!as) return { mode: "curate", park: park.park, ride: null }
  const ride = park.rides.find((r) => attSlug(r.att) === as)
  return { mode: "curate", park: park.park, ride: ride ? ride.att : null }
}

function SaveIndicator({ state, msg }: { state: SaveState; msg: string }) {
  if (state === "idle") return null
  let txt = ""
  if (state === "saving") txt = "opslaan…"
  else if (state === "saved") txt = "opgeslagen ✓"
  else if (state === "error") txt = "fout: " + msg
  return <div className={"save-toast " + state} role="status">{txt}</div>
}

function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="admin-mode-switch">
      <button
        className={"admin-mode-btn " + (mode === "curate" ? "on" : "")}
        onClick={() => setMode("curate")}
      >
        Foto-curatie
      </button>
      <button
        className={"admin-mode-btn " + (mode === "categorize" ? "on" : "")}
        onClick={() => setMode("categorize")}
        title="Type / intensiteit / hoogte curatie"
      >
        Categoriseren
      </button>
    </div>
  )
}
