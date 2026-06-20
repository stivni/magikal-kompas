/* "Wie gaat mee?"-view. Aparte route #/deelnemers (ADR-017).
 *
 * Iedereen is een gewone deelnemer; favorieten (manuele ster) krijgen een
 * eigen sectie bovenaan zolang er minstens één is. Zie ADR-008. */

import { useEffect, useState } from "react"
import type { Category, Member, MemberPrefs, PartyState, PropKey, PropTrap } from "../../shared/types"
import { MemberCard } from "../party/MemberCard"
import { AddMemberWizard, type WizardResult } from "../party/AddMemberWizard"
import { sortMembers } from "../../shared/helpers"
import { emptyPrefs } from "../partyStore"

interface Props {
  party: PartyState
  setParty: (p: PartyState) => void
  onShare: () => void
  /** Naam van een lid dat de parent vraagt te openen (bv. vanuit de samenvatting op Volgorde). */
  pendingExpand?: string | null
  /** Callback wanneer de expand-instructie is verwerkt; parent mag dan zijn state wissen. */
  onExpandConsumed?: () => void
}

export function Deelnemers({ party, setParty, onShare, pendingExpand, onExpandConsumed }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    if (pendingExpand && party.people.some((p) => p.name === pendingExpand)) {
      setExpanded(pendingExpand)
      onExpandConsumed?.()
    }
  }, [pendingExpand, party.people, onExpandConsumed])

  function updateMember(idx: number, m: Member) {
    const next = { ...party, people: party.people.slice() }
    next.people[idx] = m
    setParty(next)
  }

  function toggleOn(idx: number) {
    updateMember(idx, { ...party.people[idx]!, on: !party.people[idx]!.on })
  }

  function toggleFavorite(idx: number) {
    updateMember(idx, { ...party.people[idx]!, favorite: !party.people[idx]!.favorite })
  }

  function getPrefs(name: string): MemberPrefs {
    return party.memberPrefs[name] ?? emptyPrefs()
  }

  function updatePrefs(name: string, updater: (p: MemberPrefs) => MemberPrefs) {
    const next: PartyState = {
      ...party,
      memberPrefs: {
        ...party.memberPrefs,
        [name]: updater(getPrefs(name)),
      },
    }
    setParty(next)
  }

  function setIntensityBand(name: string, band: [number, number] | null) {
    updatePrefs(name, (p) => ({ ...p, intensityBand: band }))
  }

  function setIntensityCeiling(name: string, ceiling: number | null) {
    updatePrefs(name, (p) => ({ ...p, intensityCeiling: ceiling }))
  }

  function setHeightCeiling(name: string, ceiling: number | null) {
    updatePrefs(name, (p) => ({ ...p, heightCeiling: ceiling }))
  }

  function setHeightBand(name: string, band: [number, number] | null) {
    updatePrefs(name, (p) => ({ ...p, heightBand: band }))
  }

  function setCategoryInterest(name: string, cat: Category, on: boolean) {
    updatePrefs(name, (p) => {
      const next = { ...p.categoryInterests }
      if (on) next[cat] = true
      else delete next[cat]
      return { ...p, categoryInterests: next }
    })
  }

  function setPropChoice(name: string, prop: PropKey, v: PropTrap) {
    updatePrefs(name, (p) => {
      const next = { ...p.propChoices }
      if (v === "prima") delete next[prop]
      else next[prop] = v
      return { ...p, propChoices: next }
    })
  }

  function setThemingImportance(name: string, v: "none" | "medium" | "high" | null) {
    updatePrefs(name, (p) => ({ ...p, themingImportance: v }))
  }

  function deleteMember(name: string) {
    if (!confirm("Verwijder " + name + " uit het gezelschap?")) return
    const next: PartyState = {
      ...party,
      people: party.people.filter((p) => p.name !== name),
      memberPrefs: { ...party.memberPrefs },
    }
    delete next.memberPrefs[name]
    if (expanded === name) setExpanded(null)
    setParty(next)
  }

  function onWizardFinish(r: WizardResult) {
    const prefs: MemberPrefs = {
      intensityBand: r.intensityBand,
      intensityCeiling: r.intensityCeiling,
      heightCeiling: r.heightCeiling,
      heightBand: r.heightBand,
      themingImportance: r.themingImportance,
      categoryInterests: r.categoryInterests,
      propChoices: r.propChoices,
      perRideOverride: {},
    }
    const next: PartyState = {
      ...party,
      people: [...party.people, { name: r.name, h: r.h, on: true }],
      memberPrefs: { ...party.memberPrefs, [r.name]: prefs },
    }
    setParty(next)
    setWizardOpen(false)
    setExpanded(r.name)
  }

  const renderCard = (p: Member, i: number) => (
    <MemberCard
      key={p.name + ":" + i}
      index={i}
      member={p}
      open={expanded === p.name}
      party={party}
      prefs={getPrefs(p.name)}
      onToggleOn={() => toggleOn(i)}
      onToggleFavorite={() => toggleFavorite(i)}
      onToggleOpen={() => setExpanded(expanded === p.name ? null : p.name)}
      onChange={(m) => updateMember(i, m)}
      onDelete={() => deleteMember(p.name)}
      setIntensityBand={(band) => setIntensityBand(p.name, band)}
      setIntensityCeiling={(ceiling) => setIntensityCeiling(p.name, ceiling)}
      setHeightCeiling={(ceiling) => setHeightCeiling(p.name, ceiling)}
      setCategoryInterest={(cat, on) => setCategoryInterest(p.name, cat, on)}
      setPropChoice={(prop, v) => setPropChoice(p.name, prop, v)}
      setThemingImportance={(v) => setThemingImportance(p.name, v)}
    />
  )

  const indexed = party.people.map((p, i) => ({ p, i }))
  const order = new Map(sortMembers(party.people).map((p, i) => [p.name, i]))
  const byOrder = (a: { p: Member }, b: { p: Member }) =>
    (order.get(a.p.name) ?? 0) - (order.get(b.p.name) ?? 0)
  const favorites = indexed.filter(({ p }) => p.favorite).sort(byOrder)
  const others = indexed.filter(({ p }) => !p.favorite).sort(byOrder)
  const onCount = party.people.filter((p) => p.on).length
  const total = party.people.length

  return (
    <div className="deelnemers">
      <header className="deeln-head">
        <div className="deeln-title">
          <h2>Wie gaat mee?</h2>
          {total > 0 && (
            <p className="muted">
              {onCount} vandaag mee · {total} {total === 1 ? "deelnemer" : "deelnemers"}
              {favorites.length > 0 ? ` · ${favorites.length} favoriet` : ""}
            </p>
          )}
        </div>
        <div className="deeln-actions">
          {total > 0 && (
            <button className="hdr-btn" onClick={onShare} title="Deelnemers delen">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Deel
            </button>
          )}
          <button className="hdr-btn primary" onClick={() => setWizardOpen(true)}>
            + Lid toevoegen
          </button>
        </div>
      </header>

      {total === 0 ? (
        <div className="empty">
          <div className="art">🧭</div>
          <h2>Eerst je gezelschap</h2>
          <p>
            Magikal Kompas rankt parken op wat haalbaar én leuk is voor wie
            meegaat. Voeg minstens één lid toe — lengte bepaalt de
            haalbaarheid, voorkeuren bepalen het plezier.
          </p>
          <button className="cta" onClick={() => setWizardOpen(true)}>
            + Eerste lid toevoegen
          </button>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <section className="deeln-sec">
              <h3 className="deeln-sub">Favorieten</h3>
              {favorites.map(({ p, i }) => renderCard(p, i))}
            </section>
          )}
          {others.length > 0 && (
            <section className="deeln-sec">
              {favorites.length > 0 && <h3 className="deeln-sub">Andere deelnemers</h3>}
              {others.map(({ p, i }) => renderCard(p, i))}
            </section>
          )}
        </>
      )}

      {wizardOpen && (
        <AddMemberWizard
          existingNames={party.people.map((p) => p.name)}
          excludedParks={party.excludedParks}
          onCancel={() => setWizardOpen(false)}
          onFinish={onWizardFinish}
        />
      )}
    </div>
  )
}
