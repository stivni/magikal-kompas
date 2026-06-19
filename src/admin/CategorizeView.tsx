/* Tijdelijk experimenteer-tool: sleep rides over kolommen om empirisch
 * een goede categorie-indeling te zoeken (voedt ADR-024/ADR-025).
 * Alleen lokale state (localStorage) — schrijft NOOIT naar park-JSON's
 * of naar het echte Category-type. */

import { useEffect, useMemo, useRef, useState } from "react"
import type { Park, Ride, TypeKey } from "../shared/types"
import { CATEGORIES, TEMO, TNL } from "../shared/vocab"

const STORAGE_KEY = "mk-categorize-experiment-v1"
const UNSORTED_ID = "unsorted"
const DRAG_MIME = "application/x-mk-ride"

interface Column {
  id: string
  title: string
}

interface CatState {
  columns: Column[]
  /** key = "<park>|<att>"  →  column id */
  placement: Record<string, string>
}

function rideKey(park: string, att: string): string {
  return park + "|" + att
}

function seededState(parks: Park[]): CatState {
  const columns: Column[] = [
    { id: UNSORTED_ID, title: "Ongesorteerd" },
    ...CATEGORIES.map((c) => ({ id: c.key, title: c.label })),
  ]
  const placement: Record<string, string> = {}
  parks.forEach((p) =>
    p.rides.forEach((r) => {
      placement[rideKey(p.park, r.att)] = UNSORTED_ID
    }),
  )
  return { columns, placement }
}

function loadState(parks: Park[]): CatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seededState(parks)
    const parsed = JSON.parse(raw) as Partial<CatState>
    const columns: Column[] = Array.isArray(parsed.columns)
      ? parsed.columns.filter((c): c is Column => !!c && typeof c.id === "string")
      : []
    if (!columns.find((c) => c.id === UNSORTED_ID)) {
      columns.unshift({ id: UNSORTED_ID, title: "Ongesorteerd" })
    }
    const placement: Record<string, string> = { ...(parsed.placement ?? {}) }
    const colIds = new Set(columns.map((c) => c.id))
    // Plaats elke huidige ride en zorg dat verwijderde kolommen → unsorted.
    parks.forEach((p) =>
      p.rides.forEach((r) => {
        const k = rideKey(p.park, r.att)
        if (!placement[k] || !colIds.has(placement[k]!)) placement[k] = UNSORTED_ID
      }),
    )
    return { columns, placement }
  } catch {
    return seededState(parks)
  }
}

export function CategorizeView({ parks }: { parks: Park[] }) {
  const [state, setState] = useState<CatState>(() => loadState(parks))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Filters
  const [parkFilter, setParkFilter] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<Set<TypeKey>>(new Set())
  const [hideSorted, setHideSorted] = useState(false)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const allRides = useMemo(() => {
    const out: Array<{ park: string; ride: Ride; key: string }> = []
    parks.forEach((p) =>
      p.rides.forEach((r) => out.push({ park: p.park, ride: r, key: rideKey(p.park, r.att) })),
    )
    return out
  }, [parks])

  const availableTypes = useMemo(() => {
    const set = new Set<TypeKey>()
    allRides.forEach(({ ride }) => set.add(ride.type))
    return [...set].sort()
  }, [allRides])

  function passesFilters(park: string, ride: Ride, colId: string): boolean {
    if (parkFilter.size && !parkFilter.has(park)) return false
    if (typeFilter.size && !typeFilter.has(ride.type)) return false
    if (hideSorted && colId !== UNSORTED_ID) return false
    return true
  }

  function ridesInColumn(colId: string) {
    return allRides.filter(({ park, ride, key }) => {
      const place = state.placement[key] ?? UNSORTED_ID
      if (place !== colId) return false
      return passesFilters(park, ride, colId)
    })
  }

  function moveRide(key: string, toColId: string) {
    setState((s) => {
      if ((s.placement[key] ?? UNSORTED_ID) === toColId) return s
      return { ...s, placement: { ...s.placement, [key]: toColId } }
    })
  }

  function addColumn() {
    const id = "col_" + Date.now().toString(36) + "_" + state.columns.length
    setState((s) => ({ ...s, columns: [...s.columns, { id, title: "Nieuwe categorie" }] }))
  }

  function renameColumn(id: string, title: string) {
    setState((s) => ({
      ...s,
      columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)),
    }))
  }

  function removeColumn(id: string) {
    if (id === UNSORTED_ID) return
    setState((s) => {
      const placement = { ...s.placement }
      for (const k of Object.keys(placement)) {
        if (placement[k] === id) placement[k] = UNSORTED_ID
      }
      return { columns: s.columns.filter((c) => c.id !== id), placement }
    })
  }

  function moveColumn(id: string, dir: -1 | 1) {
    setState((s) => {
      const i = s.columns.findIndex((c) => c.id === id)
      if (i < 0) return s
      const j = i + dir
      if (j < 0 || j >= s.columns.length) return s
      // Ongesorteerd mag overal staan; geen extra restrictie.
      const cols = [...s.columns]
      const tmp = cols[i]!
      cols[i] = cols[j]!
      cols[j] = tmp
      return { ...s, columns: cols }
    })
  }

  function exportJson() {
    const out: Record<string, Array<{ park: string; att: string }>> = {}
    state.columns.forEach((c) => {
      out[c.title] = []
    })
    Object.entries(state.placement).forEach(([key, colId]) => {
      const col = state.columns.find((c) => c.id === colId)
      if (!col) return
      const idx = key.indexOf("|")
      if (idx < 0) return
      const park = key.slice(0, idx)
      const att = key.slice(idx + 1)
      out[col.title]!.push({ park, att })
    })
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mk-categorize-experiment.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  function triggerImport() {
    fileInputRef.current?.click()
  }
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt) as Record<string, Array<{ park: string; att: string }>>
        // Bouw kolommen op basis van titels uit het bestand; behoud unsorted als eerste.
        const titles = Object.keys(parsed)
        const columns: Column[] = [{ id: UNSORTED_ID, title: "Ongesorteerd" }]
        titles.forEach((title, i) => {
          if (title === "Ongesorteerd") {
            columns[0]!.title = title
            return
          }
          // Hergebruik bestaande id's waar mogelijk (CATEGORIES.key matcht).
          const seed = CATEGORIES.find((c) => c.label === title)
          const id = seed ? seed.key : "col_imp_" + i
          columns.push({ id, title })
        })
        const placement: Record<string, string> = {}
        // Default alles naar unsorted, dan toewijzen vanuit bestand.
        allRides.forEach(({ key }) => {
          placement[key] = UNSORTED_ID
        })
        titles.forEach((title) => {
          const col = columns.find((c) => c.title === title)
          if (!col) return
          parsed[title]!.forEach(({ park, att }) => {
            placement[rideKey(park, att)] = col.id
          })
        })
        setState({ columns, placement })
      } catch (err) {
        alert("Importeren mislukt: " + (err as Error).message)
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    })
  }

  function resetAll() {
    if (!confirm("Reset naar startindeling? Alle plaatsingen gaan verloren.")) return
    setState(seededState(parks))
  }

  // Statistieken voor de toolbar
  const totals = useMemo(() => {
    const sorted = allRides.filter(({ key }) => (state.placement[key] ?? UNSORTED_ID) !== UNSORTED_ID)
      .length
    return { total: allRides.length, sorted, unsorted: allRides.length - sorted }
  }, [allRides, state.placement])

  return (
    <div className="cat-view">
      <div className="cat-toolbar">
        <div className="cat-tb-row">
          <FilterMulti
            label="Park"
            options={parks.map((p) => p.park)}
            selected={parkFilter}
            onChange={setParkFilter}
            renderOption={(o) => o}
          />
          <FilterMulti
            label="Type"
            options={availableTypes}
            selected={typeFilter}
            onChange={setTypeFilter as (s: Set<string>) => void}
            renderOption={(o) => `${TEMO[o as TypeKey] ?? ""} ${TNL[o as TypeKey] ?? o}`}
          />
          <label className="cat-toggle">
            <input
              type="checkbox"
              checked={hideSorted}
              onChange={(e) => setHideSorted(e.target.checked)}
            />
            <span>Verberg gesorteerde</span>
          </label>
          <span className="cat-tb-sep" />
          <button className="cat-btn" onClick={addColumn}>+ Kolom</button>
          <button className="cat-btn" onClick={exportJson}>⬇ Export</button>
          <button className="cat-btn" onClick={triggerImport}>⬆ Import</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <div className="cat-spacer" />
          <span className="cat-stat">
            {totals.sorted} / {totals.total} gesorteerd
          </span>
          <button className="cat-btn cat-btn-danger" onClick={resetAll}>Reset</button>
        </div>
      </div>

      {(() => {
        const unsortedItems = ridesInColumn(UNSORTED_ID)
        const isDropOver = dropTarget === UNSORTED_ID
        return (
          <div
            className={"cat-unsorted-zone" + (isDropOver ? " drop-over" : "")}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(DRAG_MIME)) {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                if (dropTarget !== UNSORTED_ID) setDropTarget(UNSORTED_ID)
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDropTarget(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              const key = e.dataTransfer.getData(DRAG_MIME)
              if (key) moveRide(key, UNSORTED_ID)
              setDropTarget(null)
            }}
          >
            <div className="cat-unsorted-head">
              <span className="cat-unsorted-title">Ongesorteerd</span>
              <span className="cat-col-count">{unsortedItems.length}</span>
              <span className="cat-unsorted-hint">Sleep een tegel naar een kolom onderaan</span>
            </div>
            <div className="cat-unsorted-strip">
              {unsortedItems.length === 0 ? (
                <div className="cat-col-empty">— alles gesorteerd —</div>
              ) : (
                unsortedItems.map(({ park, ride, key }) => (
                  <RideTile key={key} park={park} ride={ride} dragKey={key} />
                ))
              )}
            </div>
          </div>
        )
      })()}

      <div className="cat-cols">
        {state.columns.filter((c) => c.id !== UNSORTED_ID).map((col) => {
          const items = ridesInColumn(col.id)
          const isDropOver = dropTarget === col.id
          const realIdx = state.columns.findIndex((c) => c.id === col.id)
          const realLen = state.columns.length
          return (
            <div
              key={col.id}
              className={"cat-col" + (isDropOver ? " drop-over" : "")}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(DRAG_MIME)) {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (dropTarget !== col.id) setDropTarget(col.id)
                }
              }}
              onDragLeave={(e) => {
                // alleen reset als we de kolom-container verlaten, niet bij child→child
                if (e.currentTarget === e.target) setDropTarget(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const key = e.dataTransfer.getData(DRAG_MIME)
                if (key) moveRide(key, col.id)
                setDropTarget(null)
              }}
            >
              <div className="cat-col-head">
                <input
                  className="cat-col-title"
                  value={col.title}
                  onChange={(e) => renameColumn(col.id, e.target.value)}
                />
                <div className="cat-col-subhead">
                  <span className="cat-col-count">{items.length}</span>
                  <div className="cat-col-ctl">
                    <button
                      className="cat-iconbtn"
                      title="Naar links"
                      onClick={() => moveColumn(col.id, -1)}
                      disabled={realIdx <= 1}
                    >
                      ‹
                    </button>
                    <button
                      className="cat-iconbtn"
                      title="Naar rechts"
                      onClick={() => moveColumn(col.id, +1)}
                      disabled={realIdx === realLen - 1}
                    >
                      ›
                    </button>
                    <button
                      className="cat-iconbtn cat-iconbtn-danger"
                      title="Kolom verwijderen (rides → ongesorteerd)"
                      onClick={() => {
                        if (confirm(`Kolom "${col.title}" verwijderen?`)) removeColumn(col.id)
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              <div className="cat-col-body">
                {items.length === 0 ? (
                  <div className="cat-col-empty">— leeg —</div>
                ) : (
                  items.map(({ park, ride, key }) => (
                    <RideTile key={key} park={park} ride={ride} dragKey={key} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Proxy omzeilt hotlink-blokkade bij externe park-site URLs in admin_preview.
function proxify(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return `/api/admin-preview?u=${encodeURIComponent(url)}`
  return url
}

function RideTile({ park, ride, dragKey }: { park: string; ride: Ride; dragKey: string }) {
  const [imgState, setImgState] = useState<"preview" | "image" | "emoji">("preview")
  const emoji = TEMO[ride.type] ?? "•"

  const previewSrc = proxify(ride.admin_preview?.url) || ride.image?.url
  const imageSrc = ride.image?.url

  const currentSrc =
    imgState === "preview" ? previewSrc :
    imgState === "image" ? imageSrc :
    undefined

  function handleError() {
    if (imgState === "preview" && imageSrc) {
      setImgState("image")
    } else {
      setImgState("emoji")
    }
  }

  return (
    <div
      className="cat-tile"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData(DRAG_MIME, dragKey)
      }}
      title={`${ride.att} — ${park} — ${TNL[ride.type]}`}
    >
      <div className="cat-tile-thumb">
        {currentSrc && imgState !== "emoji" ? (
          <img src={currentSrc} alt="" loading="lazy" onError={handleError} />
        ) : (
          <span className="cat-tile-emo">{emoji}</span>
        )}
        <span className="cat-tile-typebadge" title={TNL[ride.type]}>{emoji}</span>
        {ride.park_url && (
          <a
            href={ride.park_url}
            target="_blank"
            rel="noopener noreferrer"
            className="cat-tile-extlink"
            title={`Open op park-site: ${ride.park_url}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="url-ext-ico"
            >
              <path d="M14 3h7v7" />
              <path d="M10 14L21 3" />
              <path d="M21 14v7h-7" />
              <path d="M3 10v11h11" />
            </svg>
          </a>
        )}
      </div>
      <div className="cat-tile-name">{ride.att}</div>
      <div className="cat-tile-park">{park}</div>
    </div>
  )
}

function FilterMulti<T extends string>({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string
  options: T[]
  selected: Set<T>
  onChange: (s: Set<T>) => void
  renderOption: (o: T) => string
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
              <span>{renderOption(o)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
