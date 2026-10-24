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

## Custom builder parts list — October 24, 2026

`tests/custom-guide.test.mjs` (four tests) builds the custom document in Node: a 512 GB / 32 GB plan yields sixteen packages, two banks, a 512-bit interface and 1024 GB/s at the teaching model's 16 Gb/s per pin; a 96 GB / 16 GB plan yields a partial six-package bank with its 192-bit slice and 96 GB share; fully placed banks are marked while empty ones stay “To place”; and a custom name containing markup is escaped.

`tests/custom-guide-browser.mjs` (seventeen assertions, CDP on 9228): the 512 GB / 32 GB configuration is placed, “Parts list & guide” opens the guide view with its own `#custom-guide` hash, the toolbar reads “Your memory plan, on paper” under a “PARTS LIST” eyebrow, the cover carries the custom build name, the plan lists both banks, the parts table covers the GPU plus both banks, references run to M9–M16, the capacity maths line reads `512 × 16 ÷ 8 = 1024 GB/s`, the document fits 390 px without overflow, `Page.printToPDF` produces a three-page 156 KB PDF (`QA/gpu-builder-custom-guide.pdf`), the print title is “<custom name> — parts list”, Back returns to the custom builder rather than the workbench, and `#build-guide` still renders the 22-step teaching guide. `npm test` runs 24 tests, all passing.

Captures: `QA/custom-guide-preview.png`, `QA/custom-guide-phone.png` and `QA/custom-builder.png`.

## Phase 4 printable build guide — October 24, 2026

`tests/guide.test.mjs` (four tests) builds the document in Node: all 22 steps and 47 references are present, sourcing classes sum to 23 hardware · 17 distributor · 2 fabrication · 5 integrated, a project name containing markup is escaped, installed references are marked, every step repeats its check question and correct answer, and each part kind carries sourcing advice.

`tests/guide-browser.mjs` (seventeen assertions, CDP on 9228): the guide opens from the landing button, the footer and `#build-guide`; it renders 22 steps and 47 sourcing rows with the project name on the cover; the preview has no horizontal overflow at 390 px; print emulation hides the header, workbench and toolbar while keeping the document; `Page.printToPDF` produces an 11-page, 393 KB A4 PDF, saved as `QA/gpu-builder-build-guide.pdf`; the document title becomes “<project> — build guide” for the print dialog and is restored afterwards; Back and hash navigation return to the workbench; printing from the workbench with the guide closed still prints the whole guide. `npm test` runs 20 tests, all passing.

Verification found one real defect: the guide's `.guide-step` class collided with the lesson progress rail, so the rail was renamed `.guide-progress` (and `home.mjs` now checks its 22 segments). The phone table rules were also scoped to `screen`, because A4 print width falls inside the phone breakpoint and had been stacking the printed table into twelve pages.

Captures: `QA/guide-preview.png`, `QA/guide-phone.png` and `QA/gpu-builder-build-guide.pdf`.

## Phase 3 full parts — October 24, 2026

Model coverage (`tests/model.test.mjs`, eight tests, 16 with the custom suite): 22 lessons and 47 assemblies in build order — standoffs, thermal pads, paste, heatsink, three fans, backplate, bracket and cable; new thermal and cooling checks; quantities from the catalog (decoupling bank 8, everything else 1) in the BOM CSV; a saved v1 project upgrading instead of throwing, keeping the 24 placements whose prerequisites still hold and dropping the old heatsink and fan.

Browser coverage: `browser-checks.mjs` completes all 22 lessons through the UI at 1440 px (47 assemblies, seven passing checks, 47 BOM rows), then still passes the recorded sweep at 320–1440 px with no exceptions or failed resources. `home.mjs` finds 22 path steps, opens “Mount the standoffs” from step 15 and the final power-cable lesson from the last step. `browser-files.mjs` exports, imports, resets, drags and drag-drops against the 47-part build.

Phone: page height with the empty board is now 3,520 px against a re-budgeted 3,800 px (was 3,300). The extra 245 px is six more lesson cards in the stacked phone library, not spacing; header 58 px, project bar 83 px, no horizontal overflow, touch targets 44 px, and the board still pins at the top of the viewport while the guide scrolls.

Captures: `QA/phase3-complete.png`, `QA/phase3-phone.png` (thermal-pad lesson with the pinned board) and `QA/phase3-stack.png` (zoomed thermal interface and fans).

## Phase 2 custom builder — October 24, 2026

Model coverage (`tests/custom.test.mjs`, eight tests): chip counts across every supported target including 512 GB at 8 GB (64 packages) and 32 GB (16 packages), rejection of unsupported capacities, module sizes and uneven divisions, banks of eight with stable `M1…Mn` designators, bank and single-package placement, refusal of duplicate or out-of-range packages, target reductions dropping orphaned packages, and import validation.

Browser coverage (`tests/custom-browser.mjs`, ten assertions, CDP on 9228): the custom builder opens as an area separate from the teaching workbench; the default 24 GB target renders three 8 GB packages in one bank; switching to 512 GB with 32 GB packages renders sixteen chips in two banks and reports a 512-bit interface; placing one bank adds eight chips; filling the banks reaches 512 of 512 GB; the build survives a reload through `gpu-builder.custom.v1`; a single package can be placed by hand; no horizontal overflow at 390 px; and Back returns to the lessons. `npm test` now runs 14 model tests, all passing, alongside the home, layout and full browser sweep suites.

Captures: `QA/phase2-custom-phone.png` and `QA/phase2-custom-desktop.png`.

## Phase 1 redesign — October 24, 2026

`app/tests/home.mjs` opens the landing at 390 × 844 and 1440 × 900: the intro renders above the workbench, four original GPU photographs load from `/assets/gpu/`, the gallery is two-up on a phone and four-up on desktop, and it adds no horizontal overflow at either width. The build path renders every lesson, marks exactly one `aria-current="step"`, and clicking step 9 opens “Build the local memory interface”. (The count is now 22; see Phase 3.)

With the landing in place the empty-board phone page measures 3,275 px (budget 3,300, previously 2,676 before the gallery), header 58 px, project bar 83 px, smallest touch target 44 px. `browser-checks.mjs` still passes the full recorded sweep at 320–1440 px with no browser exceptions or failed resources, and the six model tests pass.

## Mobile compaction — October 24, 2026

`app/tests/layout-mobile.mjs` pins the phone layout budgets at 390 × 844 with the empty board mounted, on the CDP session at port 9228:

```bash
node tests/layout-mobile.mjs
```

Measured after the change: header 58 px (budget ≤ 60), project bar 83 px (≤ 84), full page 2,676 px (≤ 2,700, down from 2,872), no horizontal overflow, smallest tracked touch target 44 px. After scrolling 900 px the board canvas sits at 0 px from the top of the viewport, so the guide and parts list scroll beneath a pinned board. The recorded `browser-checks.mjs` sweep still passes at 320, 360, 390, 430, 768, 820, 1024, 1280 and 1440 px with no browser exceptions or failed resources. Captures: `QA/phone-compact.png` and `QA/phone-board-pinned.png`.

## Limits

PDF output depends on the browser print dialog; page breaks are held per step, but a different print engine may paginate differently. Sourcing notes are guidance, not a procurement list, and no prices, availability or vendor part numbers are claimed. Chromium viewport emulation is not physical-device or native Safari verification. No electrical, thermal or manufacturing correctness is asserted by the learning checks. There is no server-side project storage; use exported JSON for backups or transferring devices. The SQLite/contact/investor behavior of the unrelated Code Zen Studios site is outside this project.
