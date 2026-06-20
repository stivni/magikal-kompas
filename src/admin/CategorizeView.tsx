/* Admin curatie-view: drie assen in kolom-layout met drag-drop naar park-JSON.
 *
 * Drie views via top-bar switcher:
 *  - Type-view:      37 TypeKey-kolommen, gegroepeerd per cluster, drag → ride.type
 *  - Intensity-view: 5 kolommen 1-5, drag → ride.intensity
 *  - Hoogte-view:    5 kolommen 1-5, drag → ride.height_intensity
 *
 * Drag-drop schrijft direct naar de park-JSON via api.ts (apiPatchRideType /
 * apiPatchRideIntensity). Optimistisch updaten + rollback bij error.
 * Geen localStorage meer — echte data is de bron. */

import { useCallback, useMemo, useRef, useState } from "react"
import type { Category, Park, Ride, TypeKey } from "../shared/types"
import {
  CATEGORIES,
  CEMO,
  CNL,
  HEIGHT_ANCHORS,
  INTENSITY_ANCHORS,
  TEMO,
  TNL,
  TYPES,
} from "../shared/vocab"
import { categoryOf } from "../shared/scoring"
import { FilterMulti } from "./FilterMulti"
import { DRAG_MIME, RideTile } from "./RideTile"
import { apiPatchRideIntensity, apiPatchRideType } from "./api"

// ── Cluster-definitie voor de Type-view (afgeleid uit categoryOf) ─────────────

interface CategoryCluster {
  category: Category
  types: TypeKey[]
}

/** Groepeer alle TypeKeys per gevoel-categorie, in de volgorde van ADR-025. */
const CATEGORY_CLUSTERS: CategoryCluster[] = (() => {
  const map = new Map<Category, TypeKey[]>()
  // Initialiseer in de volgorde uit CATEGORIES (ADR-025: thrill · spin · immerse · splash · compete · drive · romp · savor)
  for (const { key } of CATEGORIES) map.set(key, [])
  // Verdeel alle TypeKeys over hun categorie
  for (const t of TYPES) {
    const cat = categoryOf(t)
    map.get(cat)!.push(t)
  }
  return [...map.entries()].map(([category, types]) => ({ category, types }))
})()

// ── Intensity / Hoogte assen ──────────────────────────────────────────────────

const INT_COLS = [1, 2, 3, 4, 5] as const

// Kleur-gradient groen→rood voor intensiteit-kolommen
const INT_COLORS = [
  "#4caf50", // 1 = licht
  "#8bc34a", // 2
  "#ff9800", // 3
  "#f44336", // 4
  "#b71c1c", // 5 = mega
] as const

// ── Types ──────────────────────────────────────────────────────────────────────

type AxisMode = "type" | "intensity" | "height"

interface RideItem {
  park: Park
  ride: Ride
  /** "<park.park>|<ride.att>" */
  key: string
}

// Save-state per ride-key
type RideSaveState = "idle" | "saving" | "saved" | "error"

// ── Helpers ────────────────────────────────────────────────────────────────────

function rideKey(parkName: string, att: string): string {
  return parkName + "|" + att
}

function parseDropKeys(raw: string): string[] {
  return raw.split("\n").map((s) => s.trim()).filter(Boolean)
}


// ── Hoofd-component ─────────────────────────────────────────────────────────

export function CategorizeView({ parks: initialParks }: { parks: Park[] }) {
  const [parks, setParks] = useState<Park[]>(() =>
    initialParks.map((p) => structuredClone(p)),
  )
  const [axis, setAxis] = useState<AxisMode>("type")
  const [parkFilter, setParkFilter] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [saveStates, setSaveStates] = useState<Record<string, RideSaveState>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Uitklapstatus per cluster-label (type-view)
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set())
  // Uitgebreide (detail) tegel
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  // Synchroniseer parks als de prop verandert (bv. bij save in AdminApp)
  const prevInitialRef = useRef(initialParks)
  if (prevInitialRef.current !== initialParks) {
    prevInitialRef.current = initialParks
    setParks(initialParks.map((p) => structuredClone(p)))
  }

  // ── Alle rides gecombineerd ────────────────────────────────────────────────

  const allItems = useMemo<RideItem[]>(() => {
    const out: RideItem[] = []
    parks.forEach((p) =>
      p.rides.forEach((r) =>
        out.push({ park: p, ride: r, key: rideKey(p.park, r.att) }),
      ),
    )
    return out
  }, [parks])

  // ── Filter ────────────────────────────────────────────────────────────────

  const normalizedSearch = search.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    return allItems.filter(({ park, ride }) => {
      if (parkFilter.size && !parkFilter.has(park.park)) return false
      if (normalizedSearch) {
        const hay = (ride.att + " " + park.park).toLowerCase()
        if (!hay.includes(normalizedSearch)) return false
      }
      return true
    })
  }, [allItems, parkFilter, normalizedSearch])

  // ── Per-kolom items ───────────────────────────────────────────────────────

  function itemsForType(t: TypeKey): RideItem[] {
    return filteredItems.filter(({ ride }) => ride.type === t)
  }

  function itemsForInt(n: number, field: "intensity" | "height_intensity"): RideItem[] {
    return filteredItems.filter(({ ride }) => ride[field] === n)
  }

  function itemsNoInt(field: "intensity" | "height_intensity"): RideItem[] {
    return filteredItems.filter(({ ride }) => ride[field] == null)
  }

  // Ref om altijd de actuele parks te kunnen lezen in async callbacks
  const parksRef = useRef<Park[]>(parks)
  parksRef.current = parks

  // ── Save-helpers ──────────────────────────────────────────────────────────

  function setSave(key: string, state: RideSaveState) {
    setSaveStates((s) => ({ ...s, [key]: state }))
    if (state === "saved") {
      setTimeout(() => setSaveStates((s) => ({ ...s, [key]: "idle" })), 1500)
    }
  }

  // Rollback: herstel de originele waarden
  function rollback(parkName: string, att: string, original: Ride) {
    setParks((prev) =>
      prev.map((p) => {
        if (p.park !== parkName) return p
        return { ...p, rides: p.rides.map((r) => (r.att === att ? original : r)) }
      }),
    )
  }

  // ── Drag-drop handlers ────────────────────────────────────────────────────

  const handleDropType = useCallback(
    async (keys: string[], newType: TypeKey) => {
      for (const key of keys) {
        const sep = key.indexOf("|")
        if (sep < 0) continue
        const parkName = key.slice(0, sep)
        const att = key.slice(sep + 1)
        const parkObj = parksRef.current.find((p) => p.park === parkName)
        if (!parkObj) continue
        const rideObj = parkObj.rides.find((r) => r.att === att)
        if (!rideObj) continue
        if (rideObj.type === newType) continue

        const original = structuredClone(rideObj)
        setSave(key, "saving")
        // Bouw updatedPark zelf op (zonder te wachten op setState) voor de API
        const updatedPark: Park = {
          ...parkObj,
          rides: parkObj.rides.map((r) =>
            r.att === att ? { ...r, type: newType, tag_source: "admin" } : r,
          ),
        }
        setParks((prev) =>
          prev.map((p) => (p.park === parkName ? updatedPark : p)),
        )

        try {
          await apiPatchRideType(updatedPark, att, newType)
          setSave(key, "saved")
        } catch (e: unknown) {
          setSave(key, "error")
          setErrorMsg((e as Error).message || "Opslaan mislukt")
          rollback(parkName, att, original)
          setTimeout(() => setErrorMsg(null), 4000)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleDropIntensity = useCallback(
    async (keys: string[], value: number, field: "intensity" | "height_intensity") => {
      for (const key of keys) {
        const sep = key.indexOf("|")
        if (sep < 0) continue
        const parkName = key.slice(0, sep)
        const att = key.slice(sep + 1)
        const parkObj = parksRef.current.find((p) => p.park === parkName)
        if (!parkObj) continue
        const rideObj = parkObj.rides.find((r) => r.att === att)
        if (!rideObj) continue
        if (rideObj[field] === value) continue

        const original = structuredClone(rideObj)
        setSave(key, "saving")
        const updatedPark: Park = {
          ...parkObj,
          rides: parkObj.rides.map((r) =>
            r.att === att ? { ...r, [field]: value } : r,
          ),
        }
        setParks((prev) =>
          prev.map((p) => (p.park === parkName ? updatedPark : p)),
        )

        try {
          await apiPatchRideIntensity(updatedPark, att, field, value)
          setSave(key, "saved")
        } catch (e: unknown) {
          setSave(key, "error")
          setErrorMsg((e as Error).message || "Opslaan mislukt")
          rollback(parkName, att, original)
          setTimeout(() => setErrorMsg(null), 4000)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ── Cluster toggle ────────────────────────────────────────────────────────

  function toggleCluster(label: string) {
    setCollapsedClusters((s) => {
      const next = new Set(s)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function makeDragHandlers(
    colId: string,
    onDrop: (keys: string[]) => void,
  ) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault()
          e.dataTransfer.dropEffect = "move"
          if (dropTarget !== colId) setDropTarget(colId)
        }
      },
      onDragLeave: (e: React.DragEvent) => {
        if (e.currentTarget === e.target) setDropTarget(null)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        const keys = parseDropKeys(e.dataTransfer.getData(DRAG_MIME))
        if (keys.length) onDrop(keys)
        setDropTarget(null)
      },
    }
  }

  function renderTiles(items: RideItem[]) {
    return items.map(({ park, ride, key }) => (
      <div key={key} className="curate-tile-wrap">
        <div className={"curate-tile-save save-" + (saveStates[key] ?? "idle")}>
          {saveStates[key] === "saving" && <span className="save-spinner" />}
          {saveStates[key] === "saved" && <span className="save-check">✓</span>}
          {saveStates[key] === "error" && <span className="save-err">!</span>}
        </div>
        <div onClick={() => setExpandedKey(expandedKey === key ? null : key)}>
          <RideTile park={park.park} ride={ride} dragKey={key} />
        </div>
        {expandedKey === key && (
          <RideDetail park={park} ride={ride} allParks={parks} />
        )}
      </div>
    ))
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const statsType = useMemo(() => {
    const untyped = filteredItems.filter(({ ride }) => !ride.type).length
    return { total: filteredItems.length, untyped }
  }, [filteredItems])

  const statsInt = useMemo(() => {
    const noInt = itemsNoInt("intensity").length
    const noH = itemsNoInt("height_intensity").length
    return { total: filteredItems.length, noInt, noH }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="cat-view">
      {/* Toolbar */}
      <div className="cat-toolbar">
        <div className="cat-tb-row">
          {/* Axis switcher */}
          <div className="curate-axis-switch">
            <button
              className={"curate-axis-btn" + (axis === "type" ? " on" : "")}
              onClick={() => setAxis("type")}
            >
              Type
            </button>
            <button
              className={"curate-axis-btn" + (axis === "intensity" ? " on" : "")}
              onClick={() => setAxis("intensity")}
            >
              Intensiteit
            </button>
            <button
              className={"curate-axis-btn" + (axis === "height" ? " on" : "")}
              onClick={() => setAxis("height")}
            >
              Hoogte
            </button>
          </div>

          <span className="cat-tb-sep" />

          <FilterMulti
            label="Park"
            options={parks.map((p) => p.park)}
            selected={parkFilter}
            onChange={setParkFilter}
            renderOption={(o) => o}
          />

          <div className="cat-search">
            <input
              type="search"
              className="cat-search-input"
              placeholder="Zoek attractie…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="cat-search-clear" onClick={() => setSearch("")} title="Wissen">
                ×
              </button>
            )}
          </div>

          <div className="cat-spacer" />

          {axis === "type" && (
            <span className="cat-stat">
              {statsType.total} attracties
            </span>
          )}
          {axis === "intensity" && (
            <span className="cat-stat">
              {statsInt.total} attracties · <strong>{statsInt.noInt}</strong> zonder intensiteit
            </span>
          )}
          {axis === "height" && (
            <span className="cat-stat">
              {statsInt.total} attracties · <strong>{statsInt.noH}</strong> zonder hoogte
            </span>
          )}
        </div>
      </div>

      {/* Error-toast */}
      {errorMsg && (
        <div className="save-toast error" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Kolom-views */}
      {axis === "type" && (
        <TypeView
          clusters={CATEGORY_CLUSTERS}
          getItems={itemsForType}
          dropTarget={dropTarget}
          makeDragHandlers={makeDragHandlers}
          onDrop={(keys, type) => handleDropType(keys, type)}
          collapsedClusters={collapsedClusters}
          onToggleCluster={toggleCluster}
          renderTiles={renderTiles}
        />
      )}
      {axis === "intensity" && (
        <IntHeightView
          label="Intensiteit"
          field="intensity"
          anchors={INTENSITY_ANCHORS}
          getItems={(n) => itemsForInt(n, "intensity")}
          getUnsorted={() => itemsNoInt("intensity")}
          dropTarget={dropTarget}
          makeDragHandlers={makeDragHandlers}
          onDrop={(keys, n) => handleDropIntensity(keys, n, "intensity")}
          renderTiles={renderTiles}
        />
      )}
      {axis === "height" && (
        <IntHeightView
          label="Hoogte-beleving"
          field="height_intensity"
          anchors={HEIGHT_ANCHORS}
          getItems={(n) => itemsForInt(n, "height_intensity")}
          getUnsorted={() => itemsNoInt("height_intensity")}
          dropTarget={dropTarget}
          makeDragHandlers={makeDragHandlers}
          onDrop={(keys, n) => handleDropIntensity(keys, n, "height_intensity")}
          renderTiles={renderTiles}
        />
      )}
    </div>
  )
}

// ── Type-view ──────────────────────────────────────────────────────────────────

function TypeView({
  clusters,
  getItems,
  dropTarget,
  makeDragHandlers,
  onDrop,
  collapsedClusters,
  onToggleCluster,
  renderTiles,
}: {
  clusters: CategoryCluster[]
  getItems: (t: TypeKey) => RideItem[]
  dropTarget: string | null
  makeDragHandlers: (
    colId: string,
    onDrop: (keys: string[]) => void,
  ) => {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  onDrop: (keys: string[], type: TypeKey) => void
  collapsedClusters: Set<string>
  onToggleCluster: (label: string) => void
  renderTiles: (items: RideItem[]) => React.ReactNode[]
}) {
  return (
    <div className="curate-type-view">
      {clusters.map((cluster) => {
        const clusterKey = cluster.category
        const collapsed = collapsedClusters.has(clusterKey)
        const clusterCount = cluster.types.reduce(
          (sum, t) => sum + getItems(t).length,
          0,
        )
        return (
          <div key={clusterKey} className="curate-cluster">
            <button
              className="curate-cluster-head"
              onClick={() => onToggleCluster(clusterKey)}
              aria-expanded={!collapsed}
            >
              <span className={"curate-cluster-chev" + (collapsed ? "" : " open")}>▸</span>
              <span className="curate-cluster-emo">{CEMO[cluster.category]}</span>
              <span className="curate-cluster-label">{CNL[cluster.category]}</span>
              <span className="curate-cluster-cat">({cluster.category})</span>
              <span className="curate-cluster-meta">
                — {cluster.types.length} types
              </span>
              <span className="curate-cluster-count">{clusterCount}</span>
            </button>
            {!collapsed && (
              <div className="curate-cluster-body">
                {cluster.types.map((t) => {
                  const items = getItems(t)
                  const isOver = dropTarget === "type:" + t
                  return (
                    <div
                      key={t}
                      className={"curate-col" + (isOver ? " drop-over" : "")}
                      {...makeDragHandlers("type:" + t, (keys) => onDrop(keys, t))}
                    >
                      <div className="curate-col-head">
                        <div className="curate-col-title">
                          <span className="curate-col-emo">{TEMO[t]}</span>
                          <span className="curate-col-name">{TNL[t]}</span>
                          <span className="curate-col-count">{items.length}</span>
                        </div>
                      </div>
                      <div className="curate-col-body">
                        {items.length === 0 ? (
                          <div className="cat-col-empty">— leeg —</div>
                        ) : (
                          renderTiles(items)
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Intensity / Height view ────────────────────────────────────────────────────

function IntHeightView({
  field,
  anchors,
  getItems,
  getUnsorted,
  dropTarget,
  makeDragHandlers,
  onDrop,
  renderTiles,
}: {
  label: string
  field: "intensity" | "height_intensity"
  anchors: Array<{ level: number; label: string; [k: string]: unknown }>
  getItems: (n: number) => RideItem[]
  getUnsorted: () => RideItem[]
  dropTarget: string | null
  makeDragHandlers: (
    colId: string,
    onDrop: (keys: string[]) => void,
  ) => {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  onDrop: (keys: string[], n: number) => void
  renderTiles: (items: RideItem[]) => React.ReactNode[]
}) {
  const unsorted = getUnsorted()
  const isOverUnsorted = dropTarget === field + ":unsorted"

  return (
    <div className="curate-int-view">
      {/* Ongesorteerd-zone */}
      {unsorted.length > 0 && (
        <div
          className={"cat-unsorted-zone curate-unsorted" + (isOverUnsorted ? " drop-over" : "")}
          {...makeDragHandlers(field + ":unsorted", () => {
            // Naar unsorted slepen verwijdert de waarde — maar we supporten dat
            // hier niet (geen null-write). Gewoon negeren.
          })}
        >
          <div className="cat-unsorted-head">
            <span className="cat-unsorted-title">Niet ingevuld</span>
            <span className="cat-col-count">{unsorted.length}</span>
            <span className="cat-unsorted-hint">Sleep naar een kolom om te taggen</span>
          </div>
          <div className="cat-unsorted-strip">
            {renderTiles(unsorted)}
          </div>
        </div>
      )}

      {/* 5 kolommen */}
      <div className="curate-int-cols">
        {INT_COLS.map((n) => {
          const items = getItems(n)
          const isOver = dropTarget === field + ":" + n
          const anchor = anchors[n - 1]!
          const color = INT_COLORS[n - 1]!
          return (
            <div
              key={n}
              className={"curate-col curate-int-col" + (isOver ? " drop-over" : "")}
              {...makeDragHandlers(field + ":" + n, (keys) => onDrop(keys, n))}
            >
              <div
                className="curate-col-head curate-int-head"
                style={{ borderTopColor: color }}
              >
                <div className="curate-int-num" style={{ color }}>
                  {n}
                </div>
                <div className="curate-int-lbl">{anchor.label}</div>
                <span className="curate-col-count">{items.length}</span>
              </div>
              <div className="curate-col-body">
                {items.length === 0 ? (
                  <div className="cat-col-empty">— leeg —</div>
                ) : (
                  renderTiles(items)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Ride-detail paneel (klik op tegel) ────────────────────────────────────────

function RideDetail({ park, ride, allParks }: { park: Park; ride: Ride; allParks: Park[] }) {
  // Zoek exacte replica's (zelfde manufacturer+model, andere attractie)
  const replicas = useMemo(() => {
    if (!ride.manufacturer || !ride.model) return []
    const out: Array<{ parkName: string; att: string }> = []
    for (const p of allParks) {
      for (const r of p.rides) {
        if (r.att === ride.att && p.park === park.park) continue
        if (r.manufacturer === ride.manufacturer && r.model === ride.model) {
          out.push({ parkName: p.park, att: r.att })
        }
      }
    }
    return out
  }, [ride, park, allParks])

  return (
    <div className="curate-ride-detail">
      <div className="crd-row">
        <span className="crd-lbl">Type</span>
        <span>{TEMO[ride.type]} {TNL[ride.type]}</span>
      </div>
      <div className="crd-row">
        <span className="crd-lbl">Intensiteit</span>
        <span>{ride.intensity ?? "—"}</span>
      </div>
      <div className="crd-row">
        <span className="crd-lbl">Hoogte</span>
        <span>{ride.height_intensity ?? "—"}</span>
      </div>
      {ride.props && ride.props.length > 0 && (
        <div className="crd-row">
          <span className="crd-lbl">Props</span>
          <span>{ride.props.join(", ")}</span>
        </div>
      )}
      {ride.manufacturer && (
        <div className="crd-row">
          <span className="crd-lbl">Fabrikant</span>
          <span>{ride.manufacturer}{ride.model ? " · " + ride.model : ""}</span>
        </div>
      )}
      {ride.park_url && (
        <div className="crd-row">
          <span className="crd-lbl">Park-URL</span>
          <a href={ride.park_url} target="_blank" rel="noopener noreferrer" className="crd-link">
            {ride.park_url}
          </a>
        </div>
      )}
      {replicas.length > 0 && (
        <div className="crd-replicas">
          <span className="crd-lbl">Replica's</span>
          <ul className="crd-replica-list">
            {replicas.map((r) => (
              <li key={r.parkName + r.att}>
                {r.parkName} — {r.att}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
