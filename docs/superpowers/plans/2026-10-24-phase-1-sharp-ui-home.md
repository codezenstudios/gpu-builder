# GPU Builder Redesign — Phase 1: Sharp UI and GPU Imagery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the workbench a sharper, mobile-first face: a photo-led opening that shows real high-end graphics hardware, and a visible path through every build step.

**Architecture:** The app stays one static page with native modules. A new `<section class="bench-intro">` above the project bar carries the headline, two calls to action and a four-photo gallery; a new `<nav class="build-path">` below the canvas lists all sixteen lessons as jump links. `app.js` renders the path from the existing `groups` catalog and routes a click through the existing `chooseGroup()`; no model or persistence changes.

**Tech Stack:** HTML, plain CSS. Node 24+ tests: `node:test` for the model, the CDP harness (`tests/browser.mjs`, port 9228) for layout and interaction.

**Spec:** `Design Plan.md` and `Project Context.md`. Later phases: Phase 2 separate custom builder with VRAM targeting, Phase 3 expanded parts (fans, mounting, cabling, thermal), Phase 4 print-to-PDF build guide.

## Global Constraints

- Zero runtime dependencies; no build step; `npm start` on port 4180 still serves the app.
- The teaching model, project schema, localStorage key and JSON format are unchanged in this phase.
- Mobile budgets from the previous phase still hold: header ≤ 60 px, no horizontal overflow at 320–430 px, touch targets ≥ 44 px, page height ≤ 2,760 px with the gallery added.
- Images are original generated photographs stored under `app/assets/gpu/`, served from `/assets/gpu/`; no third-party or trademarked imagery.
- Copy stays in the bench's voice: precise, technical, never marketing hype.

## Review Focus

- Gallery images loading late and shoving layout (declare width/height, reserve aspect ratio).
- The gallery pushing the search/board out of the first screen on a phone.
- The build path duplicating the guide's previous/next controls or breaking lesson state.
- Keyboard users tabbing through sixteen path links with no current-step indication.
- Reduced-motion preferences on any new transitions.

---

### Task 1: Photo-led intro and gallery

**Files:**
- Modify: `app/index.html` (insert `bench-intro` before `<section class="project-bar">`)
- Modify: `app/styles/app.css` (new block before the `@media` rules)
- Create: `app/assets/gpu/hero-card.webp`, `cooler-macro.webp`, `install.webp`, `board-macro.webp` (generated)
- Test: `app/tests/home.mjs`

**Interfaces:**
- Consumes: the static server and CDP harness; `window.gpuBuilderProject` for readiness.
- Produces: `.bench-intro`, `.bench-gallery`, `.bench-gallery img` and `#start-build` / `#custom-build-teaser` anchors; later tasks and phases rely on `.bench-gallery` staying four images.

- [ ] **Step 1: Write the failing test**

`app/tests/home.mjs`:

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
const phone = JSON.parse(await evaluate(`JSON.stringify((() => {
  const imgs = [...document.querySelectorAll('.bench-gallery img')];
  const first = imgs[0]?.getBoundingClientRect();
  return {
    intro: !!document.querySelector('.bench-intro'),
    images: imgs.length,
    loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    firstWidth: Math.round(first?.width || 0),
    twoUp: imgs.length > 1 && Math.abs(imgs[0].getBoundingClientRect().top - imgs[1].getBoundingClientRect().top) < 2,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    heroTop: Math.round(document.querySelector('.bench-intro')?.getBoundingClientRect().top ?? -1),
    boardTop: Math.round(document.querySelector('.canvas-frame').getBoundingClientRect().top + scrollY)
  };
})())`));
assert(phone.intro, 'Intro section renders above the workbench');
assert(phone.images === 4, 'Gallery renders four photographs', phone.images + ' images');
assert(phone.loaded === 4, 'All four photographs load', phone.loaded + ' loaded');
assert(phone.twoUp, 'Phone gallery is a two-column grid', 'first width ' + phone.firstWidth + 'px');
assert(phone.overflowX === 0, 'Gallery adds no horizontal overflow', phone.overflowX + 'px');
await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false});
await wait(150);
const desktop = JSON.parse(await evaluate(`JSON.stringify((() => {
  const imgs = [...document.querySelectorAll('.bench-gallery img')];
  return {fourUp: imgs.length === 4 && imgs.every((i) => Math.abs(i.getBoundingClientRect().top - imgs[0].getBoundingClientRect().top) < 2), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth};
})())`));
assert(desktop.fourUp, 'Desktop gallery is a four-up row');
assert(desktop.overflowX === 0, 'Gallery adds no horizontal overflow at 1440px', desktop.overflowX + 'px');
b.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tests/home.mjs`
Expected: FAIL on intro, image count and load.

- [ ] **Step 3: Add the images and the intro markup**

Convert the four generated PNGs to WebP at 1600 px wide (quality 82) into `app/assets/gpu/`. Insert in `index.html` before the project bar:

```html
<section class="bench-intro" aria-labelledby="bench-title">
  <div class="bench-copy">
    <p class="eyebrow">THE HARDWARE LEARNING WORKBENCH</p>
    <h1 id="bench-title">Build a graphics card.<br><span>Understand every part.</span></h1>
    <p class="bench-lede">Follow sixteen guided connections from the PCB to the cooler. Every package, reference designator and quiz is tied to the board in front of you.</p>
    <div class="bench-actions"><a class="button button-orange" id="start-build" href="#workspace">Start the guided build</a><a class="button" id="custom-build-teaser" href="#workspace">See what is inside a GPU</a></div>
  </div>
  <div class="bench-gallery">
    <figure><img src="./assets/gpu/hero-card.webp" width="1600" height="1067" alt="A three-fan flagship graphics card installed in an open PC case"><figcaption>Flagship card · three-fan cooler</figcaption></figure>
    <figure><img src="./assets/gpu/cooler-macro.webp" width="1600" height="1067" alt="Macro photograph of a heatsink, copper heatpipes and backplate" loading="lazy"><figcaption>Heatpipes into the fin stack</figcaption></figure>
    <figure><img src="./assets/gpu/install.webp" width="1600" height="1067" alt="Hands seating a graphics card into a motherboard PCIe slot" loading="lazy"><figcaption>Seating the PCIe edge</figcaption></figure>
    <figure><img src="./assets/gpu/board-macro.webp" width="1600" height="1067" alt="Top-down macro of a graphics card PCB with GPU and memory packages" loading="lazy"><figcaption>GPU, memory and power stages</figcaption></figure>
  </div>
</section>
```

- [ ] **Step 4: Style it sharp on phones first**

New CSS block: `.bench-intro` a two-column grid at ≥1100 px (copy 1fr, gallery 1.15fr) and a single column below; `.bench-gallery` a 2×2 grid with 10 px gaps and 8 px radii; `figure` margin 0; `img` `width:100%;aspect-ratio:3/2;object-fit:cover;display:block`; captions 9 px mono, muted; `h1` `clamp(34px,7vw,64px)`, `letter-spacing:-.045em`, second line in `var(--green)`; hide the gallery's fourth figure below 380 px if two-up still overflows, never by removing it from the DOM. Keep the intro background `#f6f7f3` and a 1 px bottom border.

- [ ] **Step 5: Run the test green**

Run: `node tests/home.mjs` → six PASS lines.

- [ ] **Step 6: Commit**

```bash
git add app/index.html app/styles/app.css app/assets/gpu app/tests/home.mjs
git commit -m "Lead the workbench with GPU photography"
```

---

### Task 2: A visible path through every build step

**Files:**
- Modify: `app/index.html` (add `<nav class="build-path" id="build-path">` after the canvas frame)
- Modify: `app/src/app.js` (`renderPath()` inside `render()`)
- Modify: `app/styles/app.css`
- Test: `app/tests/home.mjs`

**Interfaces:**
- Consumes: `groups` from `catalog.js`, `installed(project, id)` from `model.js`, `chooseGroup(index)` in `app.js`.
- Produces: `#build-path` with `[data-step]` buttons; `renderPath()` called from `render()`; the current lesson carries `aria-current="step"`.

- [ ] **Step 1: Write the failing test**

Append before `b.close()` in `app/tests/home.mjs`:

```js
const path = JSON.parse(await evaluate(`JSON.stringify((() => {
  const steps = [...document.querySelectorAll('#build-path [data-step]')];
  return {count: steps.length, current: document.querySelectorAll('#build-path [aria-current="step"]').length, labels: steps.slice(0, 3).map((s) => s.textContent.trim().slice(0, 30))};
})())`));
assert(path.count === 16, 'Build path lists all sixteen steps', path.count + ' steps');
assert(path.current === 1, 'Exactly one step is marked current', path.current + ' current');
await evaluate(`document.querySelectorAll('#build-path [data-step]')[8].click()`);
await wait(150);
const jumped = JSON.parse(await evaluate(`JSON.stringify({current: document.querySelector('#build-path [aria-current="step"]').textContent.trim().slice(0, 30), guide: document.querySelector('#guide-content h2').textContent.trim()})`));
assert(jumped.guide === 'Build the local memory interface.', 'Clicking a step opens that lesson', jumped.guide);
```

- [ ] **Step 2: Run it and watch it fail**

Expected: FAIL "Build path lists all sixteen steps — 0 steps".

- [ ] **Step 3: Implement the path**

In `index.html`, after `</div>` of `.canvas-frame`, add `<nav class="build-path" id="build-path" aria-label="Build path"></nav>`.

In `app.js`, add before `render()`:

```js
function renderPath(){
  const counts=groups.map(g=>g.parts.filter(p=>installed(project,p.id)).length);
  $('#build-path').innerHTML=groups.map((g,i)=>`<button data-step="${i}" class="path-step ${i===lessonIndex?'active':''} ${counts[i]===g.parts.length?'done':''}" ${i===lessonIndex?'aria-current="step"':''}><span class="path-index">${String(i+1).padStart(2,'0')}</span><span class="path-label">${esc(g.short)}</span><span class="path-state">${counts[i]===g.parts.length?'✓':counts[i]+'/'+g.parts.length}</span></button>`).join('');
}
```

Call `renderPath();` inside `render()` next to `renderLibrary()`, and wire clicks once:

```js
$('#build-path').addEventListener('click',event=>{const step=event.target.closest('[data-step]');if(step)chooseGroup(Number(step.dataset.step));});
```

Style `.build-path` as a horizontally scrollable rail (four columns at ≥1100 px, two at ≥640 px, one below, or `grid-auto-flow:column` with snap) with 44 px minimum height, mono index, muted labels, orange underline for the active step, green check for complete.

- [ ] **Step 4: Run tests green**

Run: `node tests/home.mjs` (9 PASS) and `node tests/layout-mobile.mjs` (9 PASS).

- [ ] **Step 5: Commit**

```bash
git add app/index.html app/src/app.js app/styles/app.css app/tests/home.mjs
git commit -m "Show every build step as a jump path"
```

---

### Task 3: Sharpening pass and regression

**Files:**
- Modify: `app/styles/app.css`
- Modify: `Testing.md`, `Change Log.md`
- Test: `app/tests/home.mjs`, `app/tests/layout-mobile.mjs`, `app/tests/browser-checks.mjs`

**Interfaces:**
- Consumes: everything above.
- Produces: final Phase 1 screenshots in `QA/` and a recorded verification line.

- [ ] **Step 1: Apply the sharpening pass**

Tighten radii from 8 px to 6 px on panels and cards, use 1 px hairlines (`#dfe5d8`), 10 px numerals in the mono face for indices, reduce ornamental shadows to `0 1px 0` rules, and add `prefers-reduced-motion` guards on any new transitions. No colour-token changes.

- [ ] **Step 2: Run the three suites**

Run: `node tests/home.mjs && node tests/layout-mobile.mjs && node tests/browser-checks.mjs`
Expected: all PASS, full sweep green at nine widths.

- [ ] **Step 3: Capture the new states**

Run the capture helper at 390 and 1440 to write `QA/phase1-phone.png`, `QA/phase1-desktop.png`.

- [ ] **Step 4: Record**

Add a "Phase 1 redesign" line to `Testing.md` and a dated entry to `Change Log.md`.

- [ ] **Step 5: Commit**

```bash
git add app/styles/app.css Testing.md "Change Log.md" QA
git commit -m "Record the Phase 1 redesign verification"
```
