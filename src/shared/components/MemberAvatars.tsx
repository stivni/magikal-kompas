/* Stacked avatars: gekleurde cirkels met initialen voor leden waarvoor
 * `on=true`. Toont de eerste `max` (default 4); de rest komt in een "+n"-pil
 * rechts. Voor de chrome-pill in rail en appbar. */

import type { Member } from "../types"
import { colorOf, initialsOf } from "../helpers"

interface Props {
  members: Member[]
  max?: number
  size?: number
}

export function MemberAvatars({ members, max = 4, size = 22 }: Props) {
  const visible = members.slice(0, max)
  const rest = Math.max(0, members.length - visible.length)
  return (
    <span className="m-avatars" style={{ ["--ava-size" as string]: size + "px" }}>
      {visible.map((m) => (
        <span
          key={m.name}
          className="m-ava"
          style={{ ["--col" as string]: colorOf(m.name) }}
          title={m.name}
        >
          {initialsOf(m.name)}
        </span>
      ))}
      {rest > 0 && (
        <span className="m-ava m-ava-rest" title={`${rest} meer`}>
          +{rest}
        </span>
      )}
    </span>
  )
}
