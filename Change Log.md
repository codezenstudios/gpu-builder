# Change log

## Phase 1 redesign — October 24, 2026

Opened the workbench with a photo-led intro: four original generated photographs of a three-fan flagship card, its heatsink and heatpipes, a card being seated on a bench, and a top-down PCB. Added a visible sixteen-step build path under the board so every connection is reachable in one click, and re-budgeted the phone page for the new landing. Verification recorded in [[Testing]]. Planned next phases: a separate custom builder with a VRAM target, a complete sellable parts set (fans, mounting, cabling, thermal), and a printable build guide.

## Mobile layout — October 24, 2026

Compacted the phone workbench: a 58 px header, a single-row project bar, tighter dock and panel padding, and a board canvas that stays pinned to the top of the viewport while the lesson and parts library scroll beneath it. Page height at 390 px dropped from 2,872 to 2,676 px. Added `app/tests/layout-mobile.mjs` to hold those budgets, and recorded the measurements in [[Testing]].

## 0.1.0 — October 18, 2026

Planned the interface before implementation. Created the separate GPU Builder Obsidian vault at the user's request and saved the project context for efficient continuation.

Implemented the complete browser-based learning workbench with original PCB artwork, 26 assemblies, 16 guided lessons and quizzes, internal GPU architecture, educational checks, editable layout, project files and responsive UI. Bundled local fonts and licenses. Verified the model, full guided build, file operations, drag interactions and responsive layouts. Fixed undo/redo selection consistency and improved keyboard focus, teaching content, mobile field sizing and text readability during QA.
