/* "Welk park?"-view. */

import { useMemo } from "react"
import type { CountryCode, PartyState, SortKey } from "../../shared/types"
import { PARKMETA, ridesOf, parks } from "../../shared/data"
import { makePrefAccess, parkMetrics, parkBehaviorCounts } from "../../shared/scoring"
import { emptyPrefs } from "../partyStore"
import { Avatar } from "../../shared/components/Avatar"
import { Flag } from "../../shared/components/Flag"
import { Controls } from "./Controls"

interface Props {
  party: PartyState
  setParty: (p: PartyState) => void
  sortKey: SortKey
  setSortKey: (s: SortKey) => void
  countryFilter: Set<CountryCode>
  setCountryFilter: (s: Set<CountryCode>) => void
  searchQuery: string
  setSearchQuery: (s: string) => void
  onPickPark: (park: string) => void
  onAddMember: () => void
  openPop: "sort" | "country" | "parks" | null
  setOpenPop: (o: "sort" | "country" | "parks" | null) => void
}

export function Parken({
  party,
  setParty,
  sortKey,
  setSortKey,
  countryFilter,
  setCountryFilter,
  searchQuery,
  setSearchQuery,
  onPickPark,
  onAddMember,
  openPop,
  setOpenPop,
}: Props) {
  const selected = party.people.filter((p) => p.on)
  const pref = useMemo(() => makePrefAccess({}, {}), [])

  function parkTotals(parkSlug: string) {
    const rides = ridesOf(parkSlug)
    const totals = { intrinsiek: 0, voorGroep: 0, saai: 0, alsmoet: 0, nooit: 0, growth: 0, outgrown: 0 }
    for (const k of selected) {
      const prefs = party.memberPrefs[k.name] ?? emptyPrefs()
      const c = parkBehaviorCounts(rides, k, prefs, parkSlug)
      totals.intrinsiek += c.intrinsiek
      totals.voorGroep  += c.voorGroep
      totals.saai       += c.saai
      totals.alsmoet    += c.alsmoet
      totals.nooit      += c.nooit
      totals.growth     += c.growth
      totals.outgrown   += c.outgrown
    }
    const willen = totals.intrinsiek - totals.alsmoet
    const kunnen = totals.intrinsiek + totals.voorGroep + totals.saai + totals.alsmoet
    return { ...totals, willen, kunnen }
  }

  function setExcluded(m: Record<string, boolean>) {
    setParty({ ...party, excludedParks: m })
  }

  if (selected.length === 0) {
    return (
      <EmptyParken party={party} onAddMember={onAddMember} />
    )
  }

  const activeParks = parks.filter((p) => !party.excludedParks[p])
  if (activeParks.length === 0) {
    return (
      <>
        <div className="empty">
          <div className="art">🚫</div>
          <h2>Geen parken in de berekening</h2>
          <p>Je hebt alle parken uitgesloten. Haal er onderaan eentje terug.</p>
        </div>
        <ExcludedParks party={party} setParty={setParty} />
      </>
    )
  }

  const filtered = activeParks.filter((p) => {
    if (countryFilter.size > 0) {
      const c = PARKMETA[p]?.country as CountryCode | undefined
      if (!c || !countryFilter.has(c)) return false
    }
    if (searchQuery.trim()) {
      if (p.toLowerCase().indexOf(searchQuery.trim().toLowerCase()) === -1)
        return false
    }
    return true
  })

  const rows = filtered.map((p) => ({
    p,
    m: parkMetrics(ridesOf(p), selected, pref),
    t: parkTotals(p),
  }))
  rows.sort((a, b) =>
    b.t.willen - a.t.willen || b.t.kunnen - a.t.kunnen,
  )

  const maxWillen = Math.max(1, ...rows.map((r) => r.t.willen))

  const filtersOn = countryFilter.size > 0 || !!searchQuery.trim()

  function clearFilters() {
    setCountryFilter(new Set())
    setSearchQuery("")
  }

  return (
    <>
      <Controls
        sortKey={sortKey}
        setSortKey={setSortKey}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        excludedParks={party.excludedParks}
        setExcludedParks={setExcluded}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openPop={openPop}
        setOpenPop={setOpenPop}
      />
      {filtered.length === 0 ? (
        <div className="filter-summary">
          0 van {activeParks.length} parken voldoen aan de filters ·{" "}
          <a onClick={clearFilters} style={{ cursor: "pointer" }}>
            filters wissen
          </a>
        </div>
      ) : filtersOn ? (
        <div className="filter-summary">
          <b>{filtered.length}</b> van {activeParks.length} parken ·{" "}
          <a onClick={clearFilters} style={{ cursor: "pointer" }}>
            filters wissen
          </a>
        </div>
      ) : null}
      {rows.map(({ p, m, t }) => {
        const barPct = Math.round(Math.max(0, t.willen) / maxWillen * 100)
        return (
          <div className="park-card" key={p}>
            <div className="row" onClick={() => onPickPark(p)}>
              <Avatar park={p} />
              <div className="body">
                <div className="name">
                  {p}
                  <Flag park={p} />
                </div>
                <div className="meta">
                  <span>
                    <b>{m.samen}</b>/{m.total} samen haalbaar
                  </span>
                  <span className="sep"></span>
                  {m.begNeeded === 0 ? (
                    <span className="pill-warn zero">geen begeleider</span>
                  ) : (
                    <span className="pill-warn">
                      tot {m.begNeeded} tegelijk begeleiden
                    </span>
                  )}
                </div>
                <div className="bar">
                  <i style={{ width: barPct + "%" }} />
                </div>
                {(t.intrinsiek + t.voorGroep + t.saai + t.alsmoet + t.nooit + t.growth + t.outgrown) > 0 && (
                  <div className="behavior-bar park-behavior-bar">
                    {t.intrinsiek > 0 && <div className="bb-seg bb-seg--intrinsiek" style={{flexGrow: t.intrinsiek}} title={`😍 ${t.intrinsiek}`}><span className="bb-seg-label">😍 {t.intrinsiek}</span></div>}
                    {t.voorGroep  > 0 && <div className="bb-seg bb-seg--voorGroep"  style={{flexGrow: t.voorGroep}}  title={`🙂 ${t.voorGroep}`}><span className="bb-seg-label">🙂 {t.voorGroep}</span></div>}
                    {t.saai       > 0 && <div className="bb-seg bb-seg--saai"       style={{flexGrow: t.saai}}       title={`🥱 ${t.saai}`}><span className="bb-seg-label">🥱 {t.saai}</span></div>}
                    {t.alsmoet    > 0 && <div className="bb-seg bb-seg--alsmoet"    style={{flexGrow: t.alsmoet}}    title={`😰 ${t.alsmoet}`}><span className="bb-seg-label">😰 {t.alsmoet}</span></div>}
                    {t.nooit      > 0 && <div className="bb-seg bb-seg--nooit"      style={{flexGrow: t.nooit}}      title={`🙅 ${t.nooit}`}><span className="bb-seg-label">🙅 {t.nooit}</span></div>}
                    {t.growth     > 0 && <div className="bb-seg bb-seg--growth"     style={{flexGrow: t.growth}}     title={`🌱 ${t.growth}`}><span className="bb-seg-label">🌱 {t.growth}</span></div>}
                    {t.outgrown   > 0 && <div className="bb-seg bb-seg--outgrown"   style={{flexGrow: t.outgrown}}   title={`🍂 ${t.outgrown}`}><span className="bb-seg-label">🍂 {t.outgrown}</span></div>}
                  </div>
                )}
              </div>
              <div className="score">
                <b>{t.willen}</b>
                <span className="unit">willen</span>
                <span className="alt"><b>{t.kunnen}</b> kunnen</span>
              </div>
            </div>
          </div>
        )
      })}
      <ExcludedParks party={party} setParty={setParty} />
    </>
  )
}

function EmptyParken({
  party,
  onAddMember,
}: {
  party: PartyState
  onAddMember: () => void
}) {
  if (party.people.length === 0) {
    return (
      <div className="empty">
        <div className="art">🧭</div>
        <h2>Eerst je gezelschap</h2>
        <p>
          Magikal Kompas rankt parken op wat haalbaar én leuk is voor wie
          meegaat. Voeg minstens één lid toe — lengte bepaalt de haalbaarheid,
          voorkeuren bepalen het plezier.
        </p>
        <button className="cta" onClick={onAddMember}>
          + Eerste lid toevoegen
        </button>
      </div>
    )
  }
  return (
    <div className="empty">
      <div className="art">👥</div>
      <h2>Vink minstens één lid aan</h2>
      <p>
        Je hebt leden in het gezelschap, maar nog niemand aangevinkt. Vink ze
        aan in de zijbalk om parken te ranken.
      </p>
    </div>
  )
}

function ExcludedParks({
  party,
  setParty,
}: {
  party: PartyState
  setParty: (p: PartyState) => void
}) {
  const excluded = parks.filter((p) => party.excludedParks[p])
  if (!excluded.length) return null
  return (
    <div className="excluded-parks">
      <div className="grp-lbl">Niet meegerekend · {excluded.length}</div>
      {excluded.map((p) => (
        <div className="park-mini" key={p}>
          <Avatar park={p} />
          <div className="park-name">{p}</div>
          <button
            className="linkbtn"
            onClick={() => {
              const next = { ...party.excludedParks }
              delete next[p]
              setParty({ ...party, excludedParks: next })
            }}
          >
            Terug meenemen
          </button>
        </div>
      ))}
    </div>
  )
}
