# GPU Builder — prototype verification

Verified October 18, 2026. Local static app at http://localhost:4180, tested with an isolated Chromium profile. No production cloud application was deployed or modified.

## Automated model checks

`npm run check` passes JavaScript syntax checks. `npm test` passes all six model tests:

1. The complete guided sequence has 26 unique reference identifiers and passes the six educational checks; four memory packages yield the expected modeled capacity/interface/bandwidth.
2. Component prerequisites and duplicate placement are enforced.
3. Removing prerequisites cascades through dependent assemblies and clears affected quiz answers.
4. Exploration rejects overlaps and out-of-bounds movement without corrupting prior state.
5. Import rejects unsupported versions, malformed structures, unknown/duplicate parts, invalid coordinates and inconsistent answers/dependencies.
6. JSON round-trip preserves a project, and CSV identifies the grouped eight-capacitor bank accurately.

## Browser checks

`QA/browser-checks.json` records 68 successful assertions; `QA/browser-files.json` records another 12. Both report no browser exceptions or failed resources. Coverage includes:

- Empty initial board, dependency blocking, all 26 component placements, all 16 correct knowledge checks and assembly completeness.
- BOM references and all six learning checks, power/data overlays, and selectable internal GPU architecture blocks.
- Explore mode, button-based component movement, rotation, undo/redo, removal and consistent selection.
- Reload persistence, help, reset confirmation/cancellation, confirmed reset and undo recovery.
- Actual project JSON and BOM CSV downloads, validation of the exported JSON, invalid import rejection and successful import with undo.
- Reference-identifier search, actual pointer movement of a placed package, and library DragEvent/DataTransfer drop placement.
- Layouts at 320×568, 360×640, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800 and 1440×1100. No horizontal page overflow or broken resources.

Screenshots are stored in `QA/`: empty/completed desktop builds, internal architecture, phone, tablet and final workbench. Core model tests were rerun after the final catalog edits. The final CSS sizing and component positions passed the layout/workflow suite. File/drag flows were rerun after keyboard-focus improvements. Test data lives only in the separate QA browser profile; the user's browser starts its own project.

## Reproduce browser QA

Run `npm start` from `app/`. Launch an isolated Chromium instance with remote debugging port 9228, then run:

```bash
node tests/browser-checks.mjs
node tests/browser-files.mjs
```

Use an isolated browser profile: the workflow suite clears that profile's GPU Builder localStorage. The scripts target localhost:4180 and never write to an external website.

## Limits

Chromium viewport emulation is not physical-device or native Safari verification. No electrical, thermal or manufacturing correctness is asserted by the learning checks. There is no server-side project storage; use exported JSON for backups or transferring devices. The SQLite/contact/investor behavior of the unrelated Code Zen Studios site is outside this project.
