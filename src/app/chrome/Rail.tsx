/* Sidebar / mobile sheet: brand, mode-switcher, gezelschap, "goed om te weten",
 * sticky voet met taalkiezer + instellingen/over. Zie ADR-018. */

import type { PartyState } from "../../shared/types"
import type { Tab } from "../useHashRoute"
import { PartyPanel } from "../party/PartyPanel"

interface Props {
  open: boolean
  tab: Tab
  setTab: (t: Tab) => void
  party: PartyState
  setParty: (p: PartyState) => void
  onClose: () => void
  onShare: () => void
  onSettings: () => void
  onAbout: () => void
}

export function Rail({
  open,
  tab,
  setTab,
  party,
  setParty,
  onClose,
  onShare,
  onSettings,
  onAbout,
}: Props) {
  const on = party.people.filter((p) => p.on).length
  const total = party.people.length
  return (
    <aside className={"rail " + (open ? "show" : "")}>
      <button className="rail-close" onClick={onClose} title="Sluiten">✕</button>

      <div className="rail-brand">
        <a className="brand" href="#" aria-label="Magikal Kompas">
          <img src="/assets/brand/logo.png" alt="Magikal Kompas" className="brand-logo" />
        </a>
      </div>

      <div className="rail-modes">
        <button
          className={"big-mode " + (tab === "parken" ? "on" : "")}
          onClick={() => setTab("parken")}
        >
          <div className="bm-title">Welk park?</div>
          <div className="bm-sub">Vergelijk parken op groepsplezier</div>
        </button>
        <button
          className={"big-mode " + (tab === "volgorde" ? "on" : "")}
          onClick={() => setTab("volgorde")}
        >
          <div className="bm-title">Wat eerst?</div>
          <div className="bm-sub">Sorteer attracties in één park</div>
        </button>
      </div>

      <div className="rail-sec">
        <div className="rail-head">
          <span className="rail-title">
            Wie gaat mee? <span className="rail-count">{on}/{total}</span>
          </span>
          <div className="rail-actions">
            <button className="minibtn" onClick={onShare} title="Deelnemers delen">
              <svg
                className="ico-share"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Deel deelnemers</span>
            </button>
          </div>
        </div>
        <PartyPanel party={party} setParty={setParty} />
      </div>

      <div className="rail-sec rail-disc">
        <div className="rail-head">
          <span className="rail-title">Goed om te weten</span>
        </div>
        <details className="disc-item">
          <summary>
            <span className="disc-emo">⚠️</span>
            <span className="disc-lbl">Check regels ter plaatse</span>
            <span className="disc-info" aria-hidden="true">ℹ</span>
          </summary>
          <div className="disc-body">
            Lengte-eisen, leeftijdsgrenzen en regels kunnen wijzigen. Kijk
            altijd op de parksite voor het exacte beleid op jullie datum.
          </div>
        </details>
        <details className="disc-item">
          <summary>
            <span className="disc-emo">🚦</span>
            <span className="disc-lbl">Geen reistijd of wachtrijen</span>
            <span className="disc-info" aria-hidden="true">ℹ</span>
          </summary>
          <div className="disc-body">
            De volgorde houdt rekening met haalbaarheid en plezier, niet met
            wandelafstand binnen het park of wachtrijen. Plan zelf de
            logistiek; gebruik dit als startpunt.
          </div>
        </details>
        <details className="disc-item">
          <summary>
            <span className="disc-emo">🔒</span>
            <span className="disc-lbl">Blijft op dit toestel</span>
            <span className="disc-info" aria-hidden="true">ℹ</span>
          </summary>
          <div className="disc-body">
            Gezelschap, voorkeuren en instellingen worden lokaal opgeslagen.
            Delen gebeurt enkel als jij actief een link of QR maakt — er is
            geen server in het spel.
          </div>
        </details>
        <details className="disc-item">
          <summary>
            <span className="disc-emo">🎢</span>
            <span className="disc-lbl">Niet gelieerd aan de parken</span>
            <span className="disc-info" aria-hidden="true">ℹ</span>
          </summary>
          <div className="disc-body">
            Magikal Kompas is een persoonlijk hulpje. Park- en attractiedata
            worden best-effort onderhouden; correcties zijn welkom.
          </div>
        </details>
      </div>

      <div className="rail-foot">
        <select
          className="lang-pill rail-lang"
          title="Taal"
          aria-label="Taal"
          defaultValue="nl"
        >
          <option value="nl">Nederlands</option>
          <option value="fr" disabled>Français (binnenkort)</option>
          <option value="en" disabled>English (binnenkort)</option>
        </select>
        <div className="rail-foot-links">
          <button className="footlink" onClick={onSettings}>⚙ Instellingen</button>
          <button className="footlink" onClick={onAbout}>ℹ Over</button>
        </div>
      </div>
    </aside>
  )
}
