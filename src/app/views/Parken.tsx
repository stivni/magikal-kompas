/* "Welk park?"-view. */

import { useMemo, useState } from "react"
import type { CountryCode, PartyState, SortKey } from "../../shared/types"
import { PARKMETA, parks, ridesOf } from "../../shared/data"
import { makePrefAccess, parkMetrics } from "../../shared/scoring"
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
  const pref = useMemo(
    () => makePrefAccess(party.typePref, party.propPref),
    [party.typePref, party.propPref],
  )

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
  }))
  rows.sort((a, b) =>
    sortKey === "weak"
      ? b.m.minFav - a.m.minFav ||
        b.m.minScore - a.m.minScore ||
        b.m.avgScore - a.m.avgScore
      : b.m.avgFav - a.m.avgFav || b.m.avgScore - a.m.avgScore,
  )

  const maxVal = rows.reduce(
    (m, r) => Math.max(m, sortKey === "weak" ? r.m.minFav : r.m.avgFav),
    0,
  )

  const filtersOn = countryFilter.size > 0 || !!searchQuery.trim()
  const anyFav = rows.some((r) => r.m.avgFav > 0)

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
      {!anyFav && filtered.length > 0 && (
        <div className="hint">
          Nog geen voorkeuren — parken staan op aantal haalbare attracties. Klap
          een lid open en zet eigenschappen of types.
        </div>
      )}
      {rows.map(({ p, m }) => {
        const bigVal =
          sortKey === "weak" ? m.minFav : m.avgFav.toFixed(1)
        const bigLbl =
          sortKey === "weak"
            ? `favorieten voor ${m.weakKid.k.name}`
            : "favorieten gem."
        const altVal =
          sortKey === "weak" ? m.avgFav.toFixed(1) : m.minFav
        const altLbl =
          sortKey === "weak" ? "gem. p.p." : `zwakste (${m.weakKid.k.name})`
        const barPct =
          maxVal > 0
            ? Math.round(
                ((sortKey === "weak" ? m.minFav : m.avgFav) / maxVal) * 100,
              )
            : 0
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
              </div>
              <div className="score">
                <b>{bigVal}</b>
                <span className="unit">{bigLbl}</span>
                <span className="alt">
                  <b>{altVal}</b> {altLbl}
                </span>
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
