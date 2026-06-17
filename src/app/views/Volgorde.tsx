/* "Wat eerst?"-view: park-picker bovenaan + lijst rides voor één park. */

import { useMemo, useState } from "react"
import type {
  Member,
  PartyState,
  RideWithPark,
  SortKey,
} from "../../shared/types"
import { openRidesOf, parks } from "../../shared/data"
import {
  canDo,
  dotSym,
  joy,
  makePrefAccess,
  parkMetrics,
  rideGroupScore,
  status,
} from "../../shared/scoring"
import { Avatar } from "../../shared/components/Avatar"
import { Flag } from "../../shared/components/Flag"
import { RideThumb } from "../../shared/components/RideThumb"
import { Lightbox } from "../rides/Lightbox"
import { PEMO, PNL, TEMO, TNL } from "../../shared/vocab"

interface Props {
  party: PartyState
  setParty: (p: PartyState) => void
  sortKey: SortKey
  selectedPark: string | null
  setSelectedPark: (p: string) => void
  onAddMember: () => void
  onGoToParken: () => void
}

export function Volgorde({
  party,
  sortKey,
  selectedPark,
  setSelectedPark,
  onAddMember,
  onGoToParken,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lbRide, setLbRide] = useState<RideWithPark | null>(null)

  const selected = party.people.filter((p) => p.on)
  const pref = useMemo(
    () => makePrefAccess(party.typePref, party.propPref),
    [party.typePref, party.propPref],
  )

  if (selected.length === 0) {
    if (party.people.length === 0) {
      return (
        <div className="empty">
          <div className="art">🎢</div>
          <h2>Eerst gezelschap én park</h2>
          <p>
            De volgorde verandert per gezelschap. Voeg leden toe en kies daarna
            een park.
          </p>
          <button className="cta" onClick={onAddMember}>
            + Eerste lid toevoegen
          </button>
          <div className="alt-link">
            Al een gezelschap? Kies dan eerst{" "}
            <u onClick={onGoToParken} style={{ cursor: "pointer" }}>
              welk park
            </u>
            .
          </div>
        </div>
      )
    }
    return (
      <div className="empty">
        <div className="art">👥</div>
        <h2>Vink minstens één lid aan</h2>
        <p>Vink leden aan in de zijbalk om de volgorde te zien.</p>
      </div>
    )
  }

  const activeParks = parks.filter((p) => !party.excludedParks[p])
  if (activeParks.length === 0) {
    return (
      <div className="empty">
        <div className="art">🚫</div>
        <h2>Geen parken in de berekening</h2>
        <p>Ga eerst naar "Welk park?" en haal een uitsluiting terug.</p>
        <button className="cta" onClick={onGoToParken}>
          → Welk park?
        </button>
      </div>
    )
  }

  let parkName = selectedPark
  if (!parkName || !activeParks.includes(parkName)) {
    const rows = activeParks.map((p) => ({
      p,
      m: parkMetrics(ridesOf(p), selected, pref),
    }))
    rows.sort((a, b) =>
      sortKey === "weak"
        ? b.m.minFav - a.m.minFav ||
          b.m.minScore - a.m.minScore ||
          b.m.avgScore - a.m.avgScore
        : b.m.avgFav - a.m.avgFav || b.m.avgScore - a.m.avgScore,
    )
    parkName = rows[0]!.p
    // setSelectedPark zal de hash bijwerken
    queueMicrotask(() => setSelectedPark(parkName!))
  }

  const rides = openRidesOf(parkName).map((r) => ({
    r,
    ...rideGroupScore(r, selected, pref),
  }))
  rides.sort(
    (a, b) =>
      b.score - a.score ||
      b.favCount - a.favCount ||
      b.canCount - a.canCount ||
      a.r.att.localeCompare(b.r.att),
  )
  const haalbaar = rides.filter((x) => x.canCount > 0).length

  return (
    <>
      <div className="parkpicker">
        <Avatar park={parkName} />
        <div className="nm">
          {parkName}
          <Flag park={parkName} />
        </div>
        <button className="chg" onClick={() => setPickerOpen(!pickerOpen)}>
          {pickerOpen ? "Sluiten" : "Wissel ▾"}
        </button>
      </div>
      {pickerOpen && (
        <div className="parkpicker-list">
          {activeParks.map((p) => (
            <div
              key={p}
              className={"pp-item " + (p === parkName ? "on" : "")}
              onClick={() => {
                setSelectedPark(p)
                setPickerOpen(false)
              }}
            >
              <Avatar park={p} />
              <span>{p}</span>
              <Flag park={p} />
            </div>
          ))}
        </div>
      )}

      <div className="grp-lbl">
        Volgorde voor {parkName} · {haalbaar}/{rides.length} haalbaar
      </div>

      {rides.map(({ r, score, favCount }) => {
        const ty = r.type
        const props = r.props || []
        return (
          <div className="ride-row" key={r.att}>
            <div className="rr-main">
              <RideThumb ride={r} onOpen={() => setLbRide(r)} />
              <div className="rr-text">
                <div>
                  <span className="att">{r.att}</span>
                  {favCount > 0 && <span className="heart">♥</span>}
                </div>
                <div className="tags">
                  <span className="tchip">
                    {TEMO[ty]} {TNL[ty]}
                  </span>
                  {props.map((pr) => (
                    <span className="ptag" key={pr} title={PNL[pr]}>
                      {PEMO[pr]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="dots">
              {selected.map((k) => (
                <DotCell key={k.name} member={k} ride={r} pref={pref} />
              ))}
            </div>
            <div className="joy">{score}</div>
          </div>
        )
      })}

      {lbRide && <Lightbox ride={lbRide} onClose={() => setLbRide(null)} />}
    </>
  )
}

function DotCell({
  member,
  ride,
  pref,
}: {
  member: Member
  ride: RideWithPark
  pref: ReturnType<typeof makePrefAccess>
}) {
  const s = status(member, ride)
  const sym = dotSym(s, member, ride)
  let mark: React.ReactNode = null
  if (canDo(s)) {
    const J = joy(member.name, ride, pref)
    if (J.ex) mark = <u className="no">✕</u>
    else if (J.j >= 2) mark = <u>♥</u>
  }
  return (
    <div className={"dot " + s} title={member.name}>
      {sym}
      {mark}
    </div>
  )
}
