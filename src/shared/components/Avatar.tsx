/* Avatar voor een park: icon→logo-fallback uit data, anders gekleurd letterblokje.
 * Matched de oude avatarHTML() in lib.js. */

import { useState } from "react"
import { PARKEXTRA } from "../data"
import { colorOf, initialsOf } from "../helpers"

export function Avatar({ park }: { park: string }) {
  const ex = PARKEXTRA[park] || { icon: null, logo: null }
  const src = ex.icon || ex.logo || ""
  const [broken, setBroken] = useState(false)
  return (
    <div className="avatar" style={{ ["--col" as string]: colorOf(park) }}>
      <span className="ini">{initialsOf(park)}</span>
      {src && !broken ? (
        <img src={src} alt="" onError={() => setBroken(true)} />
      ) : null}
    </div>
  )
}
