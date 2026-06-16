import { PARKMETA } from "../data"
import { COUNTRY_NL, FLAGS } from "../vocab"
import type { CountryCode } from "../types"

export function Flag({ park }: { park: string }) {
  const c = PARKMETA[park]?.country as CountryCode | undefined
  if (!c || !FLAGS[c]) return null
  return (
    <span className="flag" title={COUNTRY_NL[c] || c}>
      {FLAGS[c]}
    </span>
  )
}
