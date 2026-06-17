import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { promises as fs } from "node:fs"
import { existsSync } from "node:fs"

/* Vite-plugin: kopieer statische directories die we als string-paden
 * referencen (uit park-JSON's en CSS) naar `dist/` na build. */
async function copyRecursive(src: string, dst: string) {
  const stat = await fs.stat(src)
  if (stat.isDirectory()) {
    await fs.mkdir(dst, { recursive: true })
    for (const e of await fs.readdir(src)) {
      await copyRecursive(path.join(src, e), path.join(dst, e))
    }
  } else {
    await fs.copyFile(src, dst)
  }
}

function staticAssetsPlugin(): Plugin {
  return {
    name: "magikal-static-assets",
    apply: "build",
    async closeBundle() {
      const root = __dirname
      const outDir = path.join(root, "dist")
      const targets: Array<[string, string]> = [
        [path.join(root, "assets"), path.join(outDir, "assets")],
        [path.join(root, "styles.css"), path.join(outDir, "styles.css")],
        [path.join(root, "docs"), path.join(outDir, "docs")],
      ]
      for (const [src, dst] of targets) {
        if (!existsSync(src)) continue
        await copyRecursive(src, dst)
      }
    },
  }
}

// Vite-config voor Magikal Kompas (zie ADR-020).
// - Twee entry-points: index.html (hoofdapp) en admin.html (admin).
// - Dev-server proxiet /api/* naar de Express-admin-backend op :8001.
// - publicDir: 'public' is uit; we serveren /data en /assets vanaf repo-root,
//   en in build worden alleen geïmporteerde bestanden meegebundeld.
//   data/parks/*.json komen via import.meta.glob; assets via expliciete
//   referenties in JSON's en CSS.
export default defineConfig(({ command }) => ({
  // GitHub Pages serveert onder /magikal-kompas/. In dev (vite serve) blijft /.
  base: command === "build" ? "/magikal-kompas/" : "/",
  plugins: [react(), staticAssetsPlugin()],
  // Geen publicDir nodig — we hebben geen losse "static drop"-map.
  // /data en /assets blijven via fs.allow.
  publicDir: false,
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: false,
      },
    },
    fs: {
      // Sta alles in de project-root toe (data/, assets/).
      allow: [path.resolve(__dirname)],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        admin: path.resolve(__dirname, "admin/index.html"),
      },
    },
    assetsInlineLimit: 0,
  },
  // Zorg dat assets in /assets en /data correct gekopieerd worden via expliciete
  // imports of fetch-relatieve verwijzingen in de JSON's (image.url). Voor dev
  // serveert Vite ze rechtstreeks.
}))
