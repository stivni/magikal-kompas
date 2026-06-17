/* Thumbnail van een attractie: foto met emoji-fallback, opent lightbox bij klik.
 *
 * Voor de admin-UI kan een rechten-niet-gechecktE preview-foto getoond worden
 * via `previewSrc`. Dat veld NOOIT in publieke renders doorgeven — zie ADR-014
 * en ADR-019. */

import { useState } from "react"
import type { Ride } from "../types"
import { assetUrl, colorOf } from "../helpers"
import { TEMO } from "../vocab"

export function RideThumb({
  ride,
  onOpen,
  previewSrc,
}: {
  ride: Ride
  onOpen?: () => void
  /** Admin-only: rechten-niet-gechecktE preview-URL. Wordt gebruikt als
   * fallback wanneer er geen publieke `image` is. */
  previewSrc?: string | null
}) {
  const t = ride.type
  const col = colorOf(t)
  const emo = TEMO[t] || "?"
  const im = ride.image
  const [broken, setBroken] = useState(false)
  const [previewBroken, setPreviewBroken] = useState(false)
  const hasImg = !!(im && im.url) && !broken
  const hasPreview = !hasImg && !!previewSrc && !previewBroken
  const has = hasImg || hasPreview
  const cls = has ? "ride-thumb has-img" : "ride-thumb"
  return (
    <div
      className={cls}
      style={{ ["--col" as string]: col }}
      onClick={has && onOpen ? onOpen : undefined}
    >
      <span className="t-emo">{emo}</span>
      {hasImg && im ? (
        <img
          src={assetUrl(im.url)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : hasPreview && previewSrc ? (
        <img
          src={assetUrl(previewSrc)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setPreviewBroken(true)}
        />
      ) : null}
    </div>
  )
}
