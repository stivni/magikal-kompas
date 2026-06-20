/* Eén chrome-component voor sidebar (desktop) en topbar (mobiel).
 *
 * Inhoud is identiek tussen breakpoints — brand, mode-switcher, pill,
 * disclaimers, taal, instellingen, over. De vorm verandert: verticale
 * sidebar op desktop, horizontale topbar op mobiel. Disclaimers vallen op
 * mobiel weg omdat ze ook in de page-foot staan.
 *
 * Zie ADR-018 (chrome per breakpoint). */

import { useEffect, useState } from "react"
import type { PartyState } from "../../shared/types"
import type { Tab } from "../useHashRoute"
import { PartyPill } from "./PartyPill"

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  party: PartyState
  onTogglePill: () => void
  onAbout: () => void
}

const MOBILE_QUERY = "(max-width: 960px)"

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches,
  )
  useEffect(() => {
    const m = window.matchMedia(MOBILE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    m.addEventListener("change", handler)
    return () => m.removeEventListener("change", handler)
  }, [])
  return isMobile
}

function LangPicker({ compact }: { compact: boolean }) {
  return (
    <select
      className={"lang-pill" + (compact ? "" : " rail-lang")}
      title="Taal"
      aria-label="Taal"
      defaultValue="nl"
    >
      {compact ? (
        <>
          <option value="nl">NL</option>
          <option value="fr" disabled>FR</option>
          <option value="en" disabled>EN</option>
        </>
      ) : (
        <>
          <option value="nl">Nederlands</option>
          <option value="fr" disabled>Français (binnenkort)</option>
          <option value="en" disabled>English (binnenkort)</option>
        </>
      )}
    </select>
  )
}

function Brand() {
  return (
    <a className="brand" href="#" aria-label="Magikal Kompas">
      <img
        src={`${import.meta.env.BASE_URL}assets/brand/logo.png`}
        alt="Magikal Kompas"
        className="brand-logo"
      />
    </a>
  )
}

export function Chrome({
  tab,
  setTab,
  party,
  onTogglePill,
  onAbout,
}: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <header className="appbar">
        <div className="appbar-inner">
          <Brand />
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
          <LangPicker compact />
          <PartyPill
            party={party}
            active={tab === "deelnemers"}
            onClick={onTogglePill}
            variant="appbar"
          />
        </div>
      </header>
    )
  }

  return (
    <aside className="rail">
      <div className="rail-brand">
        <Brand />
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

      <PartyPill
        party={party}
        active={tab === "deelnemers"}
        onClick={onTogglePill}
        variant="rail"
      />

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
        <LangPicker compact={false} />
        <div className="rail-foot-links">
          <button className="footlink" onClick={onAbout}>ℹ Over</button>
        </div>
        {import.meta.env.DEV && (
          <a className="footlink admin-link" href="/admin/">🛠 Admin</a>
        )}
      </div>
    </aside>
  )
}
