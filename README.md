# GPU Builder

An educational, browser-based GPU assembly project. It teaches what the parts of a graphics card do by having you build one step by step, then lets you plan a custom card and export a printable build guide.

## What's in here

| Path | Contents |
| --- | --- |
| `app/` | The application: static HTML/CSS/JS, no build step, no dependencies |
| `app/src/` | Catalog and lesson data, placement model, renderer, custom memory-bank builder, both printable guides |
| `app/tests/` | Model and guide unit tests, plus browser suites driven over CDP |
| `Research/` | A sourced research brief on building a real graphics card (`Building-a-GPU-research-brief.pdf`, 11 pages) and its HTML source |
| `QA/` | Screenshots and PDFs captured during verification |
| `Start Here.md` | Orientation and run instructions |
| `Design Plan.md` | Interaction and teaching scope |
| `Testing.md` | What each phase was verified against |
| `Change Log.md` | What changed, phase by phase |
| `Research.md` | Engineering references attached to the lessons |

## Run it

Node.js 24 or newer:

```bash
cd app
npm start
```

Open <http://localhost:4180>. The app can also be served by any static web server.

Progress is stored in the browser's local storage; export a project to JSON to move it between browsers. There is no account, backend or network dependency.

## Tests

```bash
cd app
npm test        # model, catalog and guide checks
npm run check   # syntax check of every source module
```

The browser suites (`tests/*-browser.mjs`, `tests/layout-mobile.mjs`, `tests/home.mjs`, `tests/browser*.mjs`) drive a Chromium instance over the DevTools protocol on port 9228; they are run separately from `npm test`.

## Two areas, deliberately separate

- **Teaching workbench** — 47 parts across 22 ordered lessons, with prerequisites, placement checks and a knowledge check per step. It is a generic illustrative board, not a validated design.
- **Custom builder** — choose a target capacity (24–512 GB) and a package size, and the builder computes package count, banks, bus width and theoretical bandwidth, then lets you place memory banks one at a time. It exports its own parts list and placement plan.

Both areas print to PDF through the browser's print dialog: the teaching guide is a 22-step document with a sourcing list, and the custom guide is a bank-by-bank plan.

## Scope and honesty

The component descriptions and the board artwork are teaching material. Nothing here is a manufacturable design, a validated electrical model or a purchasable bill of materials: the GPU package and GDDR memory in particular have no retail channel, which the build guide states explicitly and the research brief explains in detail.

## Licence

No licence file is included yet, so all rights are reserved by default. Add one before redistributing.
