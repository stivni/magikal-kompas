/* BehaviorEmoji — gedragsstaat-emoji met hover-popover.
 *
 * Popover toont drie mensentaal-zinnen — beperkingen / interesses / parkregels.
 * Het blok dat de uiteindelijke staat oplevert krijgt highlight; de andere
 * blijven leesbaar maar gedimd. Geen losse type/intensity/prop-meta — die
 * info zit in de zinnen zelf.
 */

import type { Member, MemberPrefs, Ride } from "../../shared/types"
import { explainSimple } from "../../shared/scoring"
import { colorOf, initialsOf } from "../../shared/helpers"

type FinalState = ReturnType<typeof explainSimple>["finalState"]

interface Props {
  member: Member
  ride: Ride
  prefs: MemberPrefs
  parkSlug: string
  emoji: string
  cls: string
  /** title attribuut blijft expres weg — popover doet het werk. */
  companion?: boolean
}

const FINAL_EMOJI: Record<FinalState, string> = {
  intrinsiek: "😍",
  voorGroep: "🙂",
  saai: "🥱",
  alsmoet: "😰",
  nooit: "🙅",
  growth: "🌱",
  outgrown: "🍂",
}

export function BehaviorEmoji({
  member,
  ride,
  prefs,
  parkSlug,
  emoji,
  cls,
  companion,
}: Props) {
  const e = explainSimple(member, ride, prefs, parkSlug)

  return (
    <span
      className={"behavior-emo " + cls}
      style={{ ["--col" as string]: colorOf(member.name) }}
    >
      <span className="bemo-ini">{initialsOf(member.name)}</span>
      <span className="bemo-sym">{emoji}</span>
      {companion && (
        <span className="behavior-companion-badge" aria-label="begeleidt">
          🅱
        </span>
      )}
      <span className="behavior-popover" role="tooltip">
        <span className="bp-head">
          <span className="bp-name">{member.name}</span>
          <span className="bp-sep">·</span>
          <span className="bp-ride">{ride.att}</span>
        </span>

        <span className={"bp-block" + (e.limits.active ? " active" : " dimmed")}>
          <span className="bp-block-title">🙅 Beperkingen</span>
          <span className="bp-block-sentence">{e.limits.sentence}</span>
        </span>

        <span className={"bp-block" + (e.preferences.active ? " active" : " dimmed")}>
          <span className="bp-block-title">😍 Interesses</span>
          <span className="bp-block-sentence">{e.preferences.sentence}</span>
        </span>

        <span className={"bp-block" + (e.parkRules.active ? " active" : " dimmed")}>
          <span className="bp-block-title">📏 Parkregels</span>
          <span className="bp-block-sentence">{e.parkRules.sentence}</span>
        </span>

        <span className="bp-final">
          → {FINAL_EMOJI[e.finalState]} {e.finalSentence}
        </span>
      </span>
    </span>
  )
}
