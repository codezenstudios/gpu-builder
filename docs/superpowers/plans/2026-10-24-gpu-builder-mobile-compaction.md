# GPU Builder Mobile Compaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the GPU Builder phone layout so the board stays in view while parts are placed and the page scrolls less than it does today.

**Architecture:** Two CSS-only changes inside the existing `max-width:700px` media query, verified by a new CDP-driven layout test that reuses `tests/browser.mjs`. First the mobile chrome (header, project bar, guide and dock padding) shrinks to reclaim vertical space; then the board canvas becomes a sticky element on phones by flattening `.center-panel` with `display:contents`, so the canvas can stick across the guide and parts library that follow it.

**Tech Stack:** Native browser modules, plain CSS, Node 24+ (`node:test` for model tests, a CDP harness on port 9228 for browser assertions). No dependencies, no build step.

**Spec:** `Design Plan.md` (editorial engineering workbench, mobile-first guided flow; app source in `app/`)

## Global Constraints

- No new runtime or dev dependencies; the app stays dependency-free and served by `app/server.mjs`.
- Teaching copy is preserved verbatim on mobile; this plan changes layout only.
- Interactive controls keep a minimum 44 px touch target on touch devices (asserted today by the existing browser checklist).
- No horizontal overflow at 320, 390 and 430 CSS px; document width must equal viewport width.
- Colour tokens, type families and board artwork are unchanged.

## Review Focus

- Keyboard and screen-reader users tabbing into the parts library while the sticky canvas covers the focus ring.
- The section `aria-label="Design workbench"` disappearing when `.center-panel` becomes `display:contents`.
- `position:sticky` inside a container that still has `overflow:hidden`, which silently disables it.
- Drag/pan on the board while it is stuck to the top of the viewport.
- 320 px width, where two-column part cards and the mode select are tightest.

---

### Task 1: Compact mobile chrome and hold the scroll budget

**Files:**
- Create: `app/tests/layout-mobile.mjs`
- Modify: `app/styles/app.css:9` (the `@media(max-width:700px)` block)

**Interfaces:**
- Consumes: `connect()`, `navigate()`, `evaluate()`, `send()` and `wait()` from `app/tests/browser.mjs`; the running preview on `http://localhost:4180` and a CDP Chromium on port 9228.
- Produces: `app/tests/layout-mobile.mjs`, runnable with `node tests/layout-mobile.mjs` from `app/`, exiting non-zero on any failed assertion; later tasks add assertions to the same file.

- [ ] **Step 1: Write the failing test**

`app/tests/layout-mobile.mjs`:

```js
import {connect, wait} from './browser.mjs';
const b = await connect();
const {send, evaluate, navigate} = b;
let failed = 0;
const assert = (ok, label, detail = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) failed += 1;
};
await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
await navigate();
await evaluate('localStorage.clear()');
await navigate();
const metrics = JSON.parse(await evaluate(`JSON.stringify((() => {
  const box = (sel) => document.querySelector(sel).getBoundingClientRect();
  const targets = [...document.querySelectorAll('.segmented button, .toggle-label, .dock-tabs button, #mode-select, .part-card')];
  return {
    header: Math.round(box('.app-header').height),
    projectBar: Math.round(box('.project-bar').height),
    docHeight: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    minTarget: Math.round(Math.min(...targets.map((el) => el.getBoundingClientRect().height))),
    consoleErrors: 0
  };
})())`));
assert(metrics.header <= 60, 'Phone header is 60px or shorter', metrics.header + 'px');
assert(metrics.projectBar <= 84, 'Phone project bar is 84px or shorter', metrics.projectBar + 'px');
assert(metrics.docHeight <= 2700, 'Empty-board page fits in 2700px of scroll', metrics.docHeight + 'px');
assert(metrics.overflowX === 0, 'No horizontal overflow at 390px', metrics.overflowX + 'px');
assert(metrics.minTarget >= 44, 'Touch targets stay at least 44px', metrics.minTarget + 'px');
b.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/layout-mobile.mjs` from `app/`
Expected: FAIL lines for header (74px), project bar (121px) and page scroll (2872px); the overflow and touch-target lines PASS.

- [ ] **Step 3: Implement the compact chrome**

In the `@media(max-width:700px)` block of `app/styles/app.css`:

- `.app-header`: height 74px → 58px; brand font 21px → 18px; brand symbol 32px → 27px; hide `.brand small`; `#export-button` min-height 38px → 34px.
- `.project-bar`: padding `20px 16px 19px` → `10px 14px 11px`; min-height 116px → 76px; keep the name row full width but reduce `.project-name-label input` to 18px with min-height 30px; `.project-progress` margin-top 0.
- `.guide-panel`: padding `23px 22px` → `18px 16px`; `.guide-panel h2` margin 14px 0 → 10px 0 and font 29px → 26px.
- `.overview`: padding `21px 16px` → `14px 14px`; `.project-dock` min-height 210px → 176px.
- `.library-panel`: padding 22px → `16px 16px 0`; `.search-box` margin-top 16px → 12px.
- `.canvas-toolbar`: height 58px → 48px.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/layout-mobile.mjs`
Expected: five PASS lines, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add "app/styles/app.css" "app/tests/layout-mobile.mjs"
git commit -m "Compact the phone header, project bar and panels"
```

---

### Task 2: Keep the board in view while the guide scrolls

**Files:**
- Modify: `app/styles/app.css:9` (the `@media(max-width:700px)` block)
- Test: `app/tests/layout-mobile.mjs`

**Interfaces:**
- Consumes: the test file from Task 1 and the `.canvas-frame` element inside `.center-panel`.
- Produces: a sticky `.canvas-frame` on phones; the test asserts its viewport top stays within `0..24px` after scrolling past the dock.

- [ ] **Step 1: Write the failing test**

Append before `b.close()`:

```js
await evaluate(`window.scrollTo(0, 900)`);
await wait(120);
const stuck = JSON.parse(await evaluate(`JSON.stringify((() => {
  const r = document.querySelector('.canvas-frame').getBoundingClientRect();
  return {top: Math.round(r.top), scrollY: Math.round(window.scrollY)};
})())`));
assert(stuck.scrollY > 600 && stuck.top >= 0 && stuck.top <= 24, 'Board stays pinned while the guide scrolls', `top ${stuck.top}px at ${stuck.scrollY}px`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/layout-mobile.mjs`
Expected: FAIL "Board stays pinned while the guide scrolls — top -127px at 900px" (or similar negative top).

- [ ] **Step 3: Implement the sticky board**

Also in the `@media(max-width:700px)` block:

- `.workbench`: add `overflow:visible` (a hidden ancestor disables sticky) and keep the 8 px radius on the panel children that touch the edge.
- `.center-panel`: `display:contents`, so its children join the workbench column and the canvas can stick across the guide and library.
- `.canvas-frame`: `position:sticky; top:0; z-index:5; border-radius:8px; box-shadow:0 8px 20px #0b181233;` and give it `margin-bottom:2px`.
- Keep `.board-canvas` height 290px (the board is content, not chrome).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/layout-mobile.mjs`
Expected: six PASS lines, exit code 0.

- [ ] **Step 5: Run the model tests**

Run: `npm test`
Expected: 6 passing model tests.

- [ ] **Step 6: Commit**

```bash
git add "app/styles/app.css" "app/tests/layout-mobile.mjs"
git commit -m "Pin the board while the phone guide scrolls"
```

---

### Task 3: Regression pass across the recorded widths

**Files:**
- Modify: `Testing.md`, `Change Log.md`
- Test: `app/tests/browser-checks.mjs`, `app/tests/layout-mobile.mjs`

**Interfaces:**
- Consumes: the app served on 4180 and the CDP browser on 9228.
- Produces: recorded results for 320/360/390/430/768/820/1024/1280/1440 in `Testing.md` and updated captures in `QA/`.

- [ ] **Step 1: Run the recorded browser checklist**

Run: `node tests/browser-checks.mjs`
Expected: every recorded assertion prints PASS through the responsive sweep, ending with the existing layout summary.

- [ ] **Step 2: Run the mobile budget test once more**

Run: `node tests/layout-mobile.mjs`
Expected: all assertions PASS.

- [ ] **Step 3: Capture the new phone state**

Run: `node -e "import('./tests/browser.mjs').then(async ({connect,wait})=>{const b=await connect();await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.navigate();await wait(150);await b.screenshot('phone-compact.png');await b.evaluate('window.scrollTo(0,700)');await wait(150);await b.screenshot('phone-board-pinned.png');b.close();})"`
Expected: `QA/phone-compact.png` and `QA/phone-board-pinned.png` written.

- [ ] **Step 4: Record the result**

Add a dated line to `Testing.md` stating the phone header, project bar and page scroll budgets with their measured values, and note that the board stays pinned while the guide scrolls. Add one line to `Change Log.md`.

- [ ] **Step 5: Commit**

```bash
git add "Testing.md" "Change Log.md" "QA/phone-compact.png" "QA/phone-board-pinned.png"
git commit -m "Record the compact phone verification"
```
