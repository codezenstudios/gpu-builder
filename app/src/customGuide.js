import {CHIPS_PER_BANK,bankLayout,customStats} from './custom.js';
import {escape} from './render.js';
import {formatGuideDate} from './guide.js';

const refRange=ids=>ids.length===1?ids[0]:`${ids[0]}–${ids.at(-1)}`;
const bankBits=ids=>ids.length*32;

function bankStep(bank,custom,placed){
 const state=bank.ids.every(id=>placed.has(id))?'Placed':bank.ids.some(id=>placed.has(id))?'Partly placed':'To place';
 const bits=bankBits(bank.ids);
 const capacity=bank.ids.length*custom.moduleGB;
 return `<article class="guide-step">
  <header class="guide-step-head"><span class="guide-step-number">${String(bank.index+1).padStart(2,'0')}</span><div><h3>Fit memory bank ${String(bank.index+1).padStart(2,'0')}</h3><p class="guide-step-refs">MEMORY · ${escape(refRange(bank.ids))}</p></div><span class="guide-step-state">${state}</span></header>
  <p class="guide-step-instruction">Place ${escape(bank.ids.join(', '))} around the GPU package, one package per memory channel position.</p>
  <dl class="guide-step-facts">
   <dt>Where it goes</dt><dd>Bank ${String(bank.index+1).padStart(2,'0')} carries ${bits} bits of the memory interface (${bank.ids.length} × 32-bit packages).</dd>
   <dt>What it holds</dt><dd>${bank.ids.length} × ${custom.moduleGB} GB = ${capacity} GB of the ${custom.capacityGB} GB target.</dd>
   <dt>Watch for</dt><dd>Keep the packages on the same interface slice and match trace lengths within the slice. A real board also needs a ground reference and decoupling at each package.</dd>
  </dl>
  <p class="guide-step-check"><strong>Check your maths:</strong> ${bank.ids.length} × 32 = ${bits} bits, and ${bank.ids.length} × ${custom.moduleGB} GB = ${capacity} GB of the ${custom.capacityGB} GB target.</p>
 </article>`;
}

export function buildCustomGuide(custom,{date=new Date()}={}){
 const stats=customStats(custom);
 const banks=bankLayout(custom.chips);
 const placed=new Set(custom.placed);
 const packageRows=banks.map(bank=>{
  const state=bank.ids.every(id=>placed.has(id))?'Placed':bank.ids.some(id=>placed.has(id))?'Partly placed':'To place';
  return `<tr class="${bank.ids.every(id=>placed.has(id))?'is-placed':''}"><td class="guide-ref">${bank.ids.every(id=>placed.has(id))?'✓ ':''}${escape(refRange(bank.ids))}</td><td>Memory package bank ${String(bank.index+1).padStart(2,'0')}</td><td class="guide-qty">${bank.ids.length}</td><td class="guide-overall">Integrated</td><td>${custom.moduleGB} GB GDDR6, x32 interface · ${state}. Sold to board makers only; a donor card is the practical source.</td></tr>`;
 }).join('');
 return {
  stats,
  html:`<header class="guide-cover">
  <p class="guide-kicker">GPU BUILDER · CUSTOM MEMORY GUIDE</p>
  <h1>${escape(custom.name)}</h1>
  <p class="guide-lede">A sourcing and placement plan for a ${custom.capacityGB} GB card built from ${custom.moduleGB} GB packages: ${custom.chips} packages in ${stats.banks} bank${stats.banks===1?'':'s'} on a ${stats.busBits}-bit interface.</p>
  <dl class="guide-meta">
   <div><dt>GENERATED</dt><dd>${escape(formatGuideDate(date))}</dd></div>
   <div><dt>TARGET</dt><dd>${custom.capacityGB} GB</dd></div>
   <div><dt>PACKAGES</dt><dd>${custom.chips} × ${custom.moduleGB} GB</dd></div>
   <div><dt>PLACED</dt><dd>${stats.placed} of ${custom.chips}</dd></div>
  </dl>
  <div class="guide-safety"><h2>Before you source</h2><ul><li>Memory packages are soldered during board assembly, not socketed; this plan fixes the capacity, bank grouping and interface you would specify.</li><li>Packages must match the GPU's memory interface, voltage and training requirements. Mixed parts on one slice are not a drop-in swap.</li><li>Package density is device-specific: confirm which package sizes the GPU's memory controllers support before committing to a target.</li></ul></div>
  <p class="guide-disclaimer">Package counts, bank grouping and bandwidth are teaching estimates computed from the target and module size. This is not a vendor design, a compatibility promise or a bill of materials you can order from a distributor.</p>
 </header>
 <section class="guide-section">
  <h2>The capacity maths</h2>
  <p class="guide-section-lede">Every number below is derived from the two choices you made, so the plan can be checked with a calculator.</p>
  <dl class="guide-meta">
   <div><dt>PACKAGES</dt><dd>${custom.capacityGB} ÷ ${custom.moduleGB} = ${custom.chips}</dd></div>
   <div><dt>BANKS</dt><dd>⌈${custom.chips} ÷ ${CHIPS_PER_BANK}⌉ = ${stats.banks}</dd></div>
   <div><dt>MEMORY BUS</dt><dd>${custom.chips} × 32 = ${stats.busBits} bits</dd></div>
   <div><dt>AT 16 Gb/s PER PIN</dt><dd>${stats.busBits} × 16 ÷ 8 = ${stats.busBits*2} GB/s theoretical</dd></div>
  </dl>
  <p class="guide-note">Bandwidth assumes the teaching model's 16 Gb/s per pin and a fully populated interface. Real cards trade pin rate, package count and power against each other, and application throughput is always lower.</p>
 </section>
 <section class="guide-section">
  <h2>Parts to source</h2>
  <p class="guide-section-lede">Memory for ${stats.placed} of ${custom.chips} packages is marked as placed. Banks are listed as they appear on the board.</p>
  <p class="guide-note">The board, power delivery, cooling and chassis hardware are covered by the teaching build guide, not repeated here.</p>
  <table class="guide-table"><thead><tr><th>REF.</th><th>PART</th><th>QTY</th><th>SOURCE</th><th>WHAT TO BUY</th></tr></thead><tbody>
   <tr><td class="guide-ref">U1</td><td>GPU package</td><td class="guide-qty">1</td><td class="guide-overall">Integrated</td><td>Packaged GPU with a ${stats.busBits}-bit memory interface. Not sold as a loose part.</td></tr>
   ${packageRows}
  </tbody></table>
 </section>
 <section class="guide-section guide-steps">
  <h2>Placement plan</h2>
  <p class="guide-section-lede">Work one bank at a time. Each bank is a slice of the memory interface; the last bank may be partial.</p>
  ${banks.map(bank=>bankStep(bank,custom,placed)).join('')}
 </section>
 <footer class="guide-footer">
  <p>Custom build · ${escape(custom.name)} · ${custom.capacityGB} GB target · ${escape(formatGuideDate(date))}</p>
  <p>GPU Builder · educational capacity plan · not a manufacturable design.</p>
 </footer>`
 };
}
