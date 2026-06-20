/* Per-deelnemer behavior-bar — herbruikbare visualisatie van gedrag per park.
 *
 * Toont per geselecteerd lid één gestapelde balk met segmenten voor de 4
 * gedragsstaten (intrinsiek/voorGroep/alsmoet/nooit) + twee signaal-tellers
 * (🌱 growth, 🍂 outgrown). Segmenten zijn klikbaar als `onToggleFilter`
 * meegegeven is; anders dienen ze alleen als display.
 *
 * ADR-025 Fase 3: saai en alsmoet worden elk opgesplitst in twee visuele
 * segmenten — vrijwillig (vlakke kleur, bb-seg--saai / bb-seg--alsmoet) en
 * gedwongen/forced (gestreept patroon, bb-seg--saai-forced / bb-seg--alsmoet-forced).
 * Beide segmenten zijn klikbaar als hetzelfde filter-segment (saai / alsmoet).
 */

import type { Member, MemberPrefs } from "../types"
import { parkBehaviorCounts, parkForcedCounts } from "../scoring"
import { colorOf, initialsOf } from "../helpers"
import { ridesOf } from "../data"

export type BehaviorCounterKey =
  | "intrinsiek"
  | "voorGroep"
  | "saai"
  | "alsmoet"
  | "nooit"
  | "growth"
  | "outgrown"

export const BEHAVIOR_COUNTER_DEFS: Array<{
  key: BehaviorCounterKey
  emoji: string
  title: string
}> = [
  { key: "intrinsiek", emoji: "😍", title: "Wil graag" },
  { key: "voorGroep", emoji: "🙂", title: "Kan mee" },
  { key: "saai", emoji: "🥱", title: "Te saai" },
  { key: "alsmoet", emoji: "😰", title: "Opoffering" },
  { key: "nooit", emoji: "🙅", title: "Niet" },
  { key: "growth", emoji: "🌱", title: "Nog te klein/jong" },
  { key: "outgrown", emoji: "🍂", title: "Ontgroeid" },
]

function hasNoPrefs(prefs: MemberPrefs): boolean {
  return (
    prefs.intensityBand == null &&
    prefs.heightCeiling == null &&
    Object.keys(prefs.categoryInterests).length === 0 &&
    Object.keys(prefs.propChoices).length === 0 &&
    Object.keys(prefs.perRideOverride).length === 0
  )
}

interface Props {
  parkSlug: string
  members: Member[]
  prefsByMember: Record<string, MemberPrefs>
  emptyPrefs: () => MemberPrefs
  onEditMember?: (name: string) => void
  activeFilter?: { member: string; state: BehaviorCounterKey } | null
  onToggleFilter?: (member: string, state: BehaviorCounterKey) => void
}

export function BehaviorBar({
  parkSlug,
  members,
  prefsByMember,
  emptyPrefs,
  onEditMember,
  activeFilter,
  onToggleFilter,
}: Props) {
  const rides = ridesOf(parkSlug)
  return (
    <div className="behavior-summary">
      {members.map((k) => {
        const memberPrefs = prefsByMember[k.name] ?? emptyPrefs()
        const noPrefs = hasNoPrefs(memberPrefs)
        const counts = noPrefs
          ? null
          : parkBehaviorCounts(rides, k, memberPrefs, parkSlug)
        // forced-tellers: hoeveel van saai/alsmoet zijn noodzakelijk-aanwezig
        const forced = counts
          ? parkForcedCounts(rides, k, members, prefsByMember, emptyPrefs, parkSlug)
          : null
        const filterActive = (state: BehaviorCounterKey) =>
          activeFilter?.member === k.name && activeFilter.state === state
        const nameInner = (
          <>
            <span
              className="behavior-mini-ava"
              style={{ ["--col" as string]: colorOf(k.name) }}
            >
              {initialsOf(k.name)}
            </span>
            <span className="behavior-name">{k.name}</span>
          </>
        )

        /**
         * Rendert één segment van de behavior-bar.
         * Voor saai en alsmoet worden twee segmenten naast elkaar gerenderd:
         * - het vrijwillige deel (vlakke kleur)
         * - het gedwongen deel (gestreept patroon, bb-seg--forced)
         */
        function renderSeg(
          key: BehaviorCounterKey,
          emoji: string,
          title: string,
          value: number,
          forcedValue: number,
        ) {
          if (value <= 0) return null
          const freeValue = value - forcedValue
          const isFilterActive = filterActive(key)

          const makeSegEl = (
            segClass: string,
            segValue: number,
            isForced: boolean,
            titleSuffix: string,
          ) => {
            if (segValue <= 0) return null
            const segTitle =
              emoji + " " + title + titleSuffix + ": " +
              segValue + " " +
              (segValue === 1 ? "attractie" : "attracties") +
              (isFilterActive
                ? " · klik om filter weg te halen"
                : " · klik om te filteren")

            if (onToggleFilter) {
              return (
                <button
                  type="button"
                  key={segClass}
                  className={
                    "bb-seg bb-seg--" +
                    key +
                    (isForced ? " bb-seg--forced" : "") +
                    (isFilterActive ? " on" : "")
                  }
                  style={{ flexGrow: segValue }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFilter(k.name, key)
                  }}
                  title={segTitle}
                  aria-label={title + ": " + segValue}
                >
                  {!isForced && (
                    <span className="bb-seg-label">
                      {emoji} {value}
                    </span>
                  )}
                </button>
              )
            } else {
              return (
                <div
                  key={segClass}
                  className={"bb-seg bb-seg--" + key + (isForced ? " bb-seg--forced" : "")}
                  style={{ flexGrow: segValue }}
                  title={
                    emoji + " " + title + titleSuffix + ": " +
                    segValue + " " +
                    (segValue === 1 ? "attractie" : "attracties")
                  }
                  aria-label={title + ": " + segValue}
                >
                  {!isForced && (
                    <span className="bb-seg-label">
                      {emoji} {value}
                    </span>
                  )}
                </div>
              )
            }
          }

          // Voor saai/alsmoet: split in vrijwillig + gedwongen
          if ((key === "saai" || key === "alsmoet") && forcedValue > 0) {
            return (
              <>
                {freeValue > 0 && makeSegEl(key + "-free", freeValue, false, " (vrijwillig)")}
                {makeSegEl(key + "-forced", forcedValue, true, " (gedwongen)")}
              </>
            )
          }

          // Standaard: één segment
          return makeSegEl(key, value, false, "")
        }

        return (
          <div className="behavior-row" key={k.name}>
            {onEditMember ? (
              <button
                type="button"
                className="behavior-row-edit"
                onClick={() => onEditMember(k.name)}
                title={"Voorkeuren bewerken voor " + k.name}
              >
                {nameInner}
              </button>
            ) : (
              <div className="behavior-row-edit">{nameInner}</div>
            )}
            {counts ? (
              (() => {
                const total = BEHAVIOR_COUNTER_DEFS.reduce(
                  (s, def) => s + counts[def.key],
                  0,
                )
                return (
                  <div
                    className="behavior-bar"
                    title={"Totaal " + total + " attracties"}
                  >
                    {BEHAVIOR_COUNTER_DEFS.map((def) =>
                      renderSeg(
                        def.key,
                        def.emoji,
                        def.title,
                        counts[def.key],
                        def.key === "saai"
                          ? (forced?.saai ?? 0)
                          : def.key === "alsmoet"
                            ? (forced?.alsmoet ?? 0)
                            : 0,
                      ),
                    )}
                  </div>
                )
              })()
            ) : onEditMember ? (
              <button
                type="button"
                className="behavior-counts behavior-counts--noprefs"
                onClick={() => onEditMember(k.name)}
              >
                Nog geen voorkeuren · klik om in te stellen →
              </button>
            ) : (
              <div className="behavior-counts behavior-counts--noprefs">
                Nog geen voorkeuren
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
