/* PartyPanel: lijst met leden (MemberCard) + "lid toevoegen". */

import { useState } from "react"
import type { Member, PartyState, PropKey, TypeKey } from "../../shared/types"
import { MemberCard } from "./MemberCard"
import { t } from "../../shared/i18n"

interface Props {
  party: PartyState
  setParty: (p: PartyState) => void
}

export function PartyPanel({ party, setParty }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [memberTabs, setMemberTabs] = useState<Record<string, "props" | "types">>({})

  function updateMember(idx: number, m: Member) {
    const next = { ...party, people: party.people.slice() }
    next.people[idx] = m
    setParty(next)
  }

  function toggleOn(idx: number) {
    updateMember(idx, { ...party.people[idx]!, on: !party.people[idx]!.on })
  }

  function deleteMember(name: string) {
    if (!confirm("Verwijder " + name + " uit het gezelschap?")) return
    const next: PartyState = {
      ...party,
      people: party.people.filter((p) => p.name !== name),
      typePref: { ...party.typePref },
      propPref: { ...party.propPref },
      forceOv: { ...party.forceOv },
    }
    delete next.typePref[name]
    delete next.propPref[name]
    delete next.forceOv[name]
    if (expanded === name) setExpanded(null)
    setParty(next)
  }

  function setPropPref(name: string, pr: PropKey, v: "prima" | "liever" | "nooit") {
    const next = { ...party, propPref: { ...party.propPref } }
    next.propPref[name] = { ...(next.propPref[name] || {}), [pr]: v }
    setParty(next)
  }
  function setTypePref(name: string, ty: TypeKey, v: number) {
    const next = { ...party, typePref: { ...party.typePref } }
    next.typePref[name] = { ...(next.typePref[name] || {}), [ty]: v }
    setParty(next)
  }

  function addMember() {
    const raw = prompt("Naam van het nieuwe lid?", "")
    if (!raw) return
    const name = raw.trim()
    if (!name) return
    if (party.people.some((p) => p.name === name)) {
      alert("Die naam bestaat al.")
      return
    }
    setParty({
      ...party,
      people: [...party.people, { name, h: 120, on: true }],
    })
    setExpanded(name)
  }

  return (
    <>
      <div id="people">
        {party.people.map((p, i) => (
          <MemberCard
            key={p.name + ":" + i}
            index={i}
            member={p}
            open={expanded === p.name}
            party={party}
            memberTab={memberTabs[p.name] || "props"}
            onToggleOn={() => toggleOn(i)}
            onToggleOpen={() => setExpanded(expanded === p.name ? null : p.name)}
            onChange={(m) => updateMember(i, m)}
            onDelete={() => deleteMember(p.name)}
            onSetMemberTab={(tab) =>
              setMemberTabs({ ...memberTabs, [p.name]: tab })
            }
            onSetPropPref={(pr, v) => setPropPref(p.name, pr, v)}
            onSetTypePref={(ty, v) => setTypePref(p.name, ty, v)}
          />
        ))}
        <div className="addmember" onClick={addMember}>
          <span className="plus">+</span> Lid toevoegen
        </div>
      </div>
    </>
  )
}
