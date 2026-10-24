import {connect, wait} from './browser.mjs';
const b = await connect();
const {send, evaluate, navigate} = b;
let failed = 0;
const assert = (ok, label, detail = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) failed += 1;
};
const board = () => evaluate(`JSON.stringify((() => ({
  chips: document.querySelectorAll('.chip').length,
  banks: document.querySelectorAll('.custom-bank').length,
  placed: document.querySelectorAll('.chip.placed').length,
  summary: document.querySelector('#custom-summary')?.textContent || '',
  customHidden: document.querySelector('#custom-view').hidden,
  learnHidden: document.querySelector('#workspace').hidden,
  overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
}))())`);
await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false});
await navigate();
await evaluate('localStorage.clear()');
await navigate();
await evaluate(`document.querySelector('#custom-build-teaser').click()`);
await wait(180);
let state = JSON.parse(await board());
assert(!state.customHidden && state.learnHidden, 'Custom builder opens as a separate area');
assert(state.chips === 3 && state.banks === 1, 'Default 24 GB target needs three 8 GB packages', `${state.chips} chips in ${state.banks} bank`);
await evaluate(`(() => {
  const capacity = document.querySelector('#custom-capacity');
  capacity.value = '512';
  capacity.dispatchEvent(new Event('change'));
})()`);
await wait(150);
await evaluate(`(() => {
  const module = document.querySelector('#custom-module');
  module.value = '32';
  module.dispatchEvent(new Event('change'));
})()`);
await wait(180);
state = JSON.parse(await board());
assert(state.chips === 16 && state.banks === 2, '512 GB at 32 GB per package needs sixteen chips in two banks', `${state.chips} chips in ${state.banks} bank`);
assert(/512-bit/.test(state.summary), 'Summary reports the resulting bus width', state.summary);
await evaluate(`document.querySelector('#custom-place-bank').click()`);
await wait(150);
state = JSON.parse(await board());
assert(state.placed === 8, 'Placing one bank adds eight packages', state.placed + ' placed');
await evaluate(`document.querySelector('#custom-place-all').click()`);
await wait(150);
state = JSON.parse(await board());
assert(state.placed === 16 && /512 of 512 GB/.test(state.summary), 'Filling the banks reaches the 512 GB target', state.summary);
await send('Page.navigate', {url: 'http://localhost:4180/#custom'});
await wait(500);
state = JSON.parse(await board());
assert(!state.customHidden && state.placed === 16, 'The custom build survives a reload', state.placed + ' placed');
await evaluate(`document.querySelector('#custom-reset').click()`);
await wait(150);
await evaluate(`document.querySelector('.chip').click()`);
await wait(120);
state = JSON.parse(await board());
assert(state.placed === 1, 'A single memory package can be placed by hand', state.placed + ' placed');
await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
await wait(180);
state = JSON.parse(await board());
assert(state.overflowX === 0, 'Custom builder does not overflow a phone', state.overflowX + 'px');
await evaluate(`document.querySelector('#custom-back').click()`);
await wait(150);
state = JSON.parse(await board());
assert(state.customHidden && !state.learnHidden, 'Back returns to the teaching workbench');
b.close();
process.exit(failed ? 1 : 0);
