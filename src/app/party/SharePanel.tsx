/* SharePanel: kies leden, toon QR + url-input. Externe QRCode-lib via global. */

import { useEffect, useRef, useState } from "react"
import type { Member, PartyState } from "../../shared/types"
import { ageRange } from "../../shared/scoring"
import { sortMembers } from "../../shared/helpers"
import { shareURL } from "../partyStore"

declare global {
  interface Window {
    QRCode?: {
      new (el: HTMLElement, opts: { text: string; width: number; height: number; correctLevel: number }): unknown
      CorrectLevel: { L: number; M: number; Q: number; H: number }
    }
  }
}

function memberSummary(p: Member): string {
  const ageD = (() => {
    const r = ageRange(p, new Date())
    if (!r) return null
    return r.lo === r.hi ? `${r.lo} j` : `${r.lo}–${r.hi} j`
  })()
  const parts = [p.h != null ? `${p.h} cm` : null, ageD].filter(Boolean)
  return parts.length ? parts.join(" · ") : "geen lengte"
}

export function SharePanel({
  party,
  onClose,
}: {
  party: PartyState
  onClose: () => void
}) {
  const [included, setIncluded] = useState<Set<string>>(
    () => new Set(party.people.map((p) => p.name)),
  )
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement | null>(null)

  const names = [...included]
  const url = names.length ? shareURL(party, names) : ""

  useEffect(() => {
    if (!url || !qrRef.current) return
    const el = qrRef.current
    el.innerHTML = ""
    if (window.QRCode) {
      try {
        new window.QRCode(el, {
          text: url,
          width: 200,
          height: 200,
          correctLevel: window.QRCode.CorrectLevel.L,
        })
      } catch {
        el.innerHTML = '<span class="muted">QR niet beschikbaar; gebruik de link.</span>'
      }
    } else {
      el.innerHTML = '<span class="muted">QR-bibliotheek niet geladen; gebruik de link.</span>'
    }
  }, [url])

  function toggle(name: string) {
    const next = new Set(included)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setIncluded(next)
  }

  function doCopy() {
    if (!url) return
    try {
      navigator.clipboard.writeText(url)
    } catch {
      const i = document.getElementById("shurl") as HTMLInputElement | null
      i?.select()
      document.execCommand?.("copy")
    }
    setCopied(true)
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
          <b>Deelnemers delen</b>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted">
          Vink aan wie je wil delen. Naam, lengte, voorkeuren en uitzonderingen
          reizen mee — alleen voor de aangevinkte leden. Niks gaat naar een
          server. De ontvanger kiest zelf wat te doen als een naam al bestaat.
        </p>
        <div className="sharelist">
          {sortMembers(party.people).map((p) => (
            <div
              key={p.name}
              className="sharerow"
              onClick={() => toggle(p.name)}
            >
              <div className={"chk " + (included.has(p.name) ? "on" : "")}>
                <svg viewBox="0 0 24 24">
                  <polyline points="4,12 10,18 20,6" />
                </svg>
              </div>
              <span className="sr-name">{p.name}</span>
              <span className="muted">{memberSummary(p)}</span>
            </div>
          ))}
        </div>
        {url ? (
          <>
            <div className="qr" ref={qrRef}></div>
            <div className="urlbox">
              <input id="shurl" readOnly value={url} />
              <button className="expbtn" onClick={doCopy}>
                {copied ? "Gekopieerd" : "Kopieer"}
              </button>
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>
            Vink minstens één lid aan om een link te maken.
          </p>
        )}
      </div>
    </div>
  )
}
