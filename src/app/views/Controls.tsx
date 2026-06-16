/* Controls: sorteer + land + parken-popovers + zoekveld. */

import { useEffect, useRef } from "react"
import type { CountryCode, SortKey } from "../../shared/types"
import { PARKMETA, parks } from "../../shared/data"
import { COUNTRY_NL, FLAGS } from "../../shared/vocab"
import { Flag } from "../../shared/components/Flag"

const SORT_OPTIONS: Array<{ k: SortKey; l: string; s: string }> = [
  { k: "weak", l: "Eerlijkst (zwakste schakel)", s: "Eerlijkst" },
  { k: "avg", l: "Totaal plezier (gemiddeld)", s: "Totaal plezier" },
]

type OpenPop = "sort" | "country" | "parks" | null

export interface ControlsProps {
  sortKey: SortKey
  setSortKey: (s: SortKey) => void
  countryFilter: Set<CountryCode>
  setCountryFilter: (s: Set<CountryCode>) => void
  excludedParks: Record<string, boolean>
  setExcludedParks: (m: Record<string, boolean>) => void
  searchQuery: string
  setSearchQuery: (s: string) => void
  openPop: OpenPop
  setOpenPop: (o: OpenPop) => void
}

function countriesInData(): CountryCode[] {
  const s = new Set<CountryCode>()
  parks.forEach((p) => {
    const c = PARKMETA[p]?.country
    if (c) s.add(c)
  })
  return [...s].sort()
}

export function Controls(p: ControlsProps) {
  const sortLabel =
    (SORT_OPTIONS.find((o) => o.k === p.sortKey) || SORT_OPTIONS[0])!.s

  const countryLabel = (() => {
    if (p.countryFilter.size === 0) return "Alle landen"
    if (p.countryFilter.size <= 2)
      return [...p.countryFilter].map((c) => COUNTRY_NL[c] || c).join(", ")
    return p.countryFilter.size + " landen"
  })()

  const totalParks = parks.length
  const onParks = parks.filter((x) => !p.excludedParks[x]).length
  const parksLabel = onParks === totalParks ? "Alle parken" : `${onParks}/${totalParks} parken`
  const parksActive = onParks < totalParks

  const searchRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (p.searchQuery && document.activeElement !== searchRef.current) {
      // niet auto-focussen; UX-stilte
    }
  }, [p.searchQuery])

  const cs = countriesInData()
  const parksSorted = parks.slice().sort((a, b) => a.localeCompare(b))

  return (
    <div className="controls">
      <button
        className={"ctrl " + (p.openPop === "sort" ? "open active" : "")}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".pop-item")) return
          p.setOpenPop(p.openPop === "sort" ? null : "sort")
        }}
      >
        <span className="lbl">Sorteer</span>
        <span className="v">{sortLabel}</span>
        <span className="caret">▼</span>
        {p.openPop === "sort" && (
          <div className="popover">
            {SORT_OPTIONS.map((o) => (
              <div
                key={o.k}
                className={"pop-item " + (o.k === p.sortKey ? "on" : "")}
                onClick={(e) => {
                  e.stopPropagation()
                  p.setSortKey(o.k)
                  p.setOpenPop(null)
                }}
              >
                {o.l}
                {o.k === p.sortKey && <span className="mark">✓</span>}
              </div>
            ))}
          </div>
        )}
      </button>

      <button
        className={
          "ctrl " +
          (p.openPop === "country" ? "open " : "") +
          (p.countryFilter.size > 0 ? "active" : "")
        }
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".pop-item")) return
          p.setOpenPop(p.openPop === "country" ? null : "country")
        }}
      >
        <span>🌍</span>
        <span className="v">{countryLabel}</span>
        <span className="caret">▼</span>
        {p.openPop === "country" && (
          <div className="popover">
            <div className="pop-h">Welke landen?</div>
            {cs.map((c) => (
              <div
                key={c}
                className={
                  "pop-item " + (p.countryFilter.has(c) ? "on" : "")
                }
                onClick={(e) => {
                  e.stopPropagation()
                  const next = new Set(p.countryFilter)
                  if (next.has(c)) next.delete(c)
                  else next.add(c)
                  p.setCountryFilter(next)
                }}
              >
                <span>
                  {FLAGS[c] || ""} {COUNTRY_NL[c] || c}
                </span>
                {p.countryFilter.has(c) && <span className="mark">✓</span>}
              </div>
            ))}
            <div className="pop-sep"></div>
            <div
              className="pop-item"
              onClick={(e) => {
                e.stopPropagation()
                p.setCountryFilter(new Set())
              }}
            >
              Alle landen
            </div>
          </div>
        )}
      </button>

      <button
        className={
          "ctrl " +
          (p.openPop === "parks" ? "open " : "") +
          (parksActive ? "active" : "")
        }
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".pop-item")) return
          p.setOpenPop(p.openPop === "parks" ? null : "parks")
        }}
      >
        <span>🎢</span>
        <span className="v">{parksLabel}</span>
        <span className="caret">▼</span>
        {p.openPop === "parks" && (
          <div className="popover">
            <div className="pop-h">Welke parken meerekenen?</div>
            {parksSorted.map((park) => {
              const on = !p.excludedParks[park]
              return (
                <div
                  key={park}
                  className={"pop-item " + (on ? "on" : "")}
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = { ...p.excludedParks }
                    if (on) next[park] = true
                    else delete next[park]
                    p.setExcludedParks(next)
                  }}
                >
                  <span>
                    {park}
                    <Flag park={park} />
                  </span>
                  {on && <span className="mark">✓</span>}
                </div>
              )
            })}
            <div className="pop-sep"></div>
            <div
              className="pop-item"
              onClick={(e) => {
                e.stopPropagation()
                p.setExcludedParks({})
              }}
            >
              Alle parken aan
            </div>
          </div>
        )}
      </button>

      <input
        ref={searchRef}
        className="search"
        placeholder="Park zoeken…"
        value={p.searchQuery}
        onChange={(e) => p.setSearchQuery(e.target.value)}
      />
    </div>
  )
}
