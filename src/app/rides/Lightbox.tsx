/* Lightbox: portal naar document.body, sluit met esc / scrim / kruisje. */

import { useEffect } from "react"
import { createPortal } from "react-dom"
import type { RideWithPark } from "../../shared/types"

export function Lightbox({
  ride,
  onClose,
}: {
  ride: RideWithPark
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const img = ride.image
  if (!img || !img.url) return null

  return createPortal(
    <div
      id="lightbox"
      className="lightbox show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        <button
          className="lb-x"
          aria-label="Sluiten"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          ✕
        </button>
        <img className="lb-img" src={img.url} alt={ride.att} onClick={(e) => e.stopPropagation()} />
        <div className="lb-attr">
          <div className="lb-title">
            {ride.att} — {ride.park}
          </div>
          <div className="lb-meta">
            {img.attribution || ""}{" "}
            {img.license ? <span className="lb-lic">{img.license}</span> : null}{" "}
            {img.source_page ? (
              <a
                className="lb-src"
                href={img.source_page}
                target="_blank"
                rel="noopener"
              >
                bron
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
