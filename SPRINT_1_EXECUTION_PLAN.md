# Sprint 1 Execution Plan — Project Velocity

## Minimal Blueprint (v0)

### System Overview
Static, single-page retro-futuristic web experience. Primary entrypoint: `index.html`, with modular ES modules in `assets/js/` and styles in `assets/css/app.css`. Configuration is defined in `config/app-config.json` and built into `assets/js/runtime-config.js` during `npm run build`.

### Runtime & Delivery
- Runtime: Static hosting (Vercel-ready) with SPA rewrite.
- CI/CD: Not specified; assumed static deploy via Vercel or equivalent.
- Observability: Not specified; likely client-side console + any analytics (none found).
- Constraints: Static front-end with no server; avoid inline scripts to keep CSP expectations.

### Core Risks & Constraints (STRIDE-lite)
- **S**poofing: Low (static site).
- **T**ampering: Medium (config integrity; build process).
- **R**epudiation: Low (no server).
- **I**nformation disclosure: Low (static assets).
- **D**enial of service: Low (static; CDN mitigations).
- **E**levation of privilege: Low (no backend).

---

## Sprint 1 Execution Plan

### Objective
Deliver a measurable baseline for performance, accessibility, and maintainability of the static site while preserving the retro-futuristic aesthetic and CSP constraints, enabling future iterations with confidence.

### Scope
- Establish baseline documentation for performance/accessibility.
- Add lightweight QA checklist and release/rollback guidance for static deploys.
- Identify highest-risk areas in build/config pipeline and document mitigations.

### Delivery Items (max 5)

1) **Baseline Quality Playbook**
   - **DoD:** Add a short checklist for manual QA (visual regression, nav, links, responsiveness), plus an accessibility quick-pass checklist.
   - **Try/Test:** Run manual verification on desktop + mobile widths; capture issues list if any.

2) **Performance & Asset Hygiene Notes**
   - **DoD:** Document target Lighthouse thresholds (hypotheses) and best practices: image compression, module splitting, cache headers.
   - **Try/Test:** Run Lighthouse locally (if available) and record metrics; otherwise document steps.

3) **Config & Build Integrity Guardrails**
   - **DoD:** Document that any config change requires `npm run build` to regenerate `assets/js/runtime-config.js`.
   - **Try/Test:** Dry-run build and confirm runtime-config diff (if any).

4) **Release & Rollback Runbook**
   - **DoD:** Provide a simple release flow for static hosting + rollback plan (pin previous deploy).
   - **Try/Test:** Simulate a release by documenting steps, no infra required.

### Release Strategy + Rollback
Release via static deploy (Vercel or equivalent). Use progressive delivery when available (preview deploy, then promote). Rollback by reverting to prior deploy hash/artifact; ensure old runtime-config is restored.

### Risks + Mitigations
- **Risk:** Unclear observability.  
  **Mitigation:** Document optional lightweight analytics and client error logging for future sprints.
- **Risk:** Config drift between `config/app-config.json` and `assets/js/runtime-config.js`.  
  **Mitigation:** Explicit build steps in runbook and CI check in future sprint.
- **Risk:** Visual regressions due to retro aesthetic.  
  **Mitigation:** Add manual QA checklist + optional snapshot testing in later sprint.

### Required Inputs (Blocking)
- None for Sprint 1; follow-up requests:
  - Confirm CI/CD pipeline (GitHub Actions? Vercel?).
  - Confirm desired performance targets (Lighthouse thresholds).

---

## Decision Log
- Prioritized documentation and guardrails over code changes to minimize regression risk on a static site and align with safety/compliance first.
- Chose manual QA checklist to preserve visual aesthetic while deferring automated visual regression tooling to a later sprint.
- Assumed static hosting release flow due to repo configuration and Vercel-ready setup; future adjustments pending CI/CD confirmation.
- Defer observability implementation to avoid adding tracking without stakeholder approval (ethics/compliance).
