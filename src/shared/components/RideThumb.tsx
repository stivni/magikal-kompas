/* Thumbnail van een attractie: foto met emoji-fallback, opent lightbox bij klik. */

import { useState } from "react"
import type { Ride } from "../types"
import { colorOf } from "../helpers"
import { TEMO } from "../vocab"

export function RideThumb({
  ride,
  onOpen,
}: {
  ride: Ride
  onOpen?: () => void
}) {
  const t = ride.type
  const col = colorOf(t)
  const emo = TEMO[t] || "?"
  const im = ride.image
  const [broken, setBroken] = useState(false)
  const has = !!(im && im.url) && !broken
  const cls = has ? "ride-thumb has-img" : "ride-thumb"
  return (
    <div
      className={cls}
      style={{ ["--col" as string]: col }}
      onClick={has && onOpen ? onOpen : undefined}
    >
      <span className="t-emo">{emo}</span>
      {has && im ? (
        <img
          src={im.url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : null}
    </div>
  )
}
