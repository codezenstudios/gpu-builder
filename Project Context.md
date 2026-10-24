# GPU Builder — working context

## User objective

Build a working web app to design a graphics card part by part in a graphical interface, starting with the board. A guide teaches each component's purpose and includes visible identifiers. Plan the interface before coding. Target the explanations to an electronics student. Save all relevant project context in a new Obsidian vault named **GPU Builder**.

## Decisions already made

- This vault is `/home/earth/Work/GPU Builder` and the source lives in `app/`.
- The written [[Design Plan]] was completed before implementation.
- This is a graphics-card PCB assembly teaching tool with a separate GPU internal-architecture view; the user starts from the board. It does not claim to produce a fabrication-ready GPU ASIC.
- Editorial engineering workbench: white frame, dark green SVG PCB, copper/gold details, orange selection, parts at left, board in center, guide at right, BOM/checks below.
- Guided placement and exploration mode; visible reference designators; drag and accessible click-to-place; inspect, move, rotate, remove; zoom/fit; power/data overlays.
- Guided lessons and quizzes, BOM/CSV, versioned JSON import/export, local persistence, undo/redo, and reset confirmation.
- Native browser modules, no runtime dependencies, portable static deployment. Local preview planned at http://localhost:4180. Keep this independent of the previously deployed Code Zen Studios website.
- Source research links and assumptions are recorded in [[Design Plan]].

## Current status — prototype complete, October 18, 2026

Working local prototype: **http://localhost:4180**. Run `npm start` from `app/` if the preview is stopped. The preview is bound to this machine; it is not a public URL. Port 4173 was already occupied, so the final preview uses 4180. No GPU Builder deployment has been made, and the Code Zen Studios production site was not modified.

Implemented 26 placeable assemblies across 16 guided lessons, with individually placed power stages, inductors, memory and bulk capacitors. One bank represents eight decouplers and is explicitly identified C3–C10. Reference designators are consistent across the guide, SVG board and BOM. Quiz distractors target electronics-student misconceptions rather than casual trivia.

The board begins empty. The guided sequence places PCB1 first, then host/power interfaces, regulator blocks, GPU and support components, ending with cutaway cooling. Guided mode snaps to suggested footprints; Explore permits constrained package drag, rotation, keyboard-accessible nudge buttons and background panning. Zoom/fit, labels, power/data relationship overlays and the separate GPU functional-block inspector work.

Project state, names and lesson answers persist in localStorage under `gpu-builder.project.v1`. JSON import/export, BOM CSV, undo/redo and reset with confirmation are implemented. Removal cascades to dependent components and clears affected answers. All import content is validated and displayed as text. Storage failures show a message directing the user to export. The read-only `window.gpuBuilderProject` snapshot supports local debugging.

Verified six model tests and 80 recorded browser assertions, including the complete build, 16 quizzes, both views, overlays, component editing, dependency blocking, reset recovery, persistence, actual JSON/CSV downloads, import rejection/restoration and pointer/library drag. Responsive checks passed at 320, 360, 390, 430, 768, 820, 1024, 1280 and 1440 CSS-pixel widths. No browser exceptions or failed resource loads. Full details in [[Testing]]; raw JSON/screenshots in `QA/`.

Known limits: this is a generic graphics-card learning model, not an EDA tool or ASIC design environment. GPU internal blocks are inspectable, not transistor-level editable. Geometry, memory ratings and four-phase organization are illustrative. There is no pin mapping, netlist, impedance/routing, power/thermal simulation or fabrication output. Chromium emulation was tested; physical Safari and device testing remain. Undo/redo history is session-local; exported JSON preserves the current project rather than edit history.

No external production dependencies or remote font requests. Fonts and their licenses are bundled. Static hosting is possible; the tiny Node server is for local preview. Portable vault archive: `/home/earth/Work/gpu-builder-vault.zip`.

## Source map

- `app/index.html`: static application frame, dialogs and accessible controls.
- `app/styles/app.css`: responsive workbench design and SVG component styles.
- `app/src/catalog.js`: reference sources, 26 component definitions, 16 lesson/quiz groups and suggested positions.
- `app/src/model.js`: pure model operations, collision/boundary checks, cascading removal, import validation, memory calculations and CSV.
- `app/src/render.js`: original SVG board and architecture artwork, icons and HTML escaping.
- `app/src/app.js`: UI state, persistence/history, interactions, file operations, focus handling and rendering.
- `app/server.mjs`: local static server on 127.0.0.1:4180.
- `app/tests/model.test.mjs`: meaningful model tests.
- `app/tests/browser.mjs`, `browser-checks.mjs`, `browser-files.mjs`: browser QA using an isolated Chromium debugging session on port 9228.
- [[Design Plan]], [[Research]], [[Testing]], [[Start Here]]: durable project documentation.

## Next iteration

The user can now test the prototype and request refinements. Preserve browser-local projects and avoid unnecessary schema changes. Keep the live Code Zen Studios site separate. If public hosting is requested, clarify the intended hostname/account before configuring a new deployment.

## Continuing efficiently

Read this note first, then the relevant source files and [[Design Plan]] only as needed. Keep actual implementation state and known issues current here. Record decisions and verification results, not repeated conversational transcripts. Never put account credentials or API tokens in the vault.
