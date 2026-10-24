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
assert(metrics.docHeight <= 3800, 'Landing and the 22-lesson empty board fit in 3800px of scroll', metrics.docHeight + 'px');
assert(metrics.overflowX === 0, 'No horizontal overflow at 390px', metrics.overflowX + 'px');
assert(metrics.minTarget >= 44, 'Touch targets stay at least 44px', metrics.minTarget + 'px');
await evaluate(`window.scrollTo(0, 900)`);
await wait(120);
const stuck = JSON.parse(await evaluate(`JSON.stringify((() => {
  const r = document.querySelector('.canvas-frame').getBoundingClientRect();
  return {top: Math.round(r.top), scrollY: Math.round(window.scrollY)};
})())`));
assert(stuck.scrollY > 600 && stuck.top >= 0 && stuck.top <= 24, 'Board stays pinned while the guide scrolls', `top ${stuck.top}px at ${stuck.scrollY}px`);
const edges = JSON.parse(await evaluate(`JSON.stringify((() => {
  const footer = document.querySelector('.library-footer').getBoundingClientRect();
  const card = document.querySelector('.workbench').getBoundingClientRect();
  return {footerLeft: Math.round(footer.left), footerRight: Math.round(footer.right), cardLeft: Math.round(card.left), cardRight: Math.round(card.right)};
})())`));
assert(edges.footerLeft >= edges.cardLeft && edges.footerRight <= edges.cardRight, 'Library footer stays inside the workbench card', `footer ${edges.footerLeft}-${edges.footerRight}, card ${edges.cardLeft}-${edges.cardRight}`);
await evaluate(`document.querySelector('[data-tab="bom"]').click()`);
await wait(180);
const bom = JSON.parse(await evaluate(`JSON.stringify((() => {
  const bar = document.querySelector('.bom-toolbar');
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    barOverflow: bar.scrollWidth - bar.clientWidth,
    buttons: bar.querySelectorAll('.button').length,
    rows: document.querySelectorAll('.bom-table tbody tr').length
  };
})())`));
assert(bom.overflow === 0 && bom.barOverflow <= 1, 'BOM toolbar wraps inside the phone width', `bar ${bom.barOverflow}px, page ${bom.overflow}px`);
assert(bom.buttons === 2 && bom.rows === 47, 'BOM offers the guide and CSV actions for all 47 references', `${bom.buttons} buttons, ${bom.rows} rows`);
await evaluate(`document.querySelector('[data-tab="overview"]').click()`);
await wait(150);
await evaluate(`window.scrollTo(0, 0)`);
await wait(120);
await evaluate(`document.querySelector('.part-card').focus()`);
await wait(220);
const focused = JSON.parse(await evaluate(`JSON.stringify((() => {
  const card = document.querySelector('.part-card').getBoundingClientRect();
  const board = document.querySelector('.canvas-frame').getBoundingClientRect();
  return {cardTop: Math.round(card.top), cardBottom: Math.round(card.bottom), boardBottom: Math.round(board.bottom), viewport: innerHeight};
})())`));
assert(focused.cardTop >= focused.boardBottom - 2 && focused.cardBottom <= focused.viewport, 'Focused part card is not hidden under the pinned board', `card ${focused.cardTop}-${focused.cardBottom}, board bottom ${focused.boardBottom}`);
await evaluate(`(() => {
  const card = document.querySelectorAll('.part-card')[6];
  const top = card.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, Math.round(top + 60));
})()`);
await wait(150);
await evaluate(`document.querySelectorAll('.part-card')[6].focus()`);
await wait(220);
const tabbed = JSON.parse(await evaluate(`JSON.stringify((() => {
  const card = document.querySelectorAll('.part-card')[6].getBoundingClientRect();
  const board = document.querySelector('.canvas-frame').getBoundingClientRect();
  return {cardTop: Math.round(card.top), boardBottom: Math.round(board.bottom)};
})())`));
assert(tabbed.cardTop >= tabbed.boardBottom - 2, 'Tab focus below the pinned board is not hidden behind it', `card top ${tabbed.cardTop}, board bottom ${tabbed.boardBottom}`);
b.close();
process.exit(failed ? 1 : 0);
