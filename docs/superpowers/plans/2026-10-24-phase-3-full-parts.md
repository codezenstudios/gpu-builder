# Phase 3 — Complete Parts Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 26-part teaching board into a 47-part, 22-lesson build that a person could actually source and assemble: standoffs, thermal pads, paste, three fans, backplate and spring screws, PCIe bracket and power cable.

**Architecture:** The existing catalog is a flat list of parts plus a parallel lesson list; the guide, board renderer, BOM and checks all derive from it. Phase 3 inserts the mechanical and thermal lessons in real build order (after the fan header, before the heatsink), renumbers the cooler lessons, and adds seven SVG part shapes. Saved v1 projects are upgraded in the model rather than rejected.

**Tech Stack:** Vanilla ES modules, hand-written SVG, Node's built-in test runner, Chrome DevTools Protocol for browser checks. No dependencies.

**Spec:** This plan implements the Phase 3 section of [the Phase 1 redesign plan](2026-10-24-phase-1-sharp-ui-home.md) and the user's request for fans, mounting hardware, thermal interface, cabling and a fully buildable card.

## Global Constraints

- No new runtime dependencies; everything stays plain ES modules served from `app/`.
- Every part has a unique reference designator, a category, a lesson and an explicit `requires` list.
- Lesson order is build order: mechanical and thermal interface steps come **before** the heatsink, the fans after it, then backplate, bracket and cable.
- All copy stays in the existing bench voice: factual, no vendor claims, explicit about what the model does not prove.
- Existing lesson indices 0–13 must not change, so saved projects keep their answers where the parts are unchanged.
- Phones: no horizontal overflow at 320–1440 px; touch targets stay ≥44 px.

## Review Focus

- A saved v1 project that already contains a heatsink and fan must load, not throw — the upgrade path drops parts whose new prerequisites are unmet instead of refusing the file.
- Placing a part with a rotated footprint must not change the boundary rules; new overlay parts (pads, paste, backplate, cable) must not report collisions with the components they cover.
- The BOM must report real quantities (the decoupling bank is eight parts, everything else one) and label optional hardware honestly.
- The guide must not hard-code "16" anywhere: the step rail, the lesson counter, the quiz denominator and the next-button guard all read the group count.
- A fan or pad must not swallow pointer events meant for the package underneath it.

---

### Task 1: Model groundwork — quantities, overlay rules, lesson count, v1 upgrade

**Files:**
- Modify: `app/src/catalog.js` (part factory gains `qty`)
- Modify: `app/src/model.js`
- Test: `app/tests/model.test.mjs`

**Interfaces:**
- Produces: `qty` on every part definition (number, default 1); `VERSION = 2`; `validateProject` accepts `version: 1` and returns a v2 project; `currentLesson(project)` returns the last group index; `checks(project)` returns seven rows including `Thermal interface`.
- Consumes: `parts`, `byId`, `groups` from the catalog.

- [ ] **Step 1: Write the failing tests**

In `tests/model.test.mjs`:
```js
test('quantities and thermal checks reflect the full assembly', () => {
  const project = full();
  assert.equal(project.placements.length, parts.length);
  assert.equal(checks(project).length, 7);
  assert.ok(checks(project).every((check) => check.ok));
  assert.equal(bomCsv(project).split('\r\n').length, parts.length + 1);
  assert.ok(bomCsv(project).includes('"C3–C10","Decoupling capacitor bank","Support","8","Placed"'));
});
test('a saved v1 project upgrades instead of failing to load', () => {
  const legacyParts = ['PCB1','J1','J2','U6','U8','U9','U10','U11','L1','L2','L3','L4','C1','C2','U1','U2','U3','U4','U5','U7','Y1','C3–C10','J3','J4','HS1','FAN1'];
  const legacy = {version: 1, name: 'Old build', mode: 'guided', answers: {0: 0, 14: 0}, placements: legacyParts.map((id) => ({id, ...positionOf(id)}))};
  const upgraded = validateProject(legacy);
  assert.equal(upgraded.version, 2);
  assert.ok(upgraded.placements.length >= 24);
  assert.equal(upgraded.placements.some((p) => p.id === 'HS1'), false);
  assert.equal(upgraded.answers[0], 0);
});
```
(`positionOf` reads the catalog defaults; add it as a four-line helper at the top of the test file.)

- [ ] **Step 2: Run the test file and see it fail**

Run: `cd app && node --test --test-isolation=none tests/model.test.mjs`
Expected: FAIL — 26 ≠ 47 and `checks(project).length` is 6.

- [ ] **Step 3: Implement in `catalog.js` and `model.js`**

`catalog.js` factory becomes `(id,name,kind,category,x,y,w,h,lesson,requires,description,qty=1)`. `C3–C10` passes `8` as `qty`. `model.js`:
- `VERSION = 2`, `bomCsv` uses `p.qty`.
- `const overlayKinds = ['pcb','backplate','heatsink','fan','pad','paste','cable','standoff','screw','bracket']`; the collision loop skips those, and the boundary rule treats `power`, `backplate`, `bracket`, `cable`, `standoff`, `screw` as edge parts.
- `currentLesson` returns `groups.length - 1` when everything is placed.
- `checks` adds `{label:'Thermal interface', ok:['TP1','TP2','TP3','TP4','TP5','TIM1'].every((id)=>installed(project,id)), ...}` and the cooling row requires `FAN1`–`FAN3`.
- `upgradeLegacy(input)` maps v1 answer keys `14→17`, `15→18`, keeps placements whose prerequisites are met, drops the rest, and returns a v2 object; `validateProject` calls it first.

- [ ] **Step 4: Run the test file**

Run: `cd app && node --test --test-isolation=none tests/model.test.mjs`
Expected: PASS (the count assertions change again in Task 2 once the parts exist; keep `parts.length` as the source of truth).

- [ ] **Step 5: Commit**

```bash
git add app/src/catalog.js app/src/model.js app/tests/model.test.mjs
git commit -m "Give the model quantities, overlay placement rules and a v1 upgrade path"
```

---

### Task 2: The parts and lessons

**Files:**
- Modify: `app/src/catalog.js`
- Test: `app/tests/model.test.mjs`

**Interfaces:**
- Consumes: part factory with `qty`.
- Produces: 21 new parts — `H1`–`H4` standoffs, `TP1`–`TP5` pads, `TIM1` paste, `FAN2`/`FAN3`, `BP1` backplate, `H5`–`H8` spring screws, `BR1` bracket, `H9`/`H10` bracket screws, `CB1` cable — and lessons 14–21 (total 22 groups, 47 parts).

- [ ] **Step 1: Write the failing test**

Add to `tests/model.test.mjs`:
```js
test('the mechanical and thermal lessons exist in build order', () => {
  assert.equal(groups.length, 22);
  assert.equal(parts.length, 47);
  assert.deepEqual(groups.slice(14, 22).map((g) => g.short), ['Standoffs','Thermal pads','Thermal paste','Heatsink','Cooling fans','Backplate','PCIe bracket','Power cable']);
  const project = full();
  assert.deepEqual(memoryStats(project), {count: 4, capacity: 8, bits: 128, bandwidth: 256});
  assert.equal(checks(project).find((c) => c.label === 'Cooling stack').ok, true);
});
```

- [ ] **Step 2: Run it to confirm failure**

Run: `cd app && node --test --test-isolation=none tests/model.test.mjs`
Expected: FAIL — 16 groups.

- [ ] **Step 3: Add the parts and lessons**

Append the parts in lesson order with these exact positions (board units):

| Part | Kind | Lesson | x, y | w×h | Requires |
| --- | --- | --- | --- | --- | --- |
| H1–H4 | standoff | 14 | (74,113) (927,113) (74,426) (927,426) | 18×18 | PCB1 |
| TP1–TP4 | pad | 15 | (326,174) (566,174) (326,355) (566,355) | 66×43 | U2, U3, U4, U5 |
| TP5 | pad | 15 | (777,266) | 44×190 | U8 |
| TIM1 | paste | 16 | (446,270) | 92×92 | U1, TP1–TP5 |
| FAN1–FAN3 | fan | 18 | (310,270) (446,270) (582,270) | 96×96 | HS1, J4 |
| BP1 | backplate | 19 | (500,270) | 900×360 | HS1, H1 |
| H5–H8 | screw | 19 | (392,205) (500,205) (392,335) (500,335) | 14×14 | BP1 |
| BR1 | bracket | 20 | (62,270) | 22×300 | J3 |
| H9, H10 | screw | 20 | (74,152) (74,388) | 12×12 | BR1 |
| CB1 | cable | 21 | (880,140) | 120×56 | J2 |

Move `HS1` to lesson 17 (requires `U1, TIM1, J4`) and `FAN1` to lesson 18, then insert lessons 14–21 in this order: Standoffs (Assembly, `⌗`), Thermal pads (Cooling, `▤`), Thermal paste (Cooling, `◍`), Heatsink (Cooling, `≋`), Cooling fans (Cooling, `✳`), Backplate (Assembly, `▧`), PCIe bracket (Interfaces, `▯`), Power cable (Power, `⌁`). Add `'Assembly'` to `categories`. Copy: each new lesson gets intro/function/placement/detail, a three-answer quiz and a source — pads/paste/heatsink/backplate → TI thermal interfaces (index 8); fans → Noctua PWM (6); bracket → PCIe overview (0); cable → TI power (1).

- [ ] **Step 4: Run the tests**

Run: `cd app && node --test --test-isolation=none tests/*.test.mjs`
Expected: PASS, including the v1 upgrade test which now drops `HS1`/`FAN1` for missing prerequisites.

- [ ] **Step 5: Commit**

```bash
git add app/src/catalog.js app/tests/model.test.mjs
git commit -m "Add the mechanical, thermal and cabling lessons to the build"
```

---

### Task 3: Board rendering for the new parts

**Files:**
- Modify: `app/src/render.js`, `app/styles/app.css`
- Test: `app/tests/browser-checks.mjs` (later task), manual DOM check

**Interfaces:**
- Consumes: `def.kind` values `standoff`, `pad`, `paste`, `backplate`, `screw`, `bracket`, `cable`, and `fan` with variable `w`.
- Produces: `componentShape(def)` handles every kind; `boardSvg` renders `backplate` behind the PCB, pads/paste under the cooler, screws/bracket/cable above, and fans ranked last.

- [ ] **Step 1: Draw the shapes**

Parametric fan (`w/166` scale around the existing blade paths, `FAN` label from `def.id`), hex standoff, translucent pad with `id` label, hatched paste layer inside a dashed die outline, wider backplate panel, slotted screw, L-shaped bracket with port cut-outs and a chassis tab, and a curved cable with plug ends.

- [ ] **Step 2: Order the layers**

In `boardSvg`, split `placed` into `behind` (backplate), `stack` (everything else) and sort with a rank: pad/paste 1, components 2, heatsink 3, fan 4, screw/bracket/cable 5. Render `behind` before `substrate()`.

- [ ] **Step 3: Pointer behaviour**

`app.css`: `.part-pad,.part-paste,.part-backplate,.part-cable{pointer-events:none}` plus styles for `.standoff-*`, `.thermal-pad`, `.paste-layer`, `.backplate-panel`, `.screw-*`, `.bracket-*`, `.cable-*`. Standoff and screw hit areas keep their `part-hit` rect but must not cover the GPU die.

- [ ] **Step 4: Check it in the browser**

Run the app, place everything via `tests/browser-checks.mjs`, and inspect `QA/desktop-complete.png` for overlapping art or missing labels.

- [ ] **Step 5: Commit**

```bash
git add app/src/render.js app/styles/app.css
git commit -m "Draw the mechanical, thermal and cabling parts on the bench"
```

---

### Task 4: Dynamic lesson counts in the app shell

**Files:**
- Modify: `app/src/app.js`, `app/index.html`
- Test: `app/tests/home.mjs`, `app/tests/layout-mobile.mjs`, `app/tests/browser-checks.mjs`

**Interfaces:**
- Consumes: `groups.length`, `groups.length - 1`, `parts.length`.
- Produces: no hard-coded 16/26 left in source; the guide counter, quiz denominator, complete banner, next-button guard and progress bar all derive from the catalog.

- [ ] **Step 1: Point the shell at the catalog**

Replace `15` with `groups.length - 1`, `16` with `groups.length` in the guide eyebrow, step-rail label, quiz total, complete banner and next-button guard. BOM quantity column reads `p.qty`. Update the static HTML fallbacks (`0 of 47 assemblies`, `progress max="47"`, "twenty-two guided connections", help copy mentioning standoffs, pads, backplate and bracket).

- [ ] **Step 2: Update the browser assertions**

`browser-checks.mjs`: replace `26` with `parts.length`, assert `checks` rows equal 7. `browser-files.mjs`: replace the 26 literals with `parts.length`. `home.mjs`: import `groups` and assert `path.count === groups.length`, and that step 14 opens the standoffs lesson.

- [ ] **Step 3: Run the browser suites**

Run the QA Chromium on 9228 and `node tests/browser-checks.mjs && node tests/browser-files.mjs && node tests/home.mjs && node tests/layout-mobile.mjs`.
Expected: every assertion PASS, no console exceptions, no failed resources.

- [ ] **Step 4: Commit**

```bash
git add app/src/app.js app/index.html app/tests
git commit -m "Drive the guide, progress and BOM from the catalog"
```

---

### Task 5: Documentation and QA captures

**Files:**
- Modify: `Testing.md`, `Change Log.md`
- Create: `QA/phase3-complete.png`, `QA/phase3-phone.png`, `QA/phase3-stack.png`

- [ ] **Step 1: Capture the finished stack and the guide at 390 px**

Use the CDP helper to screenshot the complete board, the phone layout and the backplate+bracket detail.

- [ ] **Step 2: Record verification**

Append to `Testing.md` the new counts (22 lessons, 47 assemblies, 7 checks), the model/browser results and the measured phone height; append the change summary to `Change Log.md`.

- [ ] **Step 3: Commit**

```bash
git add QA Testing.md "Change Log.md"
git commit -m "Record the full-parts verification"
```
