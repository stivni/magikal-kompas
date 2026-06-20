/* AddMemberWizard 3.1 — 5-stap wizard per ADR-024 v2.
 *   Step 0: naam + lengte
 *   Step 1: props drietrap (6 props: wet dark scary spins inversions swings)
 *   Step 2: intensiteits-band + "no way!"-grens (UI-vorm C: tap-to-fill + ✕-knoppen)
 *   Step 3: hoogte-plafond (alleen plafond — geen band; hoogte-interesse komt via intensiteit)
 *   Step 4: categorie-interesses + thematisatie-belang
 */

import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import type {
  Category,
  Member,
  MemberPrefs,
  PropKey,
  PropTrap,
} from "../../shared/types"
import {
  CATEGORIES,
  INTENSITY_ANCHORS,
  HEIGHT_ANCHORS,
  THEMING_IMPORTANCE_LEVELS,
  PEMO,
  PNL,
} from "../../shared/vocab"
import { PARK_DATA } from "../../shared/data"
import { deriveBehavior } from "../../shared/scoring"
import { emptyPrefs } from "../partyStore"

// ─── Constanten ──────────────────────────────────────────────────────────────

const HMIN = 70
const HMAX = 200
const H_DEFAULT = 120

const TOTAL_STEPS = 5

/** Gradient kleuren per segment (1-5, index=segment-1) */
const GRADIENT_COLORS = ["#97C459", "#C0DD97", "#FAC775", "#EF9F27", "#E24B4A"]

/** Props die in de wizard-drietrap verschijnen (ADR-024 v2):
 *  high, fast, themed zijn eruit — respectievelijk hoogte-as, intensiteit-as, categorie-interesse. */
const WIZARD_PROPS: PropKey[] = ["wet", "dark", "scary", "spins", "inversions", "swings"]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardResult {
  name: string
  h: number
  intensityBand: [number, number] | null
  intensityCeiling: number | null
  heightBand: [number, number] | null
  heightCeiling: number | null
  propChoices: Partial<Record<PropKey, PropTrap>>
  categoryInterests: Partial<Record<Category, true>>
  themingImportance: "none" | "medium" | "high" | null
}

interface Props {
  existingNames: string[]
  excludedParks: Record<string, boolean>
  onCancel: () => void
  onFinish: (r: WizardResult) => void
}

// ─── Helper: tap-to-fill band logica (ADR-024 v2) ────────────────────────────

export function applyBandTap(
  band: [number, number] | null,
  x: number,
): [number, number] | null {
  if (band === null) return [x, x]
  const [min, max] = band
  if (x > max) return [min, x]
  if (x < min) return [x, max]
  if (x === min && x === max) return null // [X,X] zelfde tap → leeg
  if (x === min && min !== max) return [min + 1, max]
  if (x === max && min !== max) return [min, max - 1]
  // min < x < max → onveranderd
  return [min, max]
}

// ─── Sub-component: GradientBar met optioneel ceiling-knop ───────────────────

interface IntensityGradientProps {
  band: [number, number] | null
  ceiling: number | null
  anchors: Array<{ level: number; label: string }>
  onTapBand: (level: number) => void
  onTapCeiling: (level: number) => void
}

/** Intensiteit-gradient: band (tap-to-fill) + "no way!"-grens (✕-knop op cellen boven band). */
function IntensityGradient({
  band,
  ceiling,
  anchors,
  onTapBand,
  onTapCeiling,
}: IntensityGradientProps) {
  return (
    <div className="wiz-gradient">
      {anchors.map(({ level, label }) => {
        const inBand = band !== null && level >= band[0] && level <= band[1]
        const aboveBand = band !== null ? level > band[1] : true
        const isCeilingMark = ceiling === level
        // "No way!"-zone: de grenscel zelf en alles erboven.
        const isExcluded = ceiling !== null && level >= ceiling
        // Tussen-zone (alsmoet): boven band, onder grens.
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

interface HeightGradientProps {
  ceiling: number | null
  anchors: Array<{ level: number; label: string }>
  onTapLevel: (level: number) => void
}

/** Hoogte-gradient: enkele plafond-keuze. Tap = "tot hier kan ik". */
function HeightGradient({ ceiling, anchors, onTapLevel }: HeightGradientProps) {
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

// ─── Sub-component: IntensityFeedback ─────────────────────────────────────────

interface FeedbackProps {
  intensityBand: [number, number] | null
  intensityCeiling: number | null
  excludedParks: Record<string, boolean>
}

function IntensityFeedback({
  intensityBand,
  intensityCeiling,
  excludedParks,
}: FeedbackProps) {
  const zones = useMemo(() => {
    if (intensityBand === null && intensityCeiling === null) return null

    const synthMember: Member = { name: "_wiz", h: null, on: true }
    const synthPrefs: MemberPrefs = {
      ...emptyPrefs(),
      intensityBand,
      intensityCeiling,
    }

    const wild: string[] = []
    const inBand: string[] = []
    const skip: string[] = []

    for (const park of PARK_DATA) {
      if (excludedParks[park.park]) continue
      for (const ride of park.rides) {
        if (!ride.intensity) continue
        const b = deriveBehavior(synthMember, ride, synthPrefs, park.park)
        if (b === "nooit") wild.push(ride.att)
        else if (b === "alsmoet") wild.push(ride.att)
        else if (b === "intrinsiek") inBand.push(ride.att)
        else skip.push(ride.att)
      }
    }

    return { wild, inBand, skip }
  }, [intensityBand, intensityCeiling, excludedParks])

  if (!zones) return null

  const hasAny =
    zones.wild.length + zones.inBand.length + zones.skip.length > 0
  if (!hasAny) {
    return (
      <div className="wiz-feedback">
        <p
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            marginTop: "10px",
          }}
        >
          Nog geen attracties met intensiteits-tags — voorbeelden volgen zodra
          de data up-to-date is.
        </p>
      </div>
    )
  }

  const pick = (arr: string[], n: number) => arr.slice(0, n).join(" · ")

  return (
    <div className="wiz-feedback">
      {zones.wild.length > 0 && (
        <div className="wiz-feedback-zone zone-wild">
          <span className="zone-icon">⬆</span>
          <span className="zone-lbl">Te wild</span>
          <span className="zone-rides">
            {pick(zones.wild, 4)}
            {zones.wild.length > 4 ? ` +${zones.wild.length - 4}` : ""}
          </span>
        </div>
      )}
      {zones.inBand.length > 0 && (
        <div className="wiz-feedback-zone zone-in">
          <span className="zone-icon">✓</span>
          <span className="zone-lbl">In je band</span>
          <span className="zone-rides">
            {pick(zones.inBand, 5)}
            {zones.inBand.length > 5 ? ` +${zones.inBand.length - 5}` : ""}
          </span>
        </div>
      )}
      {zones.skip.length > 0 && (
        <div className="wiz-feedback-zone zone-skip">
          <span className="zone-icon">⬇</span>
          <span className="zone-lbl">Onder zone</span>
          <span className="zone-rides">
            {pick(zones.skip, 4)}
            {zones.skip.length > 4 ? ` +${zones.skip.length - 4}` : ""}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function AddMemberWizard({
  existingNames,
  excludedParks,
  onCancel,
  onFinish,
}: Props) {
  // Step 0: naam + lengte
  const [name, setName] = useState("")
  const [h, setH] = useState<number>(H_DEFAULT)

  // Step 1: prop drietrap (6 props)
  const [propChoices, setPropChoices] = useState<
    Partial<Record<PropKey, PropTrap>>
  >({})

  // Step 2: intensiteits-band + pijngrens
  const [intensityBand, setIntensityBand] = useState<[number, number] | null>(
    null,
  )
  const [intensityCeiling, setIntensityCeiling] = useState<number | null>(null)

  // Step 3: hoogte plafond (alleen plafond — hoogte-interesse komt via intensiteit)
  const [heightCeiling, setHeightCeiling] = useState<number | null>(null)

  // Step 4: categorie-interesses + thematisatie-belang
  const [categoryInterests, setCategoryInterests] = useState<
    Partial<Record<Category, true>>
  >({})
  const [themingImportance, setThemingImportance] = useState<
    "none" | "medium" | "high" | null
  >(null)

  const [step, setStep] = useState(0)

  // ── Validatie stap 0 ──
  const trimmedName = name.trim()
  const nameError = !trimmedName
    ? "Naam is verplicht."
    : existingNames.includes(trimmedName)
      ? "Die naam bestaat al."
      : null

  const fillPct = (((h - HMIN) / (HMAX - HMIN)) * 100).toFixed(1)

  // ── Navigatie ──
  function goNext() {
    if (step === 0 && nameError) return
    if (step < TOTAL_STEPS - 1) setStep(step + 1)
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
  }

  function finish() {
    onFinish({
      name: trimmedName,
      h,
      intensityBand,
      intensityCeiling,
      heightBand: null,
      heightCeiling,
      propChoices,
      categoryInterests,
      themingImportance,
    })
  }

  // ── Prop drietrap handlers ──
  function setProp(p: PropKey, v: PropTrap) {
    setPropChoices((prev) => {
      const next = { ...prev }
      if (v === "prima") {
        delete next[p]
      } else {
        next[p] = v
      }
      return next
    })
  }

  // ── Intensiteit band + ceiling ──
  function tapIntensityBand(level: number) {
    setIntensityBand((prev) => applyBandTap(prev, level))
    // Als de nieuwe band boven de ceiling zou uitkomen, verwijder ceiling
    setIntensityCeiling((prevCeil) => {
      if (prevCeil === null) return null
      return prevCeil
    })
  }

  function tapIntensityCeiling(level: number) {
    setIntensityCeiling((prev) => (prev === level ? null : level))
  }

  // ── Hoogte plafond ──
  function tapHeightLevel(level: number) {
    setHeightCeiling((prev) => (prev === level ? null : level))
  }

  // ── Category toggle ──
  function toggleCategory(cat: Category) {
    setCategoryInterests((prev) => {
      const next = { ...prev }
      if (next[cat]) delete next[cat]
      else next[cat] = true
      return next
    })
  }

  // ── Stap-inhoud ──
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <>
            <h3>Wie voeg je toe?</h3>
            <label className="wiz-label">Naam</label>
            <input
              autoFocus
              className="wiz-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Lotte"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !nameError) goNext()
              }}
            />
            {nameError && trimmedName && (
              <div className="wiz-err">{nameError}</div>
            )}

            <label className="wiz-label" style={{ marginTop: "1.2rem" }}>
              Lengte: {h} cm
            </label>
            <input
              type="range"
              className="wiz-range"
              min={HMIN}
              max={HMAX}
              value={h}
              step={1}
              style={{ ["--fill" as string]: fillPct + "%" }}
              onChange={(e) => setH(+e.target.value)}
            />
            <div className="wiz-range-scale">
              <span>{HMIN} cm</span>
              <span>{HMAX} cm</span>
            </div>
            <p className="wiz-hint">
              Lengte bepaalt op welke attracties iemand mag. Niet zeker? Je
              kunt het later aanpassen.
            </p>
          </>
        )

      case 1:
        return (
          <>
            <h3>Wat vindt {trimmedName || "dit lid"} lastig?</h3>
            <p className="wiz-hint">
              Standaard is alles prima. Verander wat van toepassing is.
            </p>
            <div className="wiz-prop-list">
              {WIZARD_PROPS.map((p) => {
                const current: PropTrap = propChoices[p] ?? "prima"
                return (
                  <div key={p} className="wiz-prop-row">
                    <div className="wiz-prop-lbl">
                      <span className="wiz-prop-emo">{PEMO[p]}</span>
                      <span>{PNL[p]}</span>
                    </div>
                    <div className="wiz-tri">
                      {(["prima", "voorGroep", "nooit"] as PropTrap[]).map(
                        (v) => {
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
                              onClick={() => setProp(p, v)}
                            >
                              {labels[v]}
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )

      case 2:
        return (
          <>
            <h3>Hoe intens mag het zijn?</h3>
            <p className="wiz-hint">
              Tik op niveaus die <em>echt</em> trekken — dat is je interesse-band.
              Tik ✕ rechtsboven een hoger niveau voor een <strong>"no way!"</strong>-grens:
              dat niveau en alles erboven valt af.
            </p>
            <IntensityGradient
              band={intensityBand}
              ceiling={intensityCeiling}
              anchors={INTENSITY_ANCHORS}
              onTapBand={tapIntensityBand}
              onTapCeiling={tapIntensityCeiling}
            />
            <IntensityFeedback
              intensityBand={intensityBand}
              intensityCeiling={intensityCeiling}
              excludedParks={excludedParks}
            />
          </>
        )

      case 3:
        return (
          <>
            <h3>Hoe hoog mag het zijn?</h3>
            <p className="wiz-hint">
              Tik het hoogste niveau dat nog comfortabel is. Alles erboven valt
              automatisch af. Geen selectie = geen hoogte-beperking.
            </p>
            <HeightGradient
              ceiling={heightCeiling}
              anchors={HEIGHT_ANCHORS}
              onTapLevel={tapHeightLevel}
            />
          </>
        )

      case 4:
        return (
          <>
            <h3>Interesses</h3>
            <label className="wiz-label">
              Wat trekt {trimmedName || "dit lid"} echt aan?
            </label>
            <div className="wiz-cat-grid">
              {CATEGORIES.map(({ key, label, emoji }) => {
                const active = !!categoryInterests[key]
                return (
                  <button
                    key={key}
                    type="button"
                    className={"wiz-cat" + (active ? " on" : "")}
                    onClick={() => toggleCategory(key)}
                    aria-pressed={active}
                  >
                    <span className="wiz-cat-emo">{emoji}</span>
                    <span className="wiz-cat-lbl">{label}</span>
                  </button>
                )
              })}
            </div>

            <label className="wiz-label" style={{ marginTop: "1.4rem" }}>
              Hoe belangrijk is themed sfeer voor je park-keuze?
            </label>
            <div className="wiz-importance-row">
              {THEMING_IMPORTANCE_LEVELS.map(({ key, nl, emoji }) => {
                const active = themingImportance === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={"wiz-importance-opt" + (active ? " on" : "")}
                    onClick={() =>
                      setThemingImportance((prev) =>
                        prev === key ? null : key,
                      )
                    }
                    aria-pressed={active}
                  >
                    <span className="wiz-importance-emo">{emoji}</span>
                    <span className="wiz-importance-lbl">{nl}</span>
                  </button>
                )
              })}
            </div>
          </>
        )

      default:
        return null
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1
  const canProceed = step === 0 ? !nameError : true

  return createPortal(
    <div className="wiz-backdrop" onClick={onCancel}>
      <div className="wiz" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wiz-head">
          <div className="wiz-title">Nieuw lid</div>
          <div className="wiz-steps">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={
                  "wiz-dot" +
                  (i === step ? " on" : i < step ? " done" : "")
                }
              />
            ))}
          </div>
          <button className="wiz-x" onClick={onCancel} aria-label="Sluiten">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="wiz-body">{renderStep()}</div>

        {/* Footer */}
        <div className="wiz-foot">
          <button
            className="wiz-btn ghost"
            onClick={step === 0 ? onCancel : goBack}
          >
            {step === 0 ? "Annuleer" : "Terug"}
          </button>
          {isLastStep ? (
            <button className="wiz-btn primary" onClick={finish}>
              Toevoegen
            </button>
          ) : (
            <button
              className="wiz-btn primary"
              onClick={goNext}
              disabled={!canProceed}
            >
              Volgende
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
