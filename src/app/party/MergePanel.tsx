/* MergePanel: namen-conflict-resolutie bij import van een deel-link. */

import { useState } from "react"
import type { Member, PartyState } from "../../shared/types"
import type { SharePayload } from "../partyStore"
import { ageRange } from "../../shared/scoring"
import { uniqueName } from "../partyStore"

type Choice = "keep" | "overwrite" | "add"

function desc(q: Member): string {
  const r = ageRange(q, new Date())
  const age = r ? (r.lo === r.hi ? `${r.lo} j` : `${r.lo}–${r.hi} j`) : null
  const parts = [q.h != null ? `${q.h} cm` : "geen lengte", age].filter(Boolean)
  return parts.join(" · ")
}

export function MergePanel({
  party,
  setParty,
  incoming,
  onClose,
}: {
  party: PartyState
  setParty: (p: PartyState) => void
  incoming: SharePayload
  onClose: () => void
}) {
  const conflicts = incoming.people.filter((p) =>
    party.people.some((x) => x.name === p.name),
  )
  const nonConflicts = incoming.people.filter(
    (p) => !party.people.some((x) => x.name === p.name),
  )
  const [choices, setChoices] = useState<Record<string, Choice>>(() => {
    const o: Record<string, Choice> = {}
    conflicts.forEach((p) => (o[p.name] = "keep"))
    return o
  })

  function apply() {
    const next: PartyState = {
      people: party.people.slice(),
      typePref: { ...party.typePref },
      propPref: { ...party.propPref },
      forceOv: { ...party.forceOv },
      excludedParks: party.excludedParks,
    }
    nonConflicts.forEach((p) => {
      next.people.push({ ...p })
      if (incoming.typePref[p.name]) next.typePref[p.name] = incoming.typePref[p.name]!
      if (incoming.propPref[p.name]) next.propPref[p.name] = incoming.propPref[p.name]!
      if (incoming.forceOv[p.name]) next.forceOv[p.name] = incoming.forceOv[p.name]!
    })
    Object.keys(choices).forEach((name) => {
      const choice = choices[name]
      const inc = incoming.people.find((p) => p.name === name)
      if (!inc) return
      if (choice === "keep") return
      if (choice === "overwrite") {
        const idx = next.people.findIndex((x) => x.name === name)
        if (idx >= 0) next.people[idx] = { ...inc }
        delete next.typePref[name]
        delete next.propPref[name]
        delete next.forceOv[name]
        if (incoming.typePref[name]) next.typePref[name] = incoming.typePref[name]!
        if (incoming.propPref[name]) next.propPref[name] = incoming.propPref[name]!
        if (incoming.forceOv[name]) next.forceOv[name] = incoming.forceOv[name]!
      } else if (choice === "add") {
        const nn = uniqueName(next.people, name)
        next.people.push({ ...inc, name: nn })
        if (incoming.typePref[name]) next.typePref[nn] = incoming.typePref[name]!
        if (incoming.propPref[name]) next.propPref[nn] = incoming.propPref[name]!
        if (incoming.forceOv[name]) next.forceOv[nn] = incoming.forceOv[name]!
      }
    })
    setParty(next)
    onClose()
  }

  return (
    <div
      className="sharepanel show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet">
        <div className="sheet-h">
          <b>Inkomende leden</b>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted">
          Deze namen bestaan al op dit toestel. Kies per lid wat je wil doen.
          "Toevoegen" geeft het inkomende lid een nieuwe naam (bv. "
          {conflicts[0]?.name} 2").
        </p>
        <div className="mergelist">
          {conflicts.map((p) => {
            const ex = party.people.find((x) => x.name === p.name)!
            const cur = choices[p.name]!
            return (
              <div className="mergerow" key={p.name}>
                <div className="mr-info">
                  <b>{p.name}</b>
                  <span className="muted">
                    bestaat al ({desc(ex)}) — inkomend {desc(p)}
                  </span>
                </div>
                <div className="trigrp">
                  {(["keep", "overwrite", "add"] as Choice[]).map((v) => {
                    const label =
                      v === "keep" ? "Behouden" : v === "overwrite" ? "Overschrijven" : "Toevoegen"
                    return (
                      <button
                        key={v}
                        className={"tri wide " + (cur === v ? "on" : "")}
                        onClick={() => setChoices({ ...choices, [p.name]: v })}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {nonConflicts.length > 0 && (
          <p className="muted" style={{ marginTop: 10 }}>
            Nieuwe leden worden toegevoegd:{" "}
            <b>{nonConflicts.map((p) => p.name).join(", ")}</b>.
          </p>
        )}
        <div className="mergeact">
          <button className="expbtn" onClick={apply}>
            Toepassen
          </button>
        </div>
      </div>
    </div>
  )
}
