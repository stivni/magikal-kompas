/* Eén attractie in de admin: collapsed-rij met thumb of open editor-paneel
 * in volgorde identiteit → categorisatie → toegang → visueel → context.
 * Foto-modal heeft één pane met thumb-strip links en klik-om-focus rechts. */

import { useEffect, useMemo, useRef, useState } from "react"
import type { PhotoCandidate, PropKey, Ride, TypeKey } from "../shared/types"
import { PEMO, PNL, PROPS, TEMO, TNL, TYPES } from "../shared/vocab"
import { RideThumb } from "../shared/components/RideThumb"
import { Flag } from "../shared/components/Flag"
import { freeText } from "../shared/helpers"
import { GENUINE_MAX } from "../shared/scoring"

interface Props {
  parkName: string
  ride: Ride
  candidates: PhotoCandidate[] | "loading" | { __error: string } | undefined
  open: boolean
  onToggleOpen: () => void
  onSetType: (t: TypeKey) => void
  onToggleProp: (pr: PropKey) => void
  onSetField: (field: RideFieldPatch) => void
  onRefresh: (extra: string) => void
  onPick: (c: PhotoCandidate, opts?: { focusX?: number; focusY?: number }) => void
}

/** Mogelijke veld-mutaties die de admin uitvoert op een ride. Het type
 * houdt expliciet bij welk veld bewerkt wordt — de parent past het toe en
 * triggert een save. */
export type RideFieldPatch =
  | { kind: "beg"; value: number }
  | { kind: "zelf"; value: number }
  | { kind: "max"; value: number | null }
  | { kind: "min_age_beg"; value: number | null }
  | { kind: "min_age_zelf"; value: number | null }
  | { kind: "max_age"; value: number | null }
  | { kind: "oms"; value: string }
  | { kind: "source_url"; value: string }
  | { kind: "park_url"; value: string }

export function RideBlock({
  parkName,
  ride,
  candidates,
  open,
  onToggleOpen,
  onSetType,
  onToggleProp,
  onSetField,
  onRefresh,
  onPick,
}: Props) {
  const [extra, setExtra] = useState("")
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const cur = ride.image
  const props = new Set(ride.props || [])
  const ty = ride.type

  // Bepaalt of de optionele lengte- of leeftijd-sectie open is. We klappen
  // expliciet open zodra de gebruiker op "+ Voeg toe"-toggle klikt; bij
  // re-render bepalen we de "default state" op basis van de data. Wanneer
  // de drie velden weer leeg zijn, klapt 'ie auto terug naar de toggle.
  const lengthsHaveData =
    (ride.beg ?? 0) > 0 ||
    (ride.zelf ?? 0) > 0 ||
    ride.max != null
  const agesHaveData =
    ride.min_age_beg != null ||
    ride.min_age_zelf != null ||
    ride.max_age != null
  const [showLengths, setShowLengths] = useState(lengthsHaveData)
  const [showAges, setShowAges] = useState(agesHaveData)

  // Re-sync wanneer de onderliggende data wijzigt (b.v. park-wissel).
  useEffect(() => {
    setShowLengths(lengthsHaveData)
  }, [lengthsHaveData])
  useEffect(() => {
    setShowAges(agesHaveData)
  }, [agesHaveData])

  // Sluit modal wanneer de ride zelf inklapt of het park wisselt.
  useEffect(() => {
    if (!open) setPhotoModalOpen(false)
  }, [open])
  useEffect(() => {
    setPhotoModalOpen(false)
  }, [parkName])

  // Esc-toets sluit de modal + body-scroll-lock zolang modal open.
  useEffect(() => {
    if (!photoModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhotoModalOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [photoModalOpen])

  // --- COLLAPSED-STATE ----------------------------------------------------
  if (!open) {
    // Thumb + naam-rij is in z'n geheel klikbaar — opent de ride (zoals de
    // edit-knop). De knop blijft staan als visueel anker en focus-target.
    return (
      <div className="curate-block collapsed">
        <div className="cb-row">
          <div
            className="cb-clickable-area"
            onClick={onToggleOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onToggleOpen()
              }
            }}
            title="Bewerken"
          >
            <RideThumb ride={ride} />
            <div className="cb-info">
              <div className="cb-title">
                {ride.att}
                <Flag park={parkName} />
              </div>
              <div className="cb-type">
                <span className="tchip">
                  {TEMO[ty] || ""} {TNL[ty] || ty}
                </span>
              </div>
            </div>
          </div>
          <button
            className="editbtn"
            onClick={onToggleOpen}
            aria-label="Bewerken"
            title="Bewerken"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // --- OPEN-STATE ---------------------------------------------------------
  // Nieuwe volgorde: identiteit → categorisatie → toegang → visueel → context.
  return (
    <div className="curate-block open">
      {/* (1) Kaartheader: thumb (klik = foto-modal) + naam + kleine type-chip
              + attributie-regel onder de naam + sluit-knop rechts. */}
      <div className="cb-row open-head">
        <ThumbWithEditOverlay
          ride={ride}
          onClick={() => setPhotoModalOpen(true)}
        />
        <div className="cb-info">
          <div className="cb-title">
            {ride.att}
            <Flag park={parkName} />
            <span className="tchip tchip-sm">
              {TEMO[ty] || ""} {TNL[ty] || ty}
            </span>
          </div>
          {cur && cur.url ? (
            <div className="cb-meta" title={cur.attribution || ""}>
              {cur.attribution || ""}
              {cur.license ? <> · <span className="lb-lic">{cur.license}</span></> : null}
              {cur.source_page ? <> · <a href={cur.source_page} target="_blank" rel="noopener">bron</a></> : null}
            </div>
          ) : null}
        </div>
        <button
          className="editbtn on"
          onClick={onToggleOpen}
          aria-label="Sluiten"
          title="Sluiten"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* (2) Type beweging — geen section-label, dropdown spreekt voor zich. */}
      <div className="ed-field">
        <select
          className="type-select"
          value={ride.type}
          onChange={(e) => onSetType(e.target.value as TypeKey)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TEMO[t]} {TNL[t]}
            </option>
          ))}
        </select>
      </div>

      {/* (3) Eigenschappen — geen section-label, chip-strip is duidelijk. */}
      <div className="cbtns prop-chips">
        {PROPS.map((pr) => (
          <button
            key={pr}
            className={"cbtn " + (props.has(pr) ? "on" : "")}
            onClick={() => onToggleProp(pr)}
          >
            {PEMO[pr]} {PNL[pr]}
          </button>
        ))}
      </div>

      <div className="ed-sep" />

      {/* (4) Maten — conditional, cell-labels boven elke input volstaan. */}
      {showLengths ? (
        <>
          <div className="ed-grid">
            <NumField
              label="min. begeleid (cm)"
              value={ride.beg ?? 0}
              placeholder="0 = geen"
              allowEmpty={false}
              onCommit={(n) => onSetField({ kind: "beg", value: n ?? 0 })}
            />
            <NumField
              label="min. zelfstandig (cm)"
              value={ride.zelf ?? 0}
              placeholder="0 = geen"
              allowEmpty={false}
              onCommit={(n) => onSetField({ kind: "zelf", value: n ?? 0 })}
            />
            <NumField
              label="max. (cm)"
              value={ride.max ?? null}
              placeholder="leeg = geen"
              allowEmpty
              onCommit={(n) => onSetField({ kind: "max", value: n })}
            />
          </div>
          <LengthBand beg={ride.beg ?? null} zelf={ride.zelf ?? null} max={ride.max ?? null} />
        </>
      ) : (
        <button
          type="button"
          className="add-row"
          onClick={() => setShowLengths(true)}
        >
          <span className="plus">+</span> Lengte-eisen toevoegen
        </button>
      )}

      {/* (5) Leeftijden — conditional, cell-labels boven elke input volstaan. */}
      {showAges ? (
        <>
          <div className="ed-grid">
            <NumField
              label="min. leeftijd begeleid (j)"
              value={ride.min_age_beg ?? null}
              placeholder="leeg = geen"
              allowEmpty
              onCommit={(n) => onSetField({ kind: "min_age_beg", value: n })}
            />
            <NumField
              label="min. leeftijd zelfstandig (j)"
              value={ride.min_age_zelf ?? null}
              placeholder="leeg = geen"
              allowEmpty
              onCommit={(n) => onSetField({ kind: "min_age_zelf", value: n })}
            />
            <NumField
              label="max. leeftijd (j)"
              value={ride.max_age ?? null}
              placeholder="leeg = geen"
              allowEmpty
              onCommit={(n) => onSetField({ kind: "max_age", value: n })}
            />
          </div>
          <AgeBand
            beg={ride.min_age_beg ?? null}
            zelf={ride.min_age_zelf ?? null}
            max={ride.max_age ?? null}
          />
        </>
      ) : (
        <button
          type="button"
          className="add-row"
          onClick={() => setShowAges(true)}
        >
          <span className="plus">+</span> Leeftijd-eisen toevoegen
        </button>
      )}

      <div className="ed-sep" />

      {/* (6) Beschrijving — cell-label boven textarea (placeholder is niet altijd zichtbaar). */}
      <div className="ed-stack">
        <TextField
          label="omschrijving (NL)"
          value={freeText(ride.oms, "nl")}
          placeholder="korte omschrijving (optioneel)"
          multiline
          onCommit={(s) => onSetField({ kind: "oms", value: s })}
        />
      </div>

      <div className="ed-sep" />

      {/* (7) Bronnen — cell-labels op de twee inputs vervangen het section-label. */}
      <div className="ed-text-grid">
        <TextField
          label="source_url (tagging)"
          value={ride.source_url ?? ""}
          placeholder="RCDB, fanwiki, …"
          onCommit={(s) => onSetField({ kind: "source_url", value: s })}
        />
        <TextField
          label="park_url (officiële pagina)"
          value={ride.park_url ?? ""}
          placeholder="https://…"
          onCommit={(s) => onSetField({ kind: "park_url", value: s })}
        />
      </div>

      {photoModalOpen && (
        <PhotoModal
          rideName={ride.att}
          parkName={parkName}
          candidates={candidates}
          cur={cur}
          extra={extra}
          setExtra={setExtra}
          onRefresh={onRefresh}
          onClose={() => setPhotoModalOpen(false)}
          onPick={(c, opts) => {
            onPick(c, opts)
            setPhotoModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

/** Header-thumb in open-state: gewone RideThumb met een klik-handler die de
 *  foto-modal opent + een hover-overlay met potlood-icoontje. Werkt ook wanneer
 *  er nog geen foto gekozen is — dan toont de RideThumb zelf de emoji-fallback. */
function ThumbWithEditOverlay({
  ride,
  onClick,
}: {
  ride: Ride
  onClick: () => void
}) {
  return (
    <div
      className="cb-thumb-clickable"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      title="Klik om de foto te wijzigen"
    >
      <RideThumb ride={ride} />
      <span className="cb-thumb-overlay" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </span>
    </div>
  )
}

/** Single-pane foto-modal: linker thumb-strip + grote preview met klik-
 *  om-focus en 4:3-overlay. Sluit op Esc (parent) en overlay-klik. */
function PhotoModal({
  rideName,
  parkName,
  candidates,
  cur,
  extra,
  setExtra,
  onRefresh,
  onClose,
  onPick,
}: {
  rideName: string
  parkName: string
  candidates: PhotoCandidate[] | "loading" | { __error: string } | undefined
  cur: Ride["image"] | undefined
  extra: string
  setExtra: (s: string) => void
  onRefresh: (extra: string) => void
  onClose: () => void
  onPick: (c: PhotoCandidate, opts?: { focusX?: number; focusY?: number }) => void
}) {
  const list = Array.isArray(candidates) ? candidates : []

  // Bereken de initiële index op basis van een "picked"-match met de huidige
  // foto, met fallback op de eerste kandidaat.
  const initialIdx = useMemo(() => {
    if (!list.length) return -1
    for (let i = 0; i < list.length; i++) {
      if (isPicked(list[i]!, cur)) return i
    }
    return 0
  }, [list, cur])

  const [selIdx, setSelIdx] = useState<number>(initialIdx)
  // Wanneer de kandidaten-lijst (her)laadt, herstel selectie.
  useEffect(() => {
    setSelIdx(initialIdx)
  }, [initialIdx])

  // Focuspunt per geselecteerde kandidaat — reset bij wissel.
  const [fx, setFx] = useState(0.5)
  const [fy, setFy] = useState(0.5)
  useEffect(() => {
    setFx(0.5)
    setFy(0.5)
  }, [selIdx])

  const cand = selIdx >= 0 && selIdx < list.length ? list[selIdx]! : null

  // Pijl-toetsen door de strip.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault()
        setSelIdx((i) => (list.length ? Math.min(i + 1, list.length - 1) : i))
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        setSelIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && cand) {
        e.preventDefault()
        onPick(cand, { focusX: fx, focusY: fy })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [list.length, cand, fx, fy, onPick])

  return (
    <div
      className="photo-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="photo-modal-card single-pane">
        <div className="photo-modal-head">
          <div className="photo-modal-title">
            {rideName} <span className="muted">— {parkName}</span>
          </div>
          <button className="photo-modal-close" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>

        <div className="photo-modal-body modal-grid">
          {/* Linker strip met thumbnails + extra-zoekterm. */}
          <aside className="thumb-strip">
            <div className="thumb-strip-list">
              {candidates == null || candidates === "loading" ? (
                <div className="muted small">Kandidaten laden…</div>
              ) : "__error" in (candidates as object) ? (
                <div className="hint">
                  Kandidaten konden niet geladen worden:{" "}
                  {(candidates as { __error: string }).__error}.
                </div>
              ) : !list.length ? (
                <div className="muted small">
                  Geen kandidaten — pas de zoekterm aan.
                </div>
              ) : (
                list.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={"ts-thumb " + (i === selIdx ? "sel" : "")}
                    onClick={() => setSelIdx(i)}
                    title={c.title || ""}
                  >
                    <img
                      src={c.thumb_url}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))
              )}
            </div>
            <div className="thumb-strip-foot">
              <input
                type="text"
                className="cand-extra"
                placeholder="extra zoekterm"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()
                    onRefresh(extra.trim())
                  }
                }}
              />
              <button
                type="button"
                className="linkbtn small"
                onClick={() => onRefresh(extra.trim())}
              >
                vernieuwen
              </button>
            </div>
          </aside>

          {/* Rechter preview-pane met klik-om-focus. */}
          <section className="preview-pane">
            {cand ? (
              <PreviewArea
                cand={cand}
                fx={fx}
                fy={fy}
                setFx={setFx}
                setFy={setFy}
              />
            ) : (
              <div className="muted small">Geen kandidaat geselecteerd.</div>
            )}
          </section>
        </div>

        <div className="photo-modal-foot">
          <button type="button" className="linkbtn" onClick={onClose}>
            Annuleren
          </button>
          <button
            type="button"
            className="ink-btn"
            disabled={!cand}
            onClick={() => {
              if (cand) onPick(cand, { focusX: fx, focusY: fy })
            }}
          >
            Kies deze foto
          </button>
        </div>
      </div>
    </div>
  )
}

/** Preview op werkelijke ratio met 4:3 overlay-rechthoek rond focuspunt
 *  en donkere mask buiten de crop. Klik = nieuw focuspunt (geclamped). */
function PreviewArea({
  cand,
  fx,
  fy,
  setFx,
  setFy,
}: {
  cand: PhotoCandidate
  fx: number
  fy: number
  setFx: (n: number) => void
  setFy: (n: number) => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  // Natuurlijke afmetingen — initieel uit de candidate-meta, maar als de
  // afbeelding laadt updaten we naar de echte naturalWidth/-Height. Zo werkt
  // het ook als de Commons-metadata afwijkt of ontbreekt.
  const [nat, setNat] = useState<{ w: number; h: number }>({
    w: cand.width || 0,
    h: cand.height || 0,
  })
  useEffect(() => {
    setNat({ w: cand.width || 0, h: cand.height || 0 })
  }, [cand])

  const sw = nat.w || 1
  const sh = nat.h || 1
  const srcAR = sw / sh
  const tgtAR = 4 / 3
  let cropW: number
  let cropH: number
  if (srcAR > tgtAR) {
    cropH = sh
    cropW = Math.round(sh * tgtAR)
  } else {
    cropW = sw
    cropH = Math.round(sw / tgtAR)
  }
  let cropX = Math.round(fx * sw - cropW / 2)
  let cropY = Math.round(fy * sh - cropH / 2)
  cropX = Math.max(0, Math.min(sw - cropW, cropX))
  cropY = Math.max(0, Math.min(sh - cropH, cropY))

  const overlayLeftPct = (cropX / sw) * 100
  const overlayTopPct = (cropY / sh) * 100
  const overlayWPct = (cropW / sw) * 100
  const overlayHPct = (cropH / sh) * 100

  function onImgClick(e: React.MouseEvent) {
    const el = imgRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setFx(Math.max(0, Math.min(1, x)))
    setFy(Math.max(0, Math.min(1, y)))
  }

  return (
    <div className="preview-pane-inner">
      <div className="preview-stage">
        <img
          ref={imgRef}
          src={cand.full_url || cand.thumb_url}
          alt=""
          referrerPolicy="no-referrer"
          className="preview-img"
          onLoad={(e) => {
            const t = e.currentTarget
            if (t.naturalWidth && t.naturalHeight) {
              setNat({ w: t.naturalWidth, h: t.naturalHeight })
            }
          }}
          onClick={onImgClick}
        />
        {/* Vier mask-zones rondom de crop — donker maken wat NIET in beeld komt. */}
        <div
          className="preview-mask top"
          style={{ height: overlayTopPct + "%" }}
        />
        <div
          className="preview-mask bottom"
          style={{
            top: overlayTopPct + overlayHPct + "%",
            height: 100 - overlayTopPct - overlayHPct + "%",
          }}
        />
        <div
          className="preview-mask left"
          style={{
            top: overlayTopPct + "%",
            height: overlayHPct + "%",
            width: overlayLeftPct + "%",
          }}
        />
        <div
          className="preview-mask right"
          style={{
            top: overlayTopPct + "%",
            height: overlayHPct + "%",
            left: overlayLeftPct + overlayWPct + "%",
            width: 100 - overlayLeftPct - overlayWPct + "%",
          }}
        />
        {/* Witte 4:3-overlay ter visualisatie. */}
        <div
          className="preview-overlay"
          style={{
            left: overlayLeftPct + "%",
            top: overlayTopPct + "%",
            width: overlayWPct + "%",
            height: overlayHPct + "%",
          }}
        />
        <div
          className="preview-dot"
          style={{ left: fx * 100 + "%", top: fy * 100 + "%" }}
        />
      </div>
      <div className="preview-meta">
        <div className="pr-attr" title={cand.attribution || ""}>
          <b>{cand.title || "(zonder titel)"}</b>
          {cand.attribution ? <> — {cand.attribution}</> : null}
        </div>
        <div className="pr-row">
          <span className="lb-lic">{cand.license || ""}</span>
          {cand.source_page && (
            <a href={cand.source_page} target="_blank" rel="noopener">
              bron
            </a>
          )}
        </div>
        <div className="muted small">
          Klik op het belangrijkste deel van de foto om de uitsnede te verschuiven.
        </div>
      </div>
    </div>
  )
}

/** Lengte-band: rood (≤beg) → oranje (beg→zelf) → groen (zelf→max of einde),
 *  optioneel een rood/pink "te groot"-zone (max≥180) of grijze "ontgroeid"-zone (max<180).
 *  Tick-labels met de actuele cm-waarden eronder. */
function LengthBand({
  beg,
  zelf,
  max,
}: {
  beg: number | null
  zelf: number | null
  max: number | null
}) {
  const LO = 70
  const HI = 220
  function pct(cm: number): number {
    return ((cm - LO) / (HI - LO)) * 100
  }
  const zones: { from: number; to: number; color: string }[] = []
  const hasBeg = beg != null && beg > 0
  const hasZelf = zelf != null && zelf > 0
  const left = LO
  const begAt = hasBeg ? Math.max(beg!, LO) : null
  const zelfAt = hasZelf ? Math.max(zelf!, LO) : null
  const cap = max != null ? Math.min(max, HI) : HI

  if (begAt != null && begAt > left) {
    zones.push({ from: left, to: begAt, color: "var(--no)" })
  }
  if (zelfAt != null && begAt != null && zelfAt > begAt) {
    zones.push({ from: begAt, to: zelfAt, color: "var(--amber)" })
  } else if (zelfAt != null && begAt == null && zelfAt > left) {
    zones.push({ from: left, to: zelfAt, color: "var(--no)" })
  }
  const greenFrom = zelfAt != null ? zelfAt : begAt != null ? begAt : left
  if (cap > greenFrom) {
    zones.push({ from: greenFrom, to: cap, color: "var(--teal)" })
  }
  if (max != null && max < HI) {
    const overColor = max >= GENUINE_MAX ? "var(--tall)" : "var(--grey)"
    zones.push({ from: cap, to: HI, color: overColor })
  }

  const marks: { at: number; label: string }[] = []
  if (hasBeg) marks.push({ at: beg!, label: beg + "cm" })
  if (hasZelf && zelf !== beg) marks.push({ at: zelf!, label: zelf + "cm" })
  if (max != null) marks.push({ at: max, label: max + "cm" })

  const hasAny = zones.length > 0
  return (
    <div className="zone-band-wrap">
      <span className="zone-band-lbl">Lengte-zones</span>
      {!hasAny ? (
        <div className="zone-band-empty">geen lengte-regels</div>
      ) : (
        <div className="zone-band">
          {zones.map((z, i) => (
            <div
              key={i}
              className="zb-zone"
              style={{
                left: pct(z.from) + "%",
                width: pct(z.to) - pct(z.from) + "%",
                background: z.color,
              }}
            />
          ))}
          {marks.map((m, i) => {
            const collides = marks
              .slice(0, i)
              .some((p) => Math.abs(p.at - m.at) < 14)
            return (
              <div key={i}>
                <div className="zb-mark" style={{ left: pct(m.at) + "%" }} />
                <div
                  className={"zb-lbl" + (collides ? " alt" : "")}
                  style={{ left: pct(m.at) + "%" }}
                >
                  {m.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Leeftijds-band: identieke semantiek, schaal 0–80 jaar. */
function AgeBand({
  beg,
  zelf,
  max,
}: {
  beg: number | null
  zelf: number | null
  max: number | null
}) {
  const LO = 0
  const HI = 80
  function pct(y: number): number {
    return ((y - LO) / (HI - LO)) * 100
  }
  const zones: { from: number; to: number; color: string }[] = []
  const hasBeg = beg != null && beg > 0
  const hasZelf = zelf != null && zelf > 0
  const begAt = hasBeg ? beg! : null
  const zelfAt = hasZelf ? zelf! : null
  const cap = max != null ? Math.min(max, HI) : HI

  const anyRule = hasBeg || hasZelf || max != null
  if (begAt != null && begAt > LO) {
    zones.push({ from: LO, to: begAt, color: "var(--no)" })
  }
  if (zelfAt != null && begAt != null && zelfAt > begAt) {
    zones.push({ from: begAt, to: zelfAt, color: "var(--amber)" })
  } else if (zelfAt != null && begAt == null && zelfAt > LO) {
    zones.push({ from: LO, to: zelfAt, color: "var(--no)" })
  }
  if (anyRule) {
    const greenFrom = zelfAt != null ? zelfAt : begAt != null ? begAt : LO
    if (cap > greenFrom) {
      zones.push({ from: greenFrom, to: cap, color: "var(--teal)" })
    }
    if (max != null && max < HI) {
      zones.push({ from: cap, to: HI, color: "var(--grey)" })
    }
  }

  const marks: { at: number; label: string }[] = []
  if (hasBeg) marks.push({ at: beg!, label: beg + "j" })
  if (hasZelf && zelf !== beg) marks.push({ at: zelf!, label: zelf + "j" })
  if (max != null) marks.push({ at: max, label: max + "j" })

  const hasAny = anyRule && zones.length > 0
  return (
    <div className="zone-band-wrap">
      <span className="zone-band-lbl">Leeftijds-zones</span>
      {!hasAny ? (
        <div className="zone-band-empty">geen leeftijds-regels</div>
      ) : (
        <div className="zone-band">
          {zones.map((z, i) => (
            <div
              key={i}
              className="zb-zone"
              style={{
                left: pct(z.from) + "%",
                width: pct(z.to) - pct(z.from) + "%",
                background: z.color,
              }}
            />
          ))}
          {marks.map((m, i) => {
            const collides = marks
              .slice(0, i)
              .some((p) => Math.abs(p.at - m.at) < 8)
            return (
              <div key={i}>
                <div className="zb-mark" style={{ left: pct(m.at) + "%" }} />
                <div
                  className={"zb-lbl" + (collides ? " alt" : "")}
                  style={{ left: pct(m.at) + "%" }}
                >
                  {m.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Number-input met lokale string-state zodat tussen-leeg-toetsen niet
 *  meteen als `0` naar de parent vliegt. Commit gebeurt op `onBlur` —
 *  consistent met de "auto-save bij gerealiseerde wijziging"-regel. */
function NumField({
  label,
  value,
  placeholder,
  allowEmpty,
  onCommit,
}: {
  label: string
  value: number | null
  placeholder?: string
  allowEmpty: boolean
  onCommit: (n: number | null) => void
}) {
  const [text, setText] = useState<string>(value == null ? "" : String(value))
  useEffect(() => {
    setText(value == null ? "" : String(value))
  }, [value])

  function commit() {
    const trimmed = text.trim()
    if (trimmed === "") {
      if (allowEmpty) {
        if (value !== null) onCommit(null)
      } else {
        if (value !== 0) onCommit(0)
        setText("0")
      }
      return
    }
    const n = Number(trimmed)
    if (Number.isNaN(n)) {
      setText(value == null ? "" : String(value))
      return
    }
    if (n !== value) onCommit(n)
  }

  return (
    <label className="ed-cell">
      <span className="ed-cell-lbl">{label}</span>
      <input
        type="number"
        min="0"
        className="ed-num"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
      />
    </label>
  )
}

/** Tekst-input of textarea met lokale state en commit-on-blur. */
function TextField({
  label,
  value,
  placeholder,
  multiline,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  multiline?: boolean
  onCommit: (s: string) => void
}) {
  const [text, setText] = useState<string>(value || "")
  useEffect(() => {
    setText(value || "")
  }, [value])

  function commit() {
    if (text !== value) onCommit(text)
  }

  return (
    <label className="ed-cell ed-cell-wide">
      <span className="ed-cell-lbl">{label}</span>
      {multiline ? (
        <textarea
          className="ed-text"
          rows={2}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
        />
      ) : (
        <input
          type="text"
          className="ed-text"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
        />
      )}
    </label>
  )
}

/** Heuristieken om de "huidige" kandidaat te herkennen, ook als de huidige
 * foto al lokaal opgeslagen is en `cur.source_page` niet meer overeenkomt. */
function isPicked(
  c: PhotoCandidate,
  cur: Ride["image"] | undefined,
): boolean {
  if (!cur || !cur.url) return false
  if (cur.source_page && c.source_page && cur.source_page === c.source_page) {
    return true
  }
  const stem = (u?: string) =>
    (u || "")
      .split("?")[0]!
      .split("/")
      .pop()!
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase()
  const curStem = stem(cur.url)
  const candTitleStem = (c.title || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
  if (curStem && candTitleStem && curStem === candTitleStem) {
    return true
  }
  const candFullStem = stem(c.full_url)
  if (curStem && candFullStem && curStem === candFullStem) {
    return true
  }
  return false
}
