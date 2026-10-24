import {connect, wait} from './browser.mjs';
import {groups} from '../src/catalog.js';
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
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
})())`));
assert(phone.intro, 'Intro section renders above the workbench');
assert(phone.images === 4, 'Gallery renders four photographs', phone.images + ' images');
assert(phone.loaded === 4, 'All four photographs load', phone.loaded + ' loaded');
assert(phone.twoUp, 'Phone gallery is a two-column grid', 'first width ' + phone.firstWidth + 'px');
assert(phone.overflowX === 0, 'Gallery adds no horizontal overflow', phone.overflowX + 'px');
await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false});
await wait(200);
const desktop = JSON.parse(await evaluate(`JSON.stringify((() => {
  const imgs = [...document.querySelectorAll('.bench-gallery img')];
  return {fourUp: imgs.length === 4 && imgs.every((i) => Math.abs(i.getBoundingClientRect().top - imgs[0].getBoundingClientRect().top) < 2), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth};
})())`));
assert(desktop.fourUp, 'Desktop gallery is a four-up row');
assert(desktop.overflowX === 0, 'Gallery adds no horizontal overflow at 1440px', desktop.overflowX + 'px');
const path = JSON.parse(await evaluate(`JSON.stringify((() => {
  const steps = [...document.querySelectorAll('#build-path [data-step]')];
  return {count: steps.length, current: document.querySelectorAll('#build-path [aria-current="step"]').length};
})())`));
assert(path.count === groups.length, 'Build path lists every lesson', path.count + ' steps');
assert(path.current === 1, 'Exactly one step is marked current', path.current + ' current');
await evaluate(`(() => { const steps = document.querySelectorAll('#build-path [data-step]'); if (steps[8]) steps[8].click(); })()`);
await wait(180);
const jumped = await evaluate(`document.querySelector('#guide-content h2').textContent.trim()`);
assert(jumped === 'Build the local memory interface.', 'Clicking a step opens that lesson', jumped);
await evaluate(`(() => { const steps = document.querySelectorAll('#build-path [data-step]'); if (steps[14]) steps[14].click(); })()`);
await wait(180);
const mechanical = await evaluate(`document.querySelector('#guide-content h2').textContent.trim()`);
assert(mechanical === 'Mount the standoffs.', 'Later build steps open their lesson', mechanical);
await evaluate(`(() => { const steps = document.querySelectorAll('#build-path [data-step]'); if (steps[steps.length - 1]) steps[steps.length - 1].click(); })()`);
await wait(180);
const last = await evaluate(`document.querySelector('#guide-content h2').textContent.trim()`);
assert(last === 'Connect the power cable.', 'The final build step is reachable', last);
b.close();
process.exit(failed ? 1 : 0);
