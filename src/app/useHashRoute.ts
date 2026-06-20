/* Magikal Kompas — hash-routing voor tab + gekozen park.
 * Zie ADR-017. */

import { useEffect, useState } from "react"
import { parks } from "../shared/data"
import { parkSlug } from "../shared/helpers"

export type Tab = "parken" | "volgorde" | "deelnemers"
export interface Route {
  tab: Tab
  park: string | null
}

const SLUG_OF: Record<string, string> = {}
const NAME_OF: Record<string, string> = {}
parks.forEach((p) => {
  const s = parkSlug(p)
  SLUG_OF[p] = s
  NAME_OF[s] = p
})

export { SLUG_OF, NAME_OF }

export function routeFromHash(): Route | null {
  const h = location.hash || ""
  if (h.startsWith("#c=")) return null
  const m = h.match(/^#\/?([^/?]*)\/?([^/?]*)/)
  if (!m || !m[1]) return { tab: "parken", park: null }
  if (m[1] === "wat-eerst") {
    const slug = decodeURIComponent(m[2] || "")
    return { tab: "volgorde", park: NAME_OF[slug] || null }
  }
  if (m[1] === "deelnemers") {
    return { tab: "deelnemers", park: null }
  }
  return { tab: "parken", park: null }
}

export function buildHash(tab: Tab, park: string | null): string {
  if (tab === "volgorde") {
    return park ? "#/wat-eerst/" + SLUG_OF[park] : "#/wat-eerst"
  }
  if (tab === "deelnemers") return "#/deelnemers"
  return "#/parken"
}

/** React-hook: leest de huidige route en zet hem bij externe changes (back/forward). */
export function useHashRoute(): { route: Route; setRoute: (r: Route) => void } {
  const [route, setRouteState] = useState<Route>(() => {
    return routeFromHash() ?? { tab: "parken", park: null }
  })

  useEffect(() => {
    function onChange() {
      const r = routeFromHash()
      if (r) setRouteState(r)
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  function setRoute(r: Route) {
    setRouteState(r)
    const h = buildHash(r.tab, r.park)
    if (location.hash !== h) {
      history.replaceState(null, "", location.pathname + location.search + h)
    }
  }

  return { route, setRoute }
}
