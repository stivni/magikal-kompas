/* Magikal Kompas — minimale i18n-helper.
 * Vandaag enkel NL; structuur staat klaar voor extra talen (ADR-015). */

import nl from "../../i18n/nl.json"

type Dict = Record<string, string>

const TABLES: Record<string, Dict> = {
  nl: nl as Dict,
}

let activeLang = "nl"
export function setLang(l: string) {
  if (TABLES[l]) activeLang = l
}
export function getLang(): string {
  return activeLang
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = TABLES[activeLang] || TABLES.nl!
  let s = table[key] ?? TABLES.nl![key] ?? key
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]))
    }
  }
  return s
}
