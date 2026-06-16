/* Mobiele appbar: brand + tab-switcher + taal + party-pill + tandwiel.
 * Sidebar dekt deze rol op desktop (zie ADR-018). */

import type { PartyState } from "../../shared/types"
import type { Tab } from "../useHashRoute"

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  party: PartyState
  onOpenRail: () => void
  onOpenSettings: () => void
}

export function AppBar({ tab, setTab, party, onOpenRail, onOpenSettings }: Props) {
  const on = party.people.filter((p) => p.on).length
  const total = party.people.length
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <a className="brand" href="#" aria-label="Magikal Kompas">
          <img src={`${import.meta.env.BASE_URL}assets/brand/logo.png`} alt="Magikal Kompas" className="brand-logo" />
        </a>
        <nav className="modes-mob">
          <button
            className={"mode " + (tab === "parken" ? "on" : "")}
            onClick={() => setTab("parken")}
          >
            Welk park?
          </button>
          <button
            className={"mode " + (tab === "volgorde" ? "on" : "")}
            onClick={() => setTab("volgorde")}
          >
            Wat eerst?
          </button>
        </nav>
        <div className="spacer"></div>
        <select className="lang-pill" title="Taal" aria-label="Taal" defaultValue="nl">
          <option value="nl">NL</option>
          <option value="fr" disabled>FR (binnenkort)</option>
          <option value="en" disabled>EN (binnenkort)</option>
        </select>
        <button className="party-pill" onClick={onOpenRail} title="Gezelschap">
          <span className="ico">👥</span>
          <span className="names">{on}/{total}</span>
        </button>
        <button className="cogbtn" onClick={onOpenSettings} title="Instellingen">⚙</button>
      </div>
    </header>
  )
}
