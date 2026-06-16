/* Lid-kaart: ingeklapt = naam/lengte/leeftijd; opengeklapt = lengte-slider,
 * geboortedatum, props/types tabs en verwijder-knop. */

import { useMemo } from "react"
import type { Member, PropKey, TypeKey } from "../../shared/types"
import { ageRange, ageBorderline } from "../../shared/scoring"
import { PROPS, TYPES, PEMO, PNL, TEMO, TNL } from "../../shared/vocab"
import { RIDES, ridesOf, parks } from "../../shared/data"
import { t } from "../../shared/i18n"
import type { PartyState } from "../../shared/types"

const HMIN = 70
const HMAX = 200

function memberAgeLabel(p: Member): React.ReactNode {
  if (p.birthYear == null) return null
  const r = ageRange(p, new Date())
  if (!r) return null
  if (r.lo === r.hi)
    return (
      <>
        {" · "}
        {r.lo}
        <small>j</small>
      </>
    )
  return (
    <>
      {" · "}
      {r.lo}–{r.hi}
      <small>j</small>
    </>
  )
}

function missingDataFor(p: Member, party: PartyState): string[] {
  let needH = false
  let needYear = false
  let needPrec = false
  parks
    .filter((park) => !party.excludedParks[park])
    .forEach((park) =>
      ridesOf(park).forEach((r) => {
        if (p.h == null && (r.beg != null || r.zelf != null || r.max != null))
          needH = true
        const hasAgeReq =
          r.min_age_beg != null || r.min_age_zelf != null || r.max_age != null
        if (!hasAgeReq) return
        if (p.birthYear == null) needYear = true
        else if (ageBorderline(p, r)) needPrec = true
      }),
    )
  const out: string[] = []
  if (needH) out.push("lengte")
  if (needYear) out.push("geboortejaar")
  else if (needPrec) out.push("geboortemaand")
  return out
}

interface Props {
  index: number
  member: Member
  open: boolean
  party: PartyState
  memberTab: "props" | "types"
  onToggleOn: () => void
  onToggleOpen: () => void
  onChange: (m: Member) => void
  onDelete: () => void
  onSetMemberTab: (t: "props" | "types") => void
  onSetPropPref: (pr: PropKey, v: "prima" | "liever" | "nooit") => void
  onSetTypePref: (ty: TypeKey, v: number) => void
}

export function MemberCard({
  index,
  member: p,
  open,
  party,
  memberTab,
  onToggleOn,
  onToggleOpen,
  onChange,
  onDelete,
  onSetMemberTab,
  onSetPropPref,
  onSetTypePref,
}: Props) {
  const fill = p.h != null ? (((p.h - HMIN) / (HMAX - HMIN)) * 100).toFixed(1) : "0"
  const ticks = useMemo(() => {
    const arr: React.ReactNode[] = []
    for (let cm = HMIN; cm <= HMAX; cm += 5) {
      const x = (((cm - HMIN) / (HMAX - HMIN)) * 100).toFixed(2)
      arr.push(
        <i
          key={cm}
          className={cm % 10 === 0 ? "maj" : "min"}
          style={{ left: x + "%" }}
        />,
      )
    }
    return arr
  }, [])

  const missing = missingDataFor(p, party)

  function ppCur(pr: PropKey): "prima" | "liever" | "nooit" {
    const m = party.propPref[p.name]
    return m && m[pr] ? (m[pr] as "prima" | "liever" | "nooit") : "prima"
  }
  function tpCur(ty: TypeKey): number {
    const m = party.typePref[p.name]
    return m && m[ty] != null ? (m[ty] as number) : 1
  }

  return (
    <div className={"member" + (p.on ? "" : " off") + (open ? " open" : "")}>
      <div className="m-head" onClick={onToggleOpen}>
        <div
          className={"chk " + (p.on ? "on" : "")}
          onClick={(e) => {
            e.stopPropagation()
            onToggleOn()
          }}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="4,12 10,18 20,6" />
          </svg>
        </div>
        <div className="m-name">{p.name}</div>
        <div className="m-h">
          {p.h != null ? (
            <>
              {p.h}
              <small>cm</small>
            </>
          ) : (
            <small>{t("member.no-height")}</small>
          )}
          {memberAgeLabel(p)}
        </div>
        <svg
          className="m-chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9,6 15,12 9,18" />
        </svg>
      </div>

      {open && (
        <div className="m-body">
          <div className="ruler">
            <div className="ticks">{ticks}</div>
            <input
              type="range"
              min={HMIN}
              max={HMAX}
              value={p.h ?? HMIN}
              step={1}
              style={{ ["--fill" as string]: fill + "%" }}
              onChange={(e) => onChange({ ...p, h: +e.target.value })}
            />
            <div className="scale">
              <span>{HMIN}</span>
              <span>{HMAX} cm</span>
            </div>
          </div>

          <div className="agefield">
            <label>
              {t("member.birthyear")} <small>{t("member.optional")}</small>
            </label>
            <input
              className="byr"
              type="number"
              min={1900}
              max={2099}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthYear ?? ""}
              placeholder="bv. 2018"
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1900, Math.min(2099, parseInt(v, 10) || 1900))
                const next: Member = { ...p, birthYear: n }
                if (n == null) {
                  next.birthMonth = null
                  next.birthDay = null
                }
                onChange(next)
              }}
            />
            <input
              className="bm"
              type="number"
              min={1}
              max={12}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthMonth ?? ""}
              placeholder="mnd"
              disabled={p.birthYear == null}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1, Math.min(12, parseInt(v, 10) || 1))
                const next: Member = { ...p, birthMonth: n }
                if (n == null) next.birthDay = null
                onChange(next)
              }}
            />
            <input
              className="bd"
              type="number"
              min={1}
              max={31}
              step={1}
              inputMode="numeric"
              defaultValue={p.birthDay ?? ""}
              placeholder="dag"
              disabled={p.birthMonth == null}
              onBlur={(e) => {
                const v = e.target.value.trim()
                const n = v === "" ? null : Math.max(1, Math.min(31, parseInt(v, 10) || 1))
                onChange({ ...p, birthDay: n })
              }}
            />
            {p.birthYear != null && (
              <button
                className="linkbtn small"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange({ ...p, birthYear: null, birthMonth: null, birthDay: null })
                }}
              >
                wissen
              </button>
            )}
          </div>

          {missing.length > 0 && (
            <div className="datahint">
              Vul {missing.join(" en ")} in voor een correct verdict op{" "}
              {missing.length === 1 ? "enkele" : "sommige"} attracties.
            </div>
          )}

          <div className="subtabs">
            <div
              className={"subtab " + (memberTab === "props" ? "on" : "")}
              onClick={() => onSetMemberTab("props")}
            >
              {t("member.subtab.props")}
            </div>
            <div
              className={"subtab " + (memberTab === "types" ? "on" : "")}
              onClick={() => onSetMemberTab("types")}
            >
              {t("member.subtab.types")}
            </div>
          </div>

          {memberTab === "props"
            ? PROPS.map((pr) => {
                const cur = ppCur(pr)
                return (
                  <div className="prow" key={pr}>
                    <div className="pinfo">
                      <b>
                        {PEMO[pr]} {PNL[pr]}
                      </b>
                    </div>
                    <div className="trigrp">
                      {(["prima", "liever", "nooit"] as const).map((v) => {
                        const label = v === "prima" ? "prima" : v === "liever" ? "liever niet" : "NOOIT"
                        return (
                          <button
                            key={v}
                            className={"tri wide " + (cur === v ? "on " + v : "")}
                            onClick={() => onSetPropPref(pr, v)}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            : TYPES.map((ty) => {
                const n = RIDES.filter((r) => r.type === ty).length
                if (!n) return null
                const cur = tpCur(ty)
                const items: Array<[number, string]> = [
                  [2, "\u{1F60D}"],
                  [1, "\u{1F642}"],
                  [0, "\u{1F645}"],
                ]
                return (
                  <div className="prow" key={ty}>
                    <div className="pinfo">
                      <b>
                        {TEMO[ty]} {TNL[ty]}
                      </b>
                      <span>{n}</span>
                    </div>
                    <div className="trigrp">
                      {items.map(([v, e]) => (
                        <button
                          key={v}
                          className={"tri " + (cur === v ? "on" : "")}
                          onClick={() => onSetTypePref(ty, v)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

          <div className="m-actions">
            <button className="linkbtn danger" onClick={onDelete}>
              {t("member.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
