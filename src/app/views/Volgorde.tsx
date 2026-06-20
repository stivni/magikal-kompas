/* "Wat eerst?"-view: park-picker bovenaan + lijst rides voor één park.
 *
 * Layout per ADR-024 (revisie 2026-06):
 *  - Per-persoon samenvatting met ruwe counters (4 gedragsstaten + 🌱 + 🍂 als aparte signaal-tellers)
 *  - Sorteer-dropdown (Kunnen / Willen / Alfa / Intensiteit / Hoogte)
 *  - Per-attractie kaartje: thumbnail + naam + tags + KAN-pill + WIL-pill
 *  - Klik op kaart → expanded view met per-lid mensentaal
 */

import { useMemo, useState } from "react"
import type {
  Behavior,
  MemberPrefs,
  PartyState,
  Ride,
  RideWithPark,
  SortKey,
} from "../../shared/types"
import { ridesOf, parks } from "../../shared/data"
import {
  briefMatch,
  computeSplitsPlan,
  deriveBehaviorResult,
  groupKanFraction,
  groupKunnenIntersect,
  groupMoetenCounts,
  groupWillenCount,
  groupWilScore,
  groupZullenCount,
  isCompanionNeeded,
  makePrefAccess,
  parkMetrics,
} from "../../shared/scoring"
import { emptyPrefs } from "../partyStore"
import { Avatar } from "../../shared/components/Avatar"
import { Flag } from "../../shared/components/Flag"
import { RideThumb } from "../../shared/components/RideThumb"
import {
  BehaviorBar,
  BEHAVIOR_COUNTER_DEFS,
  type BehaviorCounterKey,
} from "../../shared/components/BehaviorBar"
import { Lightbox } from "../rides/Lightbox"
import { PEMO, PNL, TEMO, TNL } from "../../shared/vocab"
import { colorOf, initialsOf } from "../../shared/helpers"

/** Emoji per gedragsstaat. */
const BEMO: Record<Behavior, string> = {
  intrinsiek: "😍",
  voorGroep: "🙂",
  saai: "🥱",
  alsmoet: "😰",
  nooit: "🙅",
}

type CounterKey = BehaviorCounterKey
const COUNTER_DEFS = BEHAVIOR_COUNTER_DEFS

type RideSortKey = "kunnen" | "willen" | "alfa" | "intensiteit" | "hoogte"
const SORT_OPTIONS: Array<{ key: RideSortKey; nl: string }> = [
  { key: "kunnen", nl: "Kunnen" },
  { key: "willen", nl: "Willen" },
  { key: "alfa", nl: "Alfabetisch" },
  { key: "intensiteit", nl: "Intensiteit" },
  { key: "hoogte", nl: "Hoogte" },
]

function hasNoPrefs(prefs: MemberPrefs): boolean {
  return (
    prefs.intensityBand == null &&
    prefs.heightCeiling == null &&
    Object.keys(prefs.categoryInterests).length === 0 &&
    Object.keys(prefs.propChoices).length === 0 &&
    Object.keys(prefs.perRideOverride).length === 0
  )
}

interface Props {
  party: PartyState
  setParty: (p: PartyState) => void
  sortKey: SortKey
  selectedPark: string | null
  setSelectedPark: (p: string) => void
  onAddMember: () => void
  onGoToParken: () => void
  onEditMember: (name: string) => void
}

interface ActiveFilter {
  member: string
  state: CounterKey
}

export function Volgorde({
  party,
  sortKey,
  selectedPark,
  setSelectedPark,
  onAddMember,
  onGoToParken,
  onEditMember,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lbRide, setLbRide] = useState<RideWithPark | null>(null)
  const [filter, setFilter] = useState<ActiveFilter | null>(null)
  const [rideSort, setRideSort] = useState<RideSortKey>("kunnen")
  const [expandedRide, setExpandedRide] = useState<string | null>(null)
  const [splitsOpen, setSplitsOpen] = useState(false)
  const [tol, setTol] = useState(0)

  function toggleFilter(member: string, state: CounterKey) {
    setFilter((prev) =>
      prev && prev.member === member && prev.state === state
        ? null
        : { member, state },
    )
  }

  const selected = party.people.filter((p) => p.on)
  const pref = useMemo(() => makePrefAccess({}, {}), [])

  function prefsFor(name: string): MemberPrefs {
    return party.memberPrefs[name] ?? emptyPrefs()
  }

  if (selected.length === 0) {
    if (party.people.length === 0) {
      return (
        <div className="empty">
          <div className="art">🎢</div>
          <h2>Eerst gezelschap én park</h2>
          <p>
            De volgorde verandert per gezelschap. Voeg leden toe en kies daarna
            een park.
          </p>
          <button className="cta" onClick={onAddMember}>
            + Eerste lid toevoegen
          </button>
          <div className="alt-link">
            Al een gezelschap? Kies dan eerst{" "}
            <u onClick={onGoToParken} style={{ cursor: "pointer" }}>
              welk park
            </u>
            .
          </div>
        </div>
      )
    }
    return (
      <div className="empty">
        <div className="art">👥</div>
        <h2>Vink minstens één lid aan</h2>
        <p>Open Wie gaat mee? om leden aan te vinken voor de volgorde.</p>
        <button className="cta" onClick={onAddMember}>
          → Wie gaat mee?
        </button>
      </div>
    )
  }

  const activeParks = parks.filter((p) => !party.excludedParks[p])
  if (activeParks.length === 0) {
    return (
      <div className="empty">
        <div className="art">🚫</div>
        <h2>Geen parken in de berekening</h2>
        <p>Ga eerst naar "Welk park?" en haal een uitsluiting terug.</p>
        <button className="cta" onClick={onGoToParken}>
          → Welk park?
        </button>
      </div>
    )
  }

  let parkName = selectedPark
  if (!parkName || !activeParks.includes(parkName)) {
    const rows = activeParks.map((p) => ({
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
    parkName = rows[0]!.p
    queueMicrotask(() => setSelectedPark(parkName!))
  }

  // Bouw per-ride aggregaten één keer op voor zowel sortering als render.
  type RideRow = {
    r: Ride
    kan: ReturnType<typeof groupKanFraction>
    wil: ReturnType<typeof groupWilScore>
  }
  const rideRows: RideRow[] = ridesOf(parkName).map((r) => ({
    r,
    kan: groupKanFraction(r, selected, party.memberPrefs, parkName!),
    wil: groupWilScore(r, selected, party.memberPrefs, parkName!),
  }))

  // Sortering
  rideRows.sort((a, b) => {
    if (rideSort === "alfa") return a.r.att.localeCompare(b.r.att)
    if (rideSort === "intensiteit") {
      const ai = a.r.intensity ?? 0
      const bi = b.r.intensity ?? 0
      return bi - ai || a.r.att.localeCompare(b.r.att)
    }
    if (rideSort === "hoogte") {
      const ah = a.r.height_intensity ?? 0
      const bh = b.r.height_intensity ?? 0
      return bh - ah || a.r.att.localeCompare(b.r.att)
    }
    if (rideSort === "willen") {
      return (
        b.wil.net - a.wil.net ||
        b.kan.passed - a.kan.passed ||
        a.r.att.localeCompare(b.r.att)
      )
    }
    // default: kunnen
    return (
      b.kan.passed - a.kan.passed ||
      b.wil.net - a.wil.net ||
      a.r.att.localeCompare(b.r.att)
    )
  })

  // Filter via klikbare counter
  const visibleRows = filter
    ? rideRows.filter(({ r }) => {
        const member = selected.find((s) => s.name === filter.member)
        if (!member) return true
        const memberPrefs = prefsFor(member.name)
        if (hasNoPrefs(memberPrefs)) return false
        const result = deriveBehaviorResult(member, r, memberPrefs, parkName!)
        if (filter.state === "growth") return "growth" in result
        if (filter.state === "outgrown") return "outgrown" in result
        return "behavior" in result && result.behavior === filter.state
      })
    : rideRows

  return (
    <>
      <div className="parkpicker">
        <Avatar park={parkName} />
        <div className="nm">
          {parkName}
          <Flag park={parkName} />
        </div>
        <button className="chg" onClick={() => setPickerOpen(!pickerOpen)}>
          {pickerOpen ? "Sluiten" : "Wissel ▾"}
        </button>
      </div>
      {pickerOpen && (
        <div className="parkpicker-list">
          {activeParks.map((p) => (
            <div
              key={p}
              className={"pp-item " + (p === parkName ? "on" : "")}
              onClick={() => {
                setSelectedPark(p)
                setPickerOpen(false)
              }}
            >
              <Avatar park={p} />
              <span>{p}</span>
              <Flag park={p} />
            </div>
          ))}
        </div>
      )}

      {/* Per-deelnemer samenvatting */}
      <BehaviorBar
        parkSlug={parkName!}
        members={selected}
        prefsByMember={party.memberPrefs}
        emptyPrefs={emptyPrefs}
        onEditMember={onEditMember}
        activeFilter={filter}
        onToggleFilter={toggleFilter}
      />
      {filter && (
        <button
          type="button"
          className="behavior-filter-clear"
          onClick={() => setFilter(null)}
        >
          ✕ Filter wissen ({filter.member} ·{" "}
          {COUNTER_DEFS.find((c) => c.key === filter.state)?.emoji ?? "?"})
        </button>
      )}

      {/* Verb-conclusion-pills: KUNNEN · WILLEN · MOETEN · ZULLEN · SPLITS */}
      {(() => {
        const allRides = ridesOf(parkName!)
        const kunnen = groupKunnenIntersect(allRides, selected, party.memberPrefs, emptyPrefs, parkName!)
        const willen = groupWillenCount(allRides, selected, party.memberPrefs, emptyPrefs, parkName!)
        const moeten = groupMoetenCounts(allRides, selected, party.memberPrefs, emptyPrefs, parkName!)
        const zullen = groupZullenCount(allRides, selected, party.memberPrefs, emptyPrefs, parkName!)
        const splitsplan = computeSplitsPlan(allRides, selected, party.memberPrefs, emptyPrefs, parkName!, tol)
        const splitsRidesCount = splitsplan.splits.reduce((s, c) => s + c.rides.length, 0)
        const hasAny = kunnen > 0 || willen > 0 || moeten.saai > 0 || moeten.wild > 0 || zullen > 0 || splitsplan.splits.length > 0
        if (!hasAny) return null
        const tolLabel = tol === 0
          ? "streng — niemand gedwongen"
          : tol === 1
            ? "lichte opoffering OK"
            : tol === 2
              ? "twee opofferingen OK"
              : "veel opofferingen OK"
        return (
          <>
            <div
              className="tol-stepper"
              title="Hoeveel forced-leden per moment toegestaan? Verschuift de balans tussen splits en MOETEN."
            >
              <span className="tol-key">Moeite-budget:</span>
              <button
                className="tol-btn"
                onClick={() => setTol((t) => Math.max(0, t - 1))}
                disabled={tol === 0}
                aria-label="Moeite-budget verlagen"
              >
                −
              </button>
              <span className="tol-val">{tol}</span>
              <button
                className="tol-btn"
                onClick={() => setTol((t) => Math.min(selected.length, t + 1))}
                disabled={tol >= selected.length}
                aria-label="Moeite-budget verhogen"
              >
                +
              </button>
              <span className="tol-label">{tolLabel}</span>
            </div>
            <div className="verb-pills">
              {kunnen > 0 && (
                <span
                  className="verb-pill verb-pill--kunnen"
                  title={`Samen kunnen jullie ${kunnen} attractie${kunnen === 1 ? "" : "s"} doen (iedereen kan mee)`}
                >
                  <span className="vp-label">KUNNEN</span>
                  <span className="vp-value">{kunnen}</span>
                </span>
              )}
              {willen > 0 && (
                <span
                  className="verb-pill verb-pill--willen"
                  title={`${willen} attractie${willen === 1 ? " wil" : "s willen"} minstens iemand graag (niemand uitgesloten)`}
                >
                  <span className="vp-label">WILLEN</span>
                  <span className="vp-value">{willen}</span>
                </span>
              )}
              {(moeten.saai > 0 || moeten.wild > 0) && (
                <span
                  className="verb-pill verb-pill--moeten"
                  title={`MOETEN: ${moeten.saai} keer te saai maar toch mee (🥱), ${moeten.wild} keer te spannend maar toch mee (😰)`}
                >
                  <span className="vp-label">MOETEN</span>
                  <span className="vp-value">
                    {moeten.saai > 0 && <span className="vp-moeten-saai">{moeten.saai} 🥱</span>}
                    {moeten.saai > 0 && moeten.wild > 0 && <span className="vp-sep"> · </span>}
                    {moeten.wild > 0 && <span className="vp-moeten-wild">{moeten.wild} 😰</span>}
                  </span>
                </span>
              )}
              {zullen > 0 && (
                <span
                  className="verb-pill verb-pill--zullen"
                  title={`${zullen} attractie${zullen === 1 ? " kan" : "s kunnen"} binnenkort ook (🌱 groeit er naartoe)`}
                >
                  <span className="vp-label">ZULLEN</span>
                  <span className="vp-value">{zullen} 🌱</span>
                </span>
              )}
              {splitsplan.splits.length > 0 && (
                <span
                  className="verb-pill verb-pill--splits"
                  title={`${splitsRidesCount} rides via ${splitsplan.splits.length} splits-configuraties — klik voor detail`}
                  onClick={() => setSplitsOpen((o) => !o)}
                  role="button"
                  aria-expanded={splitsOpen}
                >
                  <span className="vp-label">SPLITS</span>
                  <span className="vp-value">
                    {splitsplan.splits.length} cfg · {splitsRidesCount} rides
                  </span>
                </span>
              )}
            </div>
            {splitsOpen && splitsplan.splits.length > 0 && (
              <div className="splits-panel">
                {splitsplan.splits.map((cfg) => {
                  const kanFirst5 = cfg.wachtenden_kan.slice(0, 5)
                  const kanRest = cfg.wachtenden_kan.length - 5
                  return (
                    <div className="splits-config" key={cfg.configKey}>
                      <div className="splits-config-title">
                        Configuratie · {cfg.rides.length} ride{cfg.rides.length === 1 ? "" : "s"}
                      </div>
                      <div className="splits-people">
                        <strong>Doet de rit:</strong> {cfg.actieve.join(", ")}
                      </div>
                      <div className="splits-people">
                        <strong>Blijft achter:</strong> {cfg.wachtenden.join(", ")}
                      </div>
                      {cfg.wachtenden_kan.length > 0 && (
                        <div className="splits-wachtenden-kan">
                          <strong>Wachtenden kunnen samen:</strong>{" "}
                          {kanFirst5.map((r) => r.att).join(", ")}
                          {kanRest > 0 && ` +${kanRest} meer`}
                        </div>
                      )}
                    </div>
                  )
                })}
                {splitsplan.onmogelijk.length > 0 && (
                  <div className="onmogelijk">
                    + {splitsplan.onmogelijk.length} ride{splitsplan.onmogelijk.length === 1 ? "" : "s"} alleen met MOETEN haalbaar
                  </div>
                )}
              </div>
            )}
          </>
        )
      })()}

      {/* Sorteer-bar */}
      <div className="ride-toolbar">
        <span className="grp-lbl">
          {filter ? `${visibleRows.length} gefilterd` : `${rideRows.length} attracties`}
        </span>
        <label className="sort-pick">
          Sorteer op{" "}
          <select
            value={rideSort}
            onChange={(e) => setRideSort(e.target.value as RideSortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.nl}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Ride-lijst */}
      {visibleRows.map(({ r, kan, wil }) => {
        const ty = r.type
        const props = r.props || []
        const isOpen = expandedRide === r.att

        // Kleur-class voor KAN-pill
        let kanClass = ""
        if (kan.passed === kan.total) {
          kanClass = kan.needsCompanion ? " kan-amber" : " kan-green"
        } else if (kan.passed === 0) {
          kanClass = " kan-zero"
        }

        // Kleur-class voor WIL-pill
        let wilClass = ""
        if (wil.net > 0) wilClass = " wil-pos"
        else if (wil.net < 0) wilClass = " wil-neg"

        return (
          <div
            className={"ride-row" + (isOpen ? " open" : "")}
            key={r.att}
          >
            <button
              type="button"
              className="ride-row-head"
              onClick={() => setExpandedRide(isOpen ? null : r.att)}
              aria-expanded={isOpen}
            >
              <span
                className="ride-thumb-wrap"
                onClick={(e) => {
                  e.stopPropagation()
                  setLbRide({ ...r, park: parkName! })
                }}
                role="button"
                aria-label="Foto vergroten"
              >
                <RideThumb ride={r} onOpen={() => setLbRide({ ...r, park: parkName! })} />
              </span>
              <span className="rr-text">
                <span className="att">{r.att}</span>
                <span className="tags">
                  <span className="tchip">
                    {TEMO[ty]} {TNL[ty]}
                  </span>
                  {r.intensity != null && (
                    <span className="ptag intensity-tag" title={"Intensiteit " + r.intensity + "/5"}>
                      ⚡ {r.intensity}
                    </span>
                  )}
                  {r.height_intensity != null && (
                    <span className="ptag height-tag" title={"Hoogte-beleving " + r.height_intensity + "/5"}>
                      🗼 {r.height_intensity}
                    </span>
                  )}
                  {props.map((pr) => (
                    <span className="ptag" key={pr} title={PNL[pr]}>
                      {PEMO[pr]}
                    </span>
                  ))}
                </span>
              </span>
              <span className="rr-aggr">
                <span className={"agg-pill kan-pill" + kanClass} title="Kunnen">
                  <span className="agg-label">KAN</span>
                  <span className="agg-value">
                    {kan.passed}/{kan.total}
                    {kan.needsCompanion && kan.passed === kan.total ? " 🅱" : ""}
                  </span>
                </span>
                <span className={"agg-pill wil-pill" + wilClass} title="Willen">
                  <span className="agg-label">WIL</span>
                  <span className="agg-value">
                    {wil.net > 0 ? "+" : ""}
                    {wil.net}
                    <small> ({wil.plus > 0 ? `+${wil.plus}` : "0"}{wil.minus > 0 ? `−${wil.minus}` : ""})</small>
                  </span>
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="ride-expanded">
                {/* Linker kolom: attractie-datafiche */}
                <div className="re-info">
                  {(() => {
                    const oms = typeof r.oms === "string" ? r.oms : r.oms?.nl
                    if (oms && oms.trim()) {
                      return <p className="re-oms">{oms}</p>
                    }
                    return null
                  })()}

                  <dl className="re-spec">
                    <dt>Type</dt><dd>{TNL[ty]}</dd>
                    {r.intensity != null && (<><dt>Intensiteit</dt><dd>⚡ {r.intensity}/5</dd></>)}
                    {r.height_intensity != null && (<><dt>Hoogte (beleving)</dt><dd>🗼 {r.height_intensity}/5</dd></>)}
                    {r.top_speed_kmh != null && (<><dt>Topsnelheid</dt><dd>{r.top_speed_kmh} km/u</dd></>)}
                    {r.max_height_m != null && (<><dt>Hoogte (m)</dt><dd>{r.max_height_m} m</dd></>)}
                    {r.drop_m != null && (<><dt>Drop</dt><dd>{r.drop_m} m</dd></>)}
                    {r.inversions_count != null && r.inversions_count > 0 && (<><dt>Inversies</dt><dd>{r.inversions_count}×</dd></>)}
                    {r.duration_s != null && (<><dt>Duur</dt><dd>{Math.floor(r.duration_s / 60)}:{String(r.duration_s % 60).padStart(2, "0")}</dd></>)}
                    {r.g_force != null && (<><dt>G-kracht</dt><dd>{r.g_force}g</dd></>)}
                    {props.length > 0 && (<><dt>Eigenschappen</dt><dd>{props.map((pr) => PNL[pr]).join(", ")}</dd></>)}
                    {r.theming === "high" && (<><dt>Thematisatie</dt><dd>✨ volle wereld</dd></>)}
                    {r.theming === "medium" && (<><dt>Thematisatie</dt><dd>🏰 sterke sfeer</dd></>)}
                    {r.theming === "light" && (<><dt>Thematisatie</dt><dd>🌿 lichte sfeer</dd></>)}
                    {(r.beg != null || r.zelf != null) && (
                      <>
                        <dt>Lengte</dt>
                        <dd>
                          {r.beg != null && r.beg > 0 ? `≥${r.beg}cm met begeleiding` : ""}
                          {r.beg != null && r.beg > 0 && r.zelf != null && r.zelf > r.beg ? " · " : ""}
                          {r.zelf != null && r.zelf > 0 && (r.beg == null || r.zelf > r.beg) ? `≥${r.zelf}cm zelfstandig` : ""}
                          {r.max != null ? ` · ≤${r.max}cm` : ""}
                        </dd>
                      </>
                    )}
                  </dl>

                  {r.park_url && (
                    <div className="re-source">
                      <a href={r.park_url} target="_blank" rel="noreferrer">
                        Meer info op parksite ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Rechter kolom: per-deelnemer matches (kort) */}
                <div className="re-matches">
                  <div className="re-people-title">Per deelnemer</div>
                  {selected.map((k) => {
                    const memberPrefs = prefsFor(k.name)
                    const noPrefs = hasNoPrefs(memberPrefs)
                    if (noPrefs) {
                      return (
                        <div className="re-row re-row--noprefs" key={k.name}>
                          <span
                            className="re-ava"
                            style={{ ["--col" as string]: colorOf(k.name) }}
                          >
                            {initialsOf(k.name)}
                          </span>
                          <span className="re-emo">?</span>
                          <span className="re-tag">geen voorkeuren</span>
                        </div>
                      )
                    }
                    const result = deriveBehaviorResult(k, r, memberPrefs, parkName!)
                    let emoji: string
                    let stateClass: string
                    if ("growth" in result) { emoji = "🌱"; stateClass = "growth" }
                    else if ("outgrown" in result) { emoji = "🍂"; stateClass = "outgrown" }
                    else { emoji = BEMO[result.behavior]; stateClass = result.behavior }
                    const isSignal = "growth" in result || "outgrown" in result
                    const companion = !isSignal && isCompanionNeeded(k, r)
                    const tag = briefMatch(k, r, memberPrefs, parkName!)
                    return (
                      <div className={"re-row re-row--" + stateClass} key={k.name}>
                        <span
                          className="re-ava"
                          style={{ ["--col" as string]: colorOf(k.name) }}
                        >
                          {initialsOf(k.name)}
                        </span>
                        <span className="re-emo">
                          {emoji}
                          {companion && <span className="re-comp" aria-label="begeleidt">🅱</span>}
                        </span>
                        <span className="re-tag">{tag}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {lbRide && <Lightbox ride={lbRide} onClose={() => setLbRide(null)} />}
    </>
  )
}
