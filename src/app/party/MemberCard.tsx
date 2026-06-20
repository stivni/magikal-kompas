/* Lid-kaart: ingeklapt = naam/lengte/leeftijd; opengeklapt = lengte-slider,
 * geboortedatum, voorkeur-instellingen (ADR-024 v2) en verwijder-knop.
 *
 * Voorkeur-secties (na agefield + datahint, voor m-actions):
 *   1. Intensiteits-band + "no way!"-grens — tap-to-fill gradient met ✕-knoppen
 *   2. Hoogte plafond — alleen plafond (geen band)
 *   3. Categorie-interesses — multi-select toggles
 *   4. Thematisatie-belang — 3 single-select
 *   5. Props drietrap — 6 props, geen high/fast/themed
 */

import { useMemo, useState } from "react"
import type { Category, Member, MemberPrefs, PropKey, PropTrap } from "../../shared/types"
import { ageRange, ageBorderline } from "../../shared/scoring"
import { parks, ridesOf } from "../../shared/data"
import { t } from "../../shared/i18n"
import type { PartyState } from "../../shared/types"
import { CATEGORIES, INTENSITY_ANCHORS, HEIGHT_ANCHORS, THEMING_IMPORTANCE_LEVELS, PEMO, PNL } from "../../shared/vocab"
import { applyBandTap } from "./AddMemberWizard"

const HMIN = 70
const HMAX = 200

/** Gradient kleuren per segment (1-5, index=segment-1) — identiek aan wizard */
const GRADIENT_COLORS = ["#97C459", "#C0DD97", "#FAC775", "#EF9F27", "#E24B4A"]

/** Props in de drietrap (ADR-024 v2): geen high, fast, of themed. */
const MEMBER_CARD_PROPS: PropKey[] = ["wet", "dark", "scary", "spins", "inversions", "swings"]

// ─── Sub-component: GradientBar met optioneel ceiling-knop (identiek aan wizard) ──

interface GradientBarProps {
  band: [number, number] | null
  ceiling: number | null
  anchors: Array<{ level: number; label: string }>
  onTapBand: (level: number) => void
  onTapCeiling: (level: number) => void
}

function GradientBar({
  band,
  ceiling,
  anchors,
  onTapBand,
  onTapCeiling,
}: GradientBarProps) {
  return (
    <div className="wiz-gradient">
      {anchors.map(({ level, label }) => {
        const inBand = band !== null && level >= band[0] && level <= band[1]
        const aboveBand = band !== null ? level > band[1] : true
        const isCeilingMark = ceiling === level
        const isExcluded = ceiling !== null && level >= ceiling
        const isAlsmoet =
          !inBand && !isExcluded && band !== null && level > band[1]

        let segClass = "wiz-segment"
        if (inBand) segClass += " on"
        else if (isExcluded) segClass += " excluded"
        else if (isAlsmoet) segClass += " alsmoet"

        return (
          <div key={level} className="wiz-segment-wrap">
            {aboveBand && (
              <button
                type="button"
                className={
                  "wiz-segment-ceiling-btn" +
                  (isCeilingMark ? " active" : "")
                }
                onClick={(e) => {
                  e.stopPropagation()
                  onTapCeiling(level)
                }}
                aria-label={
                  isCeilingMark
                    ? `Verwijder no way!-grens op ${level}`
                    : `No way! vanaf ${level}`
                }
                title={
                  isCeilingMark
                    ? "No way!-grens verwijderen"
                    : "No way! vanaf hier"
                }
              >
                ✕
              </button>
            )}
            <button
              className={segClass}
              style={{
                background: inBand ? GRADIENT_COLORS[level - 1] : undefined,
              }}
              onClick={() => onTapBand(level)}
              type="button"
              aria-pressed={inBand}
            >
              <span className="wiz-segment-num">{level}</span>
              <span className="wiz-segment-lbl">{label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Hoogte-gradient: enkele plafond-keuze. Tap = "tot hier kan ik". */
function HeightGradient({
  ceiling,
  anchors,
  onTapLevel,
}: {
  ceiling: number | null
  anchors: Array<{ level: number; label: string }>
  onTapLevel: (level: number) => void
}) {
  return (
    <div className="wiz-gradient">
      {anchors.map(({ level, label }) => {
        const inRange = ceiling !== null && level <= ceiling
        const isExcluded = ceiling !== null && level > ceiling
        let segClass = "wiz-segment"
        if (inRange) segClass += " on"
        else if (isExcluded) segClass += " excluded"
        return (
          <div key={level} className="wiz-segment-wrap">
            <button
              className={segClass}
              style={{
                background: inRange ? GRADIENT_COLORS[level - 1] : undefined,
              }}
              onClick={() => onTapLevel(level)}
              type="button"
              aria-pressed={inRange}
            >
              <span className="wiz-segment-num">{level}</span>
              <span className="wiz-segment-lbl">{label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helper functies ──────────────────────────────────────────────────────────

function memberAgeLabel(p: Member): React.ReactNode {
  if (p.birthYear == null) return null
  const r = ageRange(p, new Date())
  if (!r) return null
  if (r.lo === r.hi)
    return (
      <>
        {" · "}
        {r.lo}
        <small>j</small>
      </>
    )
  return (
    <>
      {" · "}
      {r.lo}–{r.hi}
      <small>j</small>
    </>
  )
}

function missingDataFor(p: Member, party: PartyState): string[] {
  let needH = false
  let needYear = false
  let needPrec = false
  parks
    .filter((park) => !party.excludedParks[park])
    .forEach((park) =>
      ridesOf(park).forEach((r) => {
        if (p.h == null && (r.beg != null || r.zelf != null || r.max != null))
          needH = true
        const hasAgeReq =
          r.min_age_beg != null || r.min_age_zelf != null || r.max_age != null
        if (!hasAgeReq) return
        if (p.birthYear == null) needYear = true
        else if (ageBorderline(p, r)) needPrec = true
      }),
    )
  const out: string[] = []
  if (needH) out.push("lengte")
  if (needYear) out.push("geboortejaar")
  else if (needPrec) out.push("geboortemaand")
  return out
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  index: number
  member: Member
  open: boolean
  party: PartyState
  prefs: MemberPrefs
  onToggleOn: () => void
  onToggleFavorite: () => void
  onToggleOpen: () => void
  onChange: (m: Member) => void
  onDelete: () => void
  setIntensityBand: (band: [number, number] | null) => void
  setIntensityCeiling: (ceiling: number | null) => void
  setHeightCeiling: (ceiling: number | null) => void
  setCategoryInterest: (cat: Category, on: boolean) => void
  setPropChoice: (prop: PropKey, v: PropTrap) => void
  setThemingImportance: (v: "none" | "medium" | "high" | null) => void
}

// ─── MemberCard ───────────────────────────────────────────────────────────────

export function MemberCard({
  index: _index,
  member: p,
  open,
  party,
  prefs,
  onToggleOn,
  onToggleFavorite,
  onToggleOpen,
  onChange,
  onDelete,
  setIntensityBand,
  setIntensityCeiling,
  setHeightCeiling,
  setCategoryInterest,
  setPropChoice,
  setThemingImportance,
}: Props) {
  const fill = p.h != null ? (((p.h - HMIN) / (HMAX - HMIN)) * 100).toFixed(1) : "0"
  const ticks = useMemo(() => {
    const arr: React.ReactNode[] = []
    for (let cm = HMIN; cm <= HMAX; cm += 5) {
      const x = (((cm - HMIN) / (HMAX - HMIN)) * 100).toFixed(2)
      arr.push(
        <i
          key={cm}
          className={cm % 10 === 0 ? "maj" : "min"}
          style={{ left: x + "%" }}
        />,
      )
    }
    return arr
  }, [])

  const missing = missingDataFor(p, party)

  // ── Intensiteit handlers ──
  function tapIntensityBand(level: number) {
    setIntensityBand(applyBandTap(prefs.intensityBand, level))
  }

  function tapIntensityCeiling(level: number) {
    setIntensityCeiling(prefs.intensityCeiling === level ? null : level)
  }

  // ── Hoogte handlers ──
  function tapHeightLevel(level: number) {
    setHeightCeiling(prefs.heightCeiling === level ? null : level)
  }

  return (
    <div className={"member" + (p.on ? "" : " off") + (open ? " open" : "")}>
      <div className="m-head" onClick={onToggleOpen}>
        <div
          className={"chk " + (p.on ? "on" : "")}
          onClick={(e) => {
            e.stopPropagation()
            onToggleOn()
          }}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="4,12 10,18 20,6" />
          </svg>
        </div>
        <div className="m-name">{p.name}</div>
        <button
          className={"m-star " + (p.favorite ? "on" : "")}
          title={p.favorite ? "Favoriet — klik om de ster weg te halen" : "Markeer als favoriet"}
          aria-label={p.favorite ? "Favoriet" : "Geen favoriet"}
          aria-pressed={p.favorite ? "true" : "false"}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <polygon points="12,2 14.9,8.6 22,9.3 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.3 9.1,8.6" />
          </svg>
        </button>
        <div className="m-h">
          {p.h != null ? (
            <>
              {p.h}
              <small>cm</small>
            </>
          ) : (
            <small>{t("member.no-height")}</small>
          )}
          {memberAgeLabel(p)}
        </div>
        <svg
          className="m-chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9,6 15,12 9,18" />
        </svg>
      </div>

      {open && (
        <div className="m-body">
          {/* Lengte-slider */}
          <div className="ruler">
            <div className="ticks">{ticks}</div>
            <input
              type="range"
              min={HMIN}
              max={HMAX}
              value={p.h ?? HMIN}
              step={1}
              style={{ ["--fill" as string]: fill + "%" }}
              onChange={(e) => onChange({ ...p, h: +e.target.value })}
            />
            <div className="scale">
              <span>{HMIN}</span>
              <span>{HMAX} cm</span>
            </div>
          </div>

          {/* Geboortedatum */}
          <div className="agefield">
            <label>
              {t("member.birthyear")} <small>{t("member.optional")}</small>
            </label>
            <input
              className="byr"
              type="number"
              min={1900}
              max={2099}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthYear ?? ""}
              placeholder="bv. 2018"
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1900, Math.min(2099, parseInt(v, 10) || 1900))
                const next: Member = { ...p, birthYear: n }
                if (n == null) {
                  next.birthMonth = null
                  next.birthDay = null
                }
                onChange(next)
              }}
            />
            <input
              className="bm"
              type="number"
              min={1}
              max={12}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthMonth ?? ""}
              placeholder="mnd"
              disabled={p.birthYear == null}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1, Math.min(12, parseInt(v, 10) || 1))
                const next: Member = { ...p, birthMonth: n }
                if (n == null) next.birthDay = null
                onChange(next)
              }}
            />
            <input
              className="bd"
              type="number"
              min={1}
              max={31}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthDay ?? ""}
              placeholder="dag"
              disabled={p.birthMonth == null}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1, Math.min(31, parseInt(v, 10) || 1))
                onChange({ ...p, birthDay: n })
              }}
            />
            {p.birthYear != null && (
              <button
                className="linkbtn small"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange({ ...p, birthYear: null, birthMonth: null, birthDay: null })
                }}
              >
                wissen
              </button>
            )}
          </div>

          {missing.length > 0 && (
            <div className="datahint">
              Vul {missing.join(" en ")} in voor een correct verdict op{" "}
              {missing.length === 1 ? "enkele" : "sommige"} attracties.
            </div>
          )}

          {/* ── Intensiteits-band + "no way!"-grens ──────────────────────── */}
          <div className="pref-section">
            <div className="wiz-label">Intensiteit</div>
            <p className="wiz-hint" style={{ marginTop: 0, marginBottom: "6px" }}>
              Tik niveaus die <em>echt</em> trekken. Tik ✕ op een hoger niveau voor een <strong>"no way!"</strong>-grens — dat niveau en alles erboven valt af.
            </p>
            <GradientBar
              band={prefs.intensityBand}
              ceiling={prefs.intensityCeiling}
              anchors={INTENSITY_ANCHORS}
              onTapBand={tapIntensityBand}
              onTapCeiling={tapIntensityCeiling}
            />
          </div>

          {/* ── Hoogte plafond ─────────────────────────────────────────────── */}
          <div className="pref-section">
            <div className="wiz-label">Hoogte plafond</div>
            <p className="wiz-hint" style={{ marginTop: 0, marginBottom: "6px" }}>
              Tot hoe hoog is comfortabel? Geen selectie = geen beperking.
            </p>
            <HeightGradient
              ceiling={prefs.heightCeiling}
              anchors={HEIGHT_ANCHORS}
              onTapLevel={tapHeightLevel}
            />
          </div>

          {/* ── Categorie-interesses ──────────────────────────────────────── */}
          <div className="pref-section">
            <div className="wiz-label">Interesses</div>
            <div className="wiz-cat-grid">
              {CATEGORIES.map(({ key, label, emoji }) => {
                const active = !!prefs.categoryInterests[key]
                return (
                  <button
                    key={key}
                    type="button"
                    className={"wiz-cat" + (active ? " on" : "")}
                    onClick={() => setCategoryInterest(key, !active)}
                    aria-pressed={active}
                  >
                    <span className="wiz-cat-emo">{emoji}</span>
                    <span className="wiz-cat-lbl">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Thematisatie-belang ───────────────────────────────────────── */}
          <div className="pref-section">
            <div className="wiz-label">Thematisatie-belang</div>
            <p className="wiz-hint" style={{ marginTop: 0, marginBottom: "6px" }}>
              Hoe belangrijk is themed sfeer voor de park-keuze?
            </p>
            <div className="wiz-importance-row">
              {THEMING_IMPORTANCE_LEVELS.map(({ key, nl, emoji }) => {
                const active = prefs.themingImportance === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={"wiz-importance-opt" + (active ? " on" : "")}
                    onClick={() =>
                      setThemingImportance(active ? null : key)
                    }
                    aria-pressed={active}
                  >
                    <span className="wiz-importance-emo">{emoji}</span>
                    <span className="wiz-importance-lbl">{nl}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Props drietrap ────────────────────────────────────────────── */}
          <div className="pref-section">
            <div className="wiz-label">Eigenschappen</div>
            <div className="wiz-prop-list">
              {MEMBER_CARD_PROPS.map((prop) => {
                const current: PropTrap = prefs.propChoices[prop] ?? "prima"
                return (
                  <div key={prop} className="wiz-prop-row">
                    <div className="wiz-prop-lbl">
                      <span className="wiz-prop-emo">{PEMO[prop]}</span>
                      <span>{PNL[prop]}</span>
                    </div>
                    <div className="wiz-tri">
                      {(["prima", "voorGroep", "nooit"] as PropTrap[]).map((v) => {
                        const labels: Record<PropTrap, string> = {
                          prima: "Prima",
                          voorGroep: "Voor de groep",
                          nooit: "Nooit",
                        }
                        return (
                          <button
                            key={v}
                            type="button"
                            className={`wiz-tri-btn${current === v ? ` on ${v}` : ""}`}
                            onClick={() => setPropChoice(prop, v)}
                          >
                            {labels[v]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Acties ───────────────────────────────────────────────────── */}
          <div className="m-actions">
            <button className="linkbtn danger" onClick={onDelete}>
              {t("member.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
