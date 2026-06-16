/* Entry voor de admin-pagina (admin.html). */

import React from "react"
import { createRoot } from "react-dom/client"
import "../styles.css"
import { AdminApp } from "./admin/AdminApp"

const el = document.getElementById("root")
if (!el) throw new Error("#root ontbreekt")
createRoot(el).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
)
