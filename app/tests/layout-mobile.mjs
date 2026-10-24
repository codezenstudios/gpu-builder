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
