/* Deelnemers-pill: nav-affordance naar #/deelnemers.
 *
 * Eén component voor rail (desktop) en appbar (mobiel). De rail-variant geeft
 * meer ruimte (chev rechts, max 6 avatars); de appbar-variant is compacter
 * (geen chev, max 3 avatars). Zie ADR-018 voor het chrome-per-breakpoint-
 * principe — vorm verandert, rol blijft. */

import type { Member } from "../../shared/types"
import { MemberAvatars } from "../../shared/components/MemberAvatars"
import { sortMembers } from "../../shared/helpers"

interface Props {
  party: { people: Member[] }
  active: boolean
  onClick: () => void
  variant: "rail" | "appbar"
}

function UsersIcon({ size }: { size: number }) {
  return (
    <svg
      className="pp-ico"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-1a6 6 0 0 0-3-5.2" />
    </svg>
  )
}

export function PartyPill({ party, active, onClick, variant }: Props) {
  const onMembers = sortMembers(party.people.filter((p) => p.on))
  const total = party.people.length
  const isRail = variant === "rail"
  const maxAvatars = isRail ? 6 : 3
  const avatarSize = isRail ? 24 : 22

  return (
    <button
      className={"party-pill party-pill--" + variant + (active ? " on" : "")}
      onClick={onClick}
      title={active ? "Sluiten" : "Wie gaat mee?"}
      aria-label="Wie gaat mee?"
    >
      <UsersIcon size={isRail ? 18 : 16} />
      <span className="pp-text">
        {total === 0 ? (
          <span className="pp-sub">{isRail ? "Voeg deelnemers toe" : "+"}</span>
        ) : onMembers.length === 0 ? (
          <span className="pp-sub">
            {isRail ? `Niemand vandaag · ${total} bewaard` : `0/${total}`}
          </span>
        ) : (
          <MemberAvatars members={onMembers} max={maxAvatars} size={avatarSize} />
        )}
      </span>
      {isRail && (
        <svg
          className="pp-chev"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden="true"
        >
          <polyline points="9,6 15,12 9,18" />
        </svg>
      )}
    </button>
  )
}
