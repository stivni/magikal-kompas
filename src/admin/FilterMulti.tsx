/* Multi-select dropdown met optionele per-optie badge. Gedeeld door de
 * categorize- en intensity-toolbars. */

import { useEffect, useRef, useState } from "react"
import type React from "react"

export function FilterMulti<T extends string>({
  label,
  options,
  selected,
  onChange,
  renderOption,
  renderOptionBadge,
}: {
  label: string
  options: T[]
  selected: Set<T>
  onChange: (s: Set<T>) => void
  renderOption: (o: T) => string
  renderOptionBadge?: (o: T) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const summary =
    selected.size === 0
      ? "Alle"
      : selected.size === 1
        ? renderOption([...selected][0]!)
        : `${selected.size} geselecteerd`

  function toggle(o: T) {
    const next = new Set(selected)
    if (next.has(o)) next.delete(o)
    else next.add(o)
    onChange(next)
  }

  return (
    <div className="cat-filter" ref={wrapRef}>
      <button className="cat-filter-btn" onClick={() => setOpen((v) => !v)}>
        <span className="cat-filter-lbl">{label}:</span>
        <span className="cat-filter-sum">{summary}</span>
        <span className="cat-filter-caret">▾</span>
      </button>
      {open && (
        <div className="cat-filter-menu">
          {selected.size > 0 && (
            <button className="cat-filter-clear" onClick={() => onChange(new Set())}>
              Wissen
            </button>
          )}
          {options.map((o) => (
            <label key={o} className="cat-filter-opt">
              <input type="checkbox" checked={selected.has(o)} onChange={() => toggle(o)} />
              <span className="cat-filter-opt-lbl">{renderOption(o)}</span>
              {renderOptionBadge?.(o)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
