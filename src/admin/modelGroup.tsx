/* Helper voor "exacte kopieën"-clustering: rides met dezelfde
 * manufacturer+model worden visueel gegroepeerd zodat je ze in één keer
 * kan tagen. Gebruikt door CategorizeView. */

import type { Ride } from "../shared/types"
import { DRAG_MIME, RideTile } from "./RideTile"

export interface RideItem {
  park: string
  ride: Ride
  key: string
}

/** Stabiele key voor exacte-model-match. Null als ride geen manufacturer+model
 *  heeft (dan wordt het nooit gegroepeerd). */
function modelKey(r: Ride): string | null {
  if (!r.manufacturer || !r.model) return null
  return r.manufacturer + " | " + r.model
}

/** Splits items in groepen van ≥2 (gedeeld manufacturer+model) en losse items.
 *  Behoudt de oorspronkelijke volgorde — eerste voorkomen bepaalt de positie
 *  van de groep. */
export function groupRidesByModel(items: RideItem[]): Array<
  | { kind: "single"; item: RideItem }
  | { kind: "group"; modelKey: string; manufacturer: string; model: string; items: RideItem[] }
> {
  const groups = new Map<string, RideItem[]>()
  const order: string[] = []
  for (const it of items) {
    const k = modelKey(it.ride)
    if (k == null) {
      order.push(it.key + "::single")
      groups.set(it.key + "::single", [it])
    } else {
      const tag = "g::" + k
      if (!groups.has(tag)) {
        order.push(tag)
        groups.set(tag, [])
      }
      groups.get(tag)!.push(it)
    }
  }
  return order.map((tag) => {
    const arr = groups.get(tag)!
    if (tag.endsWith("::single") || arr.length === 1) {
      return { kind: "single" as const, item: arr[0]! }
    }
    return {
      kind: "group" as const,
      modelKey: tag.slice(3),
      manufacturer: arr[0]!.ride.manufacturer!,
      model: arr[0]!.ride.model!,
      items: arr,
    }
  })
}

/** Render-helper: gegeven items en de "groepeer-aan"-flag, geeft een lijst
 *  React-elementen terug om in een kolom/strip te stoppen. */
export function renderItemsGrouped(items: RideItem[], grouped: boolean): React.ReactNode[] {
  if (!grouped) {
    return items.map(({ park, ride, key }) => (
      <RideTile key={key} park={park} ride={ride} dragKey={key} />
    ))
  }
  return groupRidesByModel(items).map((entry) => {
    if (entry.kind === "single") {
      const { park, ride, key } = entry.item
      return <RideTile key={key} park={park} ride={ride} dragKey={key} />
    }
    return <ModelGroup key={entry.modelKey} entry={entry} />
  })
}

function ModelGroup({
  entry,
}: {
  entry: {
    kind: "group"
    modelKey: string
    manufacturer: string
    model: string
    items: RideItem[]
  }
}) {
  return (
    <div
      className="cat-group"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData(DRAG_MIME, entry.items.map((i) => i.key).join("\n"))
      }}
      title={`${entry.items.length}× ${entry.manufacturer} · ${entry.model} — sleep de hele groep`}
    >
      <div className="cat-group-head">
        <span className="cat-group-count">{entry.items.length}×</span>
        <span className="cat-group-lbl">
          <strong>{entry.manufacturer}</strong> · {entry.model}
        </span>
      </div>
      <div className="cat-group-body">
        {entry.items.map(({ park, ride, key }) => (
          <RideTile key={key} park={park} ride={ride} dragKey={key} />
        ))}
      </div>
    </div>
  )
}
