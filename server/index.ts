/* Magikal Kompas — admin-backend in Node + Express + sharp.
 * Drie endpoints uit ADR-019:
 *   GET  /api/candidates?park_slug=&att=&extra=
 *   POST /api/save
 *   POST /api/photo
 * Bind op localhost:8001. Geen auth, lokaal-only. */

import express from "express"
import sharp from "sharp"
import { promises as fs } from "node:fs"
import { existsSync } from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")
const UA = "Magikal-Kompas-Admin/1.0 (local; stijn@vannieuwenhuyse.net)"
const CACHE_DIR = path.join(ROOT, ".cache", "commons")

const app = express()
app.use(express.json({ limit: "2mb" }))

// ---- helpers ----

interface ApiError {
  ok: false
  error: string
}

function sendError(res: express.Response, status: number, msg: string) {
  console.error(`[admin-server] ERROR ${status}: ${msg}`)
  const body: ApiError = { ok: false, error: msg }
  res.status(status).json(body)
}

function slugify(s: string): string {
  // Same rules as the old PHP slugify (lowercase, & → "en", NFD-strip, runs → "-")
  let t = s.toLowerCase()
  t = t.replace(/&/g, " en ").replace(/\+/g, " en ")
  t = t.normalize("NFD").replace(/[̀-ͯ]/g, "")
  t = t.replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-")
  return t.replace(/^-|-$/g, "")
}

async function parkNameFromSlug(slug: string): Promise<string | null> {
  const file = path.join(ROOT, "data", "parks", slug + ".json")
  if (!existsSync(file)) return null
  try {
    const raw = await fs.readFile(file, "utf8")
    const d = JSON.parse(raw)
    return typeof d?.park === "string" ? d.park : null
  } catch {
    return null
  }
}

// ---- /api/candidates ----

interface Candidate {
  thumb_url: string
  full_url: string
  source_page: string
  title: string
  attribution: string
  license: string
  width: number
  height: number
}

function candCachePath(park_slug: string, att: string, extra: string): string {
  // Stabiele bestandsnaam: park-slug + att-slug + korte hash van extra-zoekterm.
  const attSlug = slugify(att) || "att"
  const extraHash = extra ? createHash("sha1").update(extra).digest("hex").slice(0, 8) : "noextra"
  return path.join(CACHE_DIR, `${park_slug}__${attSlug}__${extraHash}.json`)
}

app.get("/api/candidates", async (req, res) => {
  const park_slug = String(req.query.park_slug || "")
  const att = String(req.query.att || "").trim()
  const extra = String(req.query.extra || "").trim()
  const refresh = String(req.query.refresh || "") === "1"
  if (!park_slug || !att) return sendError(res, 400, "park_slug en att zijn vereist")

  // Probeer eerst de disk-cache. Commons-foto's veranderen zelden; we cachen
  // onbeperkt — de "vernieuwen"-knop in admin stuurt refresh=1 om te omzeilen.
  const cacheFile = candCachePath(park_slug, att, extra)
  if (!refresh && existsSync(cacheFile)) {
    try {
      const raw = await fs.readFile(cacheFile, "utf8")
      const cached = JSON.parse(raw) as { candidates: Candidate[] }
      if (Array.isArray(cached?.candidates)) {
        return res.json(cached.candidates)
      }
    } catch {
      // val terug op live-fetch
    }
  }

  const park_name = (await parkNameFromSlug(park_slug)) || park_slug
  let q = `"${att}" ${park_name}`
  if (extra) q += " " + extra

  const api = "https://commons.wikimedia.org/w/api.php"
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: q,
    gsrnamespace: "6",
    gsrlimit: "50",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata|mime",
    iiurlwidth: "330",
    iiextmetadatafilter: "License|LicenseShortName|Artist|ImageDescription|Credit",
  })
  const url = api + "?" + qs.toString()

  let resp: Response
  try {
    resp = await fetch(url, { headers: { "User-Agent": UA } })
  } catch (e: unknown) {
    return sendError(res, 502, "Commons-zoekopdracht mislukt: " + (e as Error).message)
  }
  if (!resp.ok) return sendError(res, 502, "Commons gaf HTTP " + resp.status)
  const j: any = await resp.json()
  const pages = (j?.query?.pages || {}) as Record<string, any>

  const bad = ["construction", "bouw", "queue", "wachtrij", "entrance", "ingang", "sign", "map", "plattegrond", "logo"]
  const out: Candidate[] = []
  for (const p of Object.values(pages)) {
    const title = String(p?.title || "")
    if (!title) continue
    const titleLc = title.toLowerCase()
    if (bad.some((w) => titleLc.includes(w))) continue

    const ii = p?.imageinfo?.[0]
    if (!ii) continue
    const mime = String(ii?.mime || "")
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) continue
    const w = Number(ii?.width || 0)
    if (w < 600) continue

    const meta = ii?.extmetadata || {}
    let licShortRaw = String(meta?.LicenseShortName?.value || "").toUpperCase()
    licShortRaw = licShortRaw.replace(/\s+/g, "")
    const isCC0 =
      licShortRaw.includes("CC0") ||
      licShortRaw.includes("PUBLICDOMAIN") ||
      String(meta?.License?.value || "")
        .toUpperCase()
        .includes("PD")
    const isCC = /^CC-?BY(-?SA)?-?\d?/.test(licShortRaw)
    if (!isCC0 && !isCC) continue

    let license = licShortRaw
    if (isCC0) {
      license = "CC0"
    } else {
      const m = licShortRaw.match(/^CC[\s-]*BY([\s-]*SA)?[\s-]*(\d)(?:[.\s-]*(\d))?$/i)
      if (m) {
        license = "CC-BY" + (m[1] ? "-SA" : "") + "-" + m[2] + "." + (m[3] ? m[3] : "0")
      }
    }

    let artist = stripTags(String(meta?.Artist?.value || "")).replace(/\s+/g, " ").trim()
    if (!artist) artist = stripTags(String(meta?.Credit?.value || ""))
    const attribution = artist ? `Foto door ${artist}, via Wikimedia Commons` : "Via Wikimedia Commons"

    out.push({
      thumb_url: String(ii?.thumburl || ii?.url || ""),
      full_url: String(ii?.url || ""),
      source_page: String(ii?.descriptionurl || ""),
      title: title.replace(/^File:/, ""),
      attribution,
      license,
      width: w,
      height: Number(ii?.height || 0),
    })
    if (out.length >= 25) break
  }

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cacheFile, JSON.stringify({ candidates: out }, null, 2), "utf8")
  } catch (e) {
    console.error("[admin-server] cache-write faalde:", (e as Error).message)
  }

  res.json(out)
})

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "")
}

// ---- /api/save ----

app.post("/api/save", async (req, res) => {
  const slug = String(req.body?.park_slug || "")
  const park = req.body?.park
  if (!slug || !park || typeof park !== "object")
    return sendError(res, 400, "park_slug en park zijn vereist")
  if (!/^[a-z0-9-]+$/.test(slug)) return sendError(res, 400, "Ongeldige park_slug")

  if (!park.meta || typeof park.meta !== "object") park.meta = {}
  park.meta.updated = new Date().toISOString().slice(0, 10)

  const dir = path.join(ROOT, "data", "parks")
  try {
    await fs.access(dir)
  } catch {
    return sendError(res, 500, "data/parks ontbreekt")
  }
  const file = path.join(dir, slug + ".json")
  const json = JSON.stringify(park, null, 2)
  try {
    await fs.writeFile(file, json + "\n", "utf8")
  } catch (e: unknown) {
    return sendError(res, 500, `Schrijven naar ${file} mislukt: ${(e as Error).message}`)
  }
  console.log(`[admin-server] saved ${file} (${json.length} bytes)`)
  res.json({ ok: true })
})

// ---- /api/photo ----

app.post("/api/photo", async (req, res) => {
  const park_slug = String(req.body?.park_slug || "")
  const att = String(req.body?.att || "").trim()
  const image_url = String(req.body?.image_url || "")
  const license = String(req.body?.license || "")
  const attribution = String(req.body?.attribution || "")
  const source_page = String(req.body?.source_page || "")
  const focus_x = typeof req.body?.focus_x === "number" ? req.body.focus_x : null
  const focus_y = typeof req.body?.focus_y === "number" ? req.body.focus_y : null

  if (!park_slug || !att || !image_url)
    return sendError(res, 400, "park_slug, att en image_url zijn vereist")
  if (!/^[a-z0-9-]+$/.test(park_slug)) return sendError(res, 400, "Ongeldige park_slug")
  if (!/^https?:\/\//i.test(image_url)) return sendError(res, 400, "image_url moet http(s) zijn")

  const att_slug = slugify(att)
  if (!att_slug) return sendError(res, 400, "att leverde lege slug")

  const destDir = path.join(ROOT, "assets", "photos", park_slug)
  try {
    await fs.mkdir(destDir, { recursive: true })
  } catch (e: unknown) {
    return sendError(res, 500, `Kon ${destDir} niet aanmaken: ${(e as Error).message}`)
  }
  const destFile = path.join(destDir, att_slug + ".webp")

  let buf: Buffer
  try {
    const r = await fetch(image_url, { headers: { "User-Agent": UA } })
    if (!r.ok) return sendError(res, 502, "Download gaf HTTP " + r.status)
    const ab = await r.arrayBuffer()
    buf = Buffer.from(ab)
  } catch (e: unknown) {
    return sendError(res, 502, "Download faalde: " + (e as Error).message)
  }

  try {
    const pipeline = sharp(buf)
    if (focus_x != null && focus_y != null) {
      // Crop op 4:3 rond het opgegeven focuspunt (0–1 normalized) en
      // resize naar 800×600. Clamp het crop-vak binnen de bron-afmetingen.
      const meta = await sharp(buf).metadata()
      const sw = meta.width || 0
      const sh = meta.height || 0
      if (sw > 0 && sh > 0) {
        const targetW = 800
        const targetH = 600
        const srcAR = sw / sh
        const tgtAR = 4 / 3
        let cropW: number
        let cropH: number
        if (srcAR > tgtAR) {
          cropH = sh
          cropW = Math.round(sh * tgtAR)
        } else {
          cropW = sw
          cropH = Math.round(sw / tgtAR)
        }
        let cropX = Math.round(focus_x * sw - cropW / 2)
        let cropY = Math.round(focus_y * sh - cropH / 2)
        cropX = Math.max(0, Math.min(sw - cropW, cropX))
        cropY = Math.max(0, Math.min(sh - cropH, cropY))
        pipeline
          .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
          .resize(targetW, targetH)
      } else {
        pipeline.resize({ width: 800, withoutEnlargement: true })
      }
    } else {
      pipeline.resize({ width: 800, withoutEnlargement: true })
    }
    await pipeline.webp({ quality: 80 }).toFile(destFile)
  } catch (e: unknown) {
    return sendError(res, 500, "Convert naar WebP mislukt: " + (e as Error).message)
  }

  const stat = await fs.stat(destFile)
  console.log(`[admin-server] foto opgeslagen: ${destFile} (${stat.size} bytes)`)
  res.json({
    ok: true,
    image: {
      url: `assets/photos/${park_slug}/${att_slug}.webp`,
      license,
      attribution,
      source_page,
    },
  })
})

// ---- /api/admin-preview ----

app.get("/api/admin-preview", async (req, res) => {
  const raw = String(req.query.u || "").trim()
  if (!raw) return sendError(res, 400, "u is verplicht")

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return sendError(res, 400, "Ongeldige URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return sendError(res, 400, "Alleen http/https toegestaan")
  }

  const origin = url.origin
  let resp: Response
  try {
    resp = await fetch(raw, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": UA,
        "Referer": origin + "/",
        "Accept": "image/*,*/*;q=0.8",
      },
    })
  } catch (e: unknown) {
    const msg = (e as Error).name === "TimeoutError" ? "upstream timeout" : (e as Error).message
    return sendError(res, 504, msg)
  }

  if (!resp.ok) return sendError(res, resp.status, `upstream ${resp.status}`)

  const ct = resp.headers.get("content-type") || "image/jpeg"
  if (!/^image\//i.test(ct)) {
    return sendError(res, 502, `upstream content-type ${ct}, geen image`)
  }
  res.setHeader("Content-Type", ct)
  res.setHeader("Cache-Control", "public, max-age=86400")
  const buf = Buffer.from(await resp.arrayBuffer())
  res.end(buf)
})

const PORT = 8001
app.listen(PORT, "127.0.0.1", () => {
  console.log(`[admin-server] luistert op http://localhost:${PORT}`)
})
