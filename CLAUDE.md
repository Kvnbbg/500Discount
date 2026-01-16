# Project Context — Tokyo TCG Hub & Star Bazaar

This repository ships a static, single-page retro-futuristic web experience that lives entirely in the browser. The core entrypoint is `index.html`, backed by modular ES modules in `assets/js/` and a generated runtime config file in `assets/js/runtime-config.js`.

## Quick Orientation

- **Primary entrypoint:** `index.html`
- **Optional 3D demo:** `carCustomization.html`
- **Runtime configuration:** `config/app-config.json` → generated to `assets/js/runtime-config.js`
- **Styles:** `assets/css/app.css`

## Critical Commands

```bash
npm install
npm run build   # regenerates assets/js/runtime-config.js
npm run lint
npm run test
```

## Agentic Workflow Notes

- Maintain project context updates in this file to avoid re-discovery overhead.
- Use the **Escape key** (Esc) to interrupt or refine long-running agent actions in interactive environments.
- For parallel exploration, spawn **sub-agents** to independently analyze UI, performance, or security tasks before merging conclusions.

## Deployment (Vercel-ready)

- The site is static and can be deployed directly from the repository root.
- `vercel.json` provides a SPA-friendly rewrite to `index.html`.
- Set the **Root Directory** to the repo root when deploying.

## Guardrails

- The UI is intentionally retro and dense; keep visual changes consistent with the neon arcade aesthetic.
- Keep CSP expectations intact (avoid inline scripts).
- Changes that modify config defaults should be followed by `npm run build` to refresh `assets/js/runtime-config.js`.
