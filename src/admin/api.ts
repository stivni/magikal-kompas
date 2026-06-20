/* Admin-API: drie endpoints, typed responses. */

import type { ImageRef, Park, PhotoCandidate, TypeKey } from "../shared/types"
import { parkSlug } from "../shared/helpers"

export async function apiCandidates(
  park: string,
  att: string,
  extra?: string,
  opts?: { refresh?: boolean },
): Promise<PhotoCandidate[]> {
  const qs = new URLSearchParams({ park_slug: parkSlug(park), att })
  if (extra) qs.set("extra", extra)
  if (opts?.refresh) qs.set("refresh", "1")
  const r = await fetch("/api/candidates?" + qs.toString())
  const j = await r.json()
  if (!r.ok || !Array.isArray(j)) throw new Error(j?.error || "HTTP " + r.status)
  return j as PhotoCandidate[]
}

export async function apiSave(park: Park): Promise<void> {
  const r = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ park_slug: parkSlug(park.park), park }),
  })
  const j = await r.json()
  if (!r.ok || !j.ok) throw new Error(j?.error || "HTTP " + r.status)
}

/** Patch één veld op een ride direct naar de park-JSON via /api/save.
 *  Laadt de park-data uit de al-opgehaalde state (doorgegeven als `park`),
 *  muteert de ride in-memory, en stuurt de volledige park-JSON op. */
export async function apiPatchRideType(
  park: Park,
  att: string,
  newType: TypeKey,
): Promise<Park> {
  const next: Park = {
    ...park,
    rides: park.rides.map((r) =>
      r.att === att ? { ...r, type: newType, tag_source: "admin" } : r,
    ),
  }
  const resp = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ park_slug: parkSlug(park.park), park: next }),
  })
  const j = await resp.json()
  if (!resp.ok || !j.ok) throw new Error(j?.error || "HTTP " + resp.status)
  return next
}

export async function apiPatchRideIntensity(
  park: Park,
  att: string,
  field: "intensity" | "height_intensity",
  value: number,
): Promise<Park> {
  const next: Park = {
    ...park,
    rides: park.rides.map((r) =>
      r.att === att ? { ...r, [field]: value, tag_source: "admin" } : r,
    ),
  }
  const resp = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ park_slug: parkSlug(park.park), park: next }),
  })
  const j = await resp.json()
  if (!resp.ok || !j.ok) throw new Error(j?.error || "HTTP " + resp.status)
  return next
}

export async function apiPhoto(
  park: string,
  att: string,
  cand: PhotoCandidate,
  opts?: { focusX?: number; focusY?: number },
): Promise<ImageRef> {
  const r = await fetch("/api/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      park_slug: parkSlug(park),
      att,
      image_url: cand.full_url,
      license: cand.license || "",
      attribution: cand.attribution || "",
      source_page: cand.source_page || "",
      focus_x: opts?.focusX,
      focus_y: opts?.focusY,
    }),
  })
  const j = await r.json()
  if (!r.ok || !j.ok) throw new Error(j?.error || "foto-conversie mislukt")
  return j.image as ImageRef
}
