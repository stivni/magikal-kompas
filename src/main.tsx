/* Entry voor de hoofdapp (index.html). */

import React from "react"
import { createRoot } from "react-dom/client"
import "../styles.css"
import { App } from "./app/App"

const el = document.getElementById("root")
if (!el) throw new Error("#root ontbreekt")
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
