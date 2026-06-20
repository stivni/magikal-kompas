/* Draagbare ride-tile met admin_preview → image → emoji fallback en
 * hoek-links (Wikipedia, park-site). Gebruikt door CategorizeView. */

import { useState } from "react"
import type { Ride } from "../shared/types"
import { TEMO, TNL } from "../shared/vocab"

export const DRAG_MIME = "application/x-mk-ride"

// Proxy omzeilt hotlink-blokkade bij externe park-site URLs in admin_preview.
function proxify(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return `/api/admin-preview?u=${encodeURIComponent(url)}`
  return url
}

export function RideTile({ park, ride, dragKey }: { park: string; ride: Ride; dragKey: string }) {
  const [imgState, setImgState] = useState<"preview" | "image" | "emoji">("preview")
  const emoji = TEMO[ride.type] ?? "•"

  const previewSrc = proxify(ride.admin_preview?.url) || ride.image?.url
  const imageSrc = ride.image?.url

  const currentSrc =
    imgState === "preview" ? previewSrc :
    imgState === "image" ? imageSrc :
    undefined

  function handleError() {
    if (imgState === "preview" && imageSrc) {
      setImgState("image")
    } else {
      setImgState("emoji")
    }
  }

  return (
    <div
      className="cat-tile"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData(DRAG_MIME, dragKey)
      }}
      title={`${ride.att} — ${park} — ${TNL[ride.type]}`}
    >
      <div className="cat-tile-thumb">
        {currentSrc && imgState !== "emoji" ? (
          <img src={currentSrc} alt="" loading="lazy" onError={handleError} />
        ) : (
          <span className="cat-tile-emo">{emoji}</span>
        )}
        <span className="cat-tile-typebadge" title={TNL[ride.type]}>{emoji}</span>
        <div className="cat-tile-links">
          {ride.wikipedia_url && (
            <a
              href={ride.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cat-tile-extlink cat-tile-wikilink"
              title={`Open op Wikipedia: ${ride.wikipedia_url}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            >
              <span aria-hidden="true" style={{ fontSize: 11, fontWeight: 700, fontFamily: "Georgia, serif" }}>
                W
              </span>
            </a>
          )}
          {ride.park_url && (
            <a
              href={ride.park_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cat-tile-extlink"
              title={`Open op park-site: ${ride.park_url}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="url-ext-ico"
              >
                <path d="M14 3h7v7" />
                <path d="M10 14L21 3" />
                <path d="M21 14v7h-7" />
                <path d="M3 10v11h11" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <div className="cat-tile-name">{ride.att}</div>
      <div className="cat-tile-park">{park}</div>
      {ride.manufacturer && (
        <div className="cat-tile-model" title={`${ride.manufacturer}${ride.model ? " — " + ride.model : ""}`}>
          {ride.manufacturer}
          {ride.model && <span className="cat-tile-model-sep"> · </span>}
          {ride.model && <span className="cat-tile-model-name">{ride.model}</span>}
        </div>
      )}
    </div>
  )
}
