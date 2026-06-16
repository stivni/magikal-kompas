/* Root-component voor de hoofdapp. Centraliseert party-state, route-state en
 * UI-state (popover, share/merge panels). */

import { useEffect, useState } from "react"
import type { CountryCode, PartyState, SortKey } from "../shared/types"
import { EMPTY_PARTY, importFromHash, loadParty, saveParty } from "./partyStore"
import type { SharePayload } from "./partyStore"
import { useHashRoute } from "./useHashRoute"
import { AppBar } from "./chrome/AppBar"
import { Rail } from "./chrome/Rail"
import { Parken } from "./views/Parken"
import { Volgorde } from "./views/Volgorde"
import { SharePanel } from "./party/SharePanel"
import { MergePanel } from "./party/MergePanel"

export function App() {
  const [party, setPartyState] = useState<PartyState>(() => loadParty())
  const { route, setRoute } = useHashRoute()
  const tab = route.tab
  const selectedPark = route.park

  const [sortKey, setSortKey] = useState<SortKey>("weak")
  const [countryFilter, setCountryFilter] = useState<Set<CountryCode>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [openPop, setOpenPop] = useState<"sort" | "country" | "parks" | null>(null)
  const [railOpen, setRailOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [mergeIncoming, setMergeIncoming] = useState<SharePayload | null>(null)

  function setParty(p: PartyState) {
    setPartyState(p)
    saveParty(p)
  }

  function setTab(t: "parken" | "volgorde") {
    setRoute({ tab: t, park: t === "volgorde" ? selectedPark : null })
    setOpenPop(null)
  }

  function setSelectedPark(p: string) {
    setRoute({ tab: "volgorde", park: p })
  }

  // Boot: importeer optionele deel-link uit hash. Eventueel conflict-flow.
  useEffect(() => {
    const incoming = importFromHash()
    if (!incoming) return
    const conflicts = incoming.people.filter((p) =>
      party.people.some((x) => x.name === p.name),
    )
    if (conflicts.length === 0) {
      // direct toevoegen
      const next: PartyState = {
        ...party,
        people: party.people.slice(),
        typePref: { ...party.typePref },
        propPref: { ...party.propPref },
        forceOv: { ...party.forceOv },
      }
      incoming.people.forEach((p) => {
        next.people.push({ ...p })
        if (incoming.typePref[p.name]) next.typePref[p.name] = incoming.typePref[p.name]!
        if (incoming.propPref[p.name]) next.propPref[p.name] = incoming.propPref[p.name]!
        if (incoming.forceOv[p.name]) next.forceOv[p.name] = incoming.forceOv[p.name]!
      })
      setParty(next)
    } else {
      setMergeIncoming(incoming)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Klik buiten een control → popover sluiten.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest(".ctrl") && !target.closest(".popover")) {
        if (openPop) setOpenPop(null)
      }
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [openPop])

  function addMemberPrompt() {
    const raw = prompt("Naam van het nieuwe lid?", "")
    if (!raw) return
    const name = raw.trim()
    if (!name) return
    if (party.people.some((p) => p.name === name)) {
      alert("Die naam bestaat al.")
      return
    }
    setParty({
      ...party,
      people: [...party.people, { name, h: 120, on: true }],
    })
  }

  return (
    <>
      <AppBar
        tab={tab}
        setTab={setTab}
        party={party}
        onOpenRail={() => setRailOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="layout">
        <Rail
          open={railOpen}
          tab={tab}
          setTab={(t) => {
            setTab(t)
            setRailOpen(false)
          }}
          party={party}
          setParty={setParty}
          onClose={() => setRailOpen(false)}
          onShare={() => setShareOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onAbout={() =>
            alert(
              "Magikal Kompas — een persoonlijk hulpje om parken én attracties te kiezen op basis van lengte en voorkeuren. Alles blijft op dit toestel.",
            )
          }
        />
        <main>
          <section
            id="view-parken"
            style={{ display: tab === "parken" ? "" : "none" }}
          >
            {tab === "parken" && (
              <Parken
                party={party}
                setParty={setParty}
                sortKey={sortKey}
                setSortKey={setSortKey}
                countryFilter={countryFilter}
                setCountryFilter={setCountryFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onPickPark={(p) => {
                  setRoute({ tab: "volgorde", park: p })
                }}
                onAddMember={addMemberPrompt}
                openPop={openPop}
                setOpenPop={setOpenPop}
              />
            )}
          </section>
          <section
            id="view-volgorde"
            style={{ display: tab === "volgorde" ? "" : "none" }}
          >
            {tab === "volgorde" && (
              <Volgorde
                party={party}
                setParty={setParty}
                sortKey={sortKey}
                selectedPark={selectedPark}
                setSelectedPark={setSelectedPark}
                onAddMember={addMemberPrompt}
                onGoToParken={() => setTab("parken")}
              />
            )}
          </section>

          <footer className="page-foot">
            <div className="foot-disc">
              <details className="disc-item">
                <summary>
                  <span className="disc-emo">⚠️</span>
                  <span className="disc-lbl">Check regels ter plaatse</span>
                  <span className="disc-info" aria-hidden="true">ℹ</span>
                </summary>
                <div className="disc-body">
                  Lengte-eisen, leeftijdsgrenzen en regels kunnen wijzigen.
                  Kijk altijd op de parksite voor het exacte beleid op jullie
                  datum.
                </div>
              </details>
              <details className="disc-item">
                <summary>
                  <span className="disc-emo">🚦</span>
                  <span className="disc-lbl">Geen reistijd of wachtrijen</span>
                  <span className="disc-info" aria-hidden="true">ℹ</span>
                </summary>
                <div className="disc-body">
                  De volgorde houdt rekening met haalbaarheid en plezier, niet
                  met wandelafstand binnen het park of wachtrijen. Plan zelf de
                  logistiek; gebruik dit als startpunt.
                </div>
              </details>
              <details className="disc-item">
                <summary>
                  <span className="disc-emo">🔒</span>
                  <span className="disc-lbl">Blijft op dit toestel</span>
                  <span className="disc-info" aria-hidden="true">ℹ</span>
                </summary>
                <div className="disc-body">
                  Gezelschap, voorkeuren en instellingen worden lokaal
                  opgeslagen. Delen gebeurt enkel als jij actief een link of QR
                  maakt — er is geen server in het spel.
                </div>
              </details>
              <details className="disc-item">
                <summary>
                  <span className="disc-emo">🎢</span>
                  <span className="disc-lbl">Niet gelieerd aan de parken</span>
                  <span className="disc-info" aria-hidden="true">ℹ</span>
                </summary>
                <div className="disc-body">
                  Magikal Kompas is een persoonlijk hulpje. Park- en
                  attractiedata worden best-effort onderhouden; correcties zijn
                  welkom.
                </div>
              </details>
            </div>
            <div className="foot-meta">
              <span>Magikal Kompas</span>
              <span className="dot-sep"></span>
              <a href="docs/adr/" target="_blank">
                Beslissingen (ADR's)
              </a>
              <span className="dot-sep"></span>
              <a href="https://github.com/" target="_blank">
                Broncode
              </a>
            </div>
          </footer>
        </main>
      </div>

      <div
        className={"scrim " + (settingsOpen ? "show" : "")}
        onClick={() => setSettingsOpen(false)}
      ></div>
      <aside className={"settings " + (settingsOpen ? "show" : "")}>
        <h3>Instellingen</h3>
        <div className="links">
          <a
            onClick={() => {
              setSettingsOpen(false)
              setShareOpen(true)
            }}
            style={{ cursor: "pointer" }}
          >
            <svg
              className="ico-share"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Deelnemers delen
          </a>
          <a href="docs/adr/" target="_blank">
            <span className="ico">📚</span> Beslissingen (ADR's)
          </a>
        </div>
      </aside>

      {shareOpen && (
        <SharePanel party={party} onClose={() => setShareOpen(false)} />
      )}
      {mergeIncoming && (
        <MergePanel
          party={party}
          setParty={setParty}
          incoming={mergeIncoming}
          onClose={() => setMergeIncoming(null)}
        />
      )}
    </>
  )
}
