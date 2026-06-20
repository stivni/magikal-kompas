/* Root-component voor de hoofdapp. Centraliseert party-state, route-state en
 * UI-state (popover, share/merge panels). */

import { useEffect, useRef, useState } from "react"
import type { CountryCode, PartyState, SortKey } from "../shared/types"
import { EMPTY_PARTY, importFromHash, loadParty, saveParty } from "./partyStore"
import type { SharePayload } from "./partyStore"
import { useHashRoute } from "./useHashRoute"
import { Chrome } from "./chrome/Chrome"
import { Parken } from "./views/Parken"
import { Volgorde } from "./views/Volgorde"
import { Deelnemers } from "./views/Deelnemers"
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
  const [shareOpen, setShareOpen] = useState(false)
  const [mergeIncoming, setMergeIncoming] = useState<SharePayload | null>(null)
  const [pendingExpand, setPendingExpand] = useState<string | null>(null)

  function setParty(p: PartyState) {
    setPartyState(p)
    saveParty(p)
  }

  function setTab(t: "parken" | "volgorde" | "deelnemers") {
    setRoute({ tab: t, park: t === "volgorde" ? selectedPark : null })
    setOpenPop(null)
  }

  // Pill = toggle: vanuit een taak naar deelnemers, vanuit deelnemers terug
  // naar de laatste taak. Zo onderbreekt setup je flow niet.
  const lastTaskTab = useRef<"parken" | "volgorde">("parken")
  useEffect(() => {
    if (tab === "parken" || tab === "volgorde") lastTaskTab.current = tab
  }, [tab])
  function togglePill() {
    setTab(tab === "deelnemers" ? lastTaskTab.current : "deelnemers")
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
        memberPrefs: { ...party.memberPrefs },
      }
      incoming.people.forEach((p) => {
        next.people.push({ ...p, favorite: false })
        if (incoming.memberPrefs[p.name]) next.memberPrefs[p.name] = incoming.memberPrefs[p.name]!
      })
      setParty(next)
    } else {
      setMergeIncoming(incoming)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Empty-state is een route-redirect: zonder leden uitkomen op #/parken of
  // #/volgorde is een doodlopende straat; stuur naar #/deelnemers waar de
  // uitnodiging (wizard + cards) staat. Zie ADR-011.
  useEffect(() => {
    if (party.people.length === 0 && (tab === "parken" || tab === "volgorde")) {
      setRoute({ tab: "deelnemers", park: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [party.people.length, tab])

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

  function goToDeelnemers() {
    setTab("deelnemers")
  }

  function editMember(name: string) {
    setPendingExpand(name)
    setTab("deelnemers")
  }

  return (
    <>
      <div className="layout">
        <Chrome
          tab={tab}
          setTab={setTab}
          party={party}
          onTogglePill={togglePill}
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
                onAddMember={goToDeelnemers}
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
                onAddMember={goToDeelnemers}
                onGoToParken={() => setTab("parken")}
                onEditMember={editMember}
              />
            )}
          </section>
          <section
            id="view-deelnemers"
            style={{ display: tab === "deelnemers" ? "" : "none" }}
          >
            {tab === "deelnemers" && (
              <Deelnemers
                party={party}
                setParty={setParty}
                onShare={() => setShareOpen(true)}
                pendingExpand={pendingExpand}
                onExpandConsumed={() => setPendingExpand(null)}
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

      <footer className="thin-foot" aria-label="Belangrijk om te weten">
        <span><span aria-hidden="true">⚠️</span> Check regels lokaal</span>
        <span className="sep">·</span>
        <span><span aria-hidden="true">🔒</span> Blijft op dit toestel</span>
        <span className="sep">·</span>
        <span><span aria-hidden="true">🎢</span> Niet gelieerd aan de parken</span>
        {import.meta.env.DEV && (
          <>
            <span className="sep">·</span>
            <a className="footlink admin-link" href="/admin/">🛠 Admin</a>
          </>
        )}
      </footer>

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
