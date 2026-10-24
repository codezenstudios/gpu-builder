import {parts,groups,sources} from './catalog.js';
import {installed} from './model.js';
import {escape} from './render.js';

export const SUPPLY_ORDER=['Hardware','Distributor','Fabrication','Integrated'];

const supplyByKind={
 pcb:{supply:'Fabrication',note:'Order from a PCB fabricator: multilayer stackup, controlled impedance, ENIG finish.'},
 pcie:{supply:'Fabrication',note:'A gold-fingered board edge, not a separate part. Specify the card-edge bevel in fabrication.'},
 power:{supply:'Distributor',note:'Auxiliary power connector rated for the rail; keying and pin count per the connector standard you chose.'},
 controller:{supply:'Distributor',note:'Multiphase PWM controller; match the phase count and control interface.'},
 stage:{supply:'Distributor',note:'Integrated power stage rated above the phase current, with thermal margin.'},
 inductor:{supply:'Distributor',note:'Saturation current above the phase peak; choose DCR and height to suit the board.'},
 capacitor:{supply:'Distributor',note:'Voltage rating, capacitance and ESR for the output network; polymer or ceramic.'},
 gpu:{supply:'Integrated',note:'Not sold as a loose part. A packaged GPU comes on an assembled board.'},
 memory:{supply:'Integrated',note:'GDDR packages are sold to board makers, not as individual parts. Source a donor board.'},
 flash:{supply:'Distributor',note:'SPI NOR flash in the package and voltage the board supports.'},
 clock:{supply:'Distributor',note:'Oscillator at the reference frequency with the stability the design needs.'},
 decoupling:{supply:'Distributor',note:'Ceramic capacitors by package, voltage and dielectric; buy in strips.'},
 display:{supply:'Distributor',note:'Display connector matching the interface and the bracket cut-outs.'},
 fanheader:{supply:'Distributor',note:'4-pin PWM header; check the pin order against the fan lead.'},
 standoff:{supply:'Hardware',note:'M3 male-female standoffs; height must match the cooler and backplate hardware.'},
 pad:{supply:'Hardware',note:'Thermal pad in the thickness that matches the gap; 1.0–1.5 mm is common on cards.'},
 paste:{supply:'Hardware',note:'Non-conductive thermal paste; one small tube covers several mounts.'},
 heatsink:{supply:'Hardware',note:'Salvage a fin stack or have one machined; the mounting holes must match the board.'},
 fan:{supply:'Hardware',note:'PWM fan sized to the shroud, with the same voltage and connector as the header.'},
 backplate:{supply:'Hardware',note:'Sheet aluminium or steel, or a salvage part; drill to the standoff pattern.'},
 screw:{supply:'Hardware',note:'Spring-loaded cooler screws in the standoff thread; buy a matched set.'},
 bracket:{supply:'Hardware',note:'Standard PCI bracket; check slot spacing and port openings before buying.'},
 cable:{supply:'Hardware',note:'Power-supply cable with the right connector at each end; verify the pinout.'}
};
const fallback={supply:'Distributor',note:'Source from an electronics distributor.'};

const supplyById={
 H9:{supply:'Hardware',note:'Bracket screws in the board thread; check the length so they do not protrude into the card.'},
 H10:{supply:'Hardware',note:'Bracket screws in the board thread; check the length so they do not protrude into the card.'},
 'C3–C10':{supply:'Distributor',note:'Ceramic capacitors by package, voltage and dielectric; the board uses eight here.'}
};
export function sourcingFor(part){return supplyById[part.id]||supplyByKind[part.kind]||fallback;}

export function sourcingSummary(){
 const counts=Object.fromEntries(SUPPLY_ORDER.map(name=>[name,0]));
 for(const part of parts)counts[sourcingFor(part).supply]+=1;
 return counts;
}

export const formatGuideDate=date=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric'}).format(date);
const formatDate=formatGuideDate;

function stepMarkup(group,project){
 const refs=group.parts.map(part=>part.id);
 const placed=group.parts.filter(part=>installed(project,part.id)).length;
 const source=sources[group.source];
 const state=placed===group.parts.length?'Installed':placed?'Partly placed':'To place';
 const instruction=group.parts.length>1
  ?`Place ${refs.slice(0,-1).join(', ')} and ${refs.at(-1)}.`
  :`Place ${refs[0]}.`;
 return `<article class="guide-step" id="guide-step-${group.index+1}">
  <header class="guide-step-head"><span class="guide-step-number">${String(group.index+1).padStart(2,'0')}</span><div><h3>${escape(group.title)}</h3><p class="guide-step-refs">${escape(group.category.toUpperCase())} · ${escape(refs.join(' · '))}</p></div><span class="guide-step-state">${state}</span></header>
  <p class="guide-step-instruction">${escape(instruction)} ${escape(group.intro)}</p>
  <dl class="guide-step-facts"><dt>What it does</dt><dd>${escape(group.function)}</dd><dt>Where it goes</dt><dd>${escape(group.placement)}</dd><dt>Watch for</dt><dd>${escape(group.detail)}</dd></dl>
  <p class="guide-step-check"><strong>Check yourself:</strong> ${escape(group.quiz.q)} <em>Answer: ${escape(group.quiz.answers[group.quiz.correct])}</em></p>
  <p class="guide-step-source">Reference: ${escape(source.name)}</p>
 </article>`;
}

export function buildGuide(project,{date=new Date()}={}){
 const placed=project.placements.length;
 const answered=Object.entries(project.answers||{}).filter(([index,value])=>groups[index]&&value===groups[index].quiz.correct).length;
 const counts=sourcingSummary();
 const summary=SUPPLY_ORDER.map(name=>`${counts[name]} ${name.toLowerCase()}`).join(' · ');
 const partsRows=parts.map(part=>{
  const sourcing=sourcingFor(part);
  return `<tr class="${installed(project,part.id)?'is-placed':''}"><td class="guide-ref">${installed(project,part.id)?'✓ ':''}${escape(part.id)}</td><td>${escape(part.name)}</td><td class="guide-qty">${part.qty}</td><td class="guide-overall">${sourcing.supply}</td><td>${escape(sourcing.note)}</td></tr>`;
 }).join('');
 return {
  summary:counts,
  html:`<header class="guide-cover">
  <p class="guide-kicker">GPU BUILDER · BUILD GUIDE</p>
  <h1>${escape(project.name)}</h1>
  <p class="guide-lede">A step-by-step assembly reference for the GP–01 teaching card: ${groups.length} steps and ${parts.length} reference designators, from the bare PCB to the power cable.</p>
  <dl class="guide-meta">
   <div><dt>GENERATED</dt><dd>${escape(formatDate(date))}</dd></div>
   <div><dt>ASSEMBLIES</dt><dd>${placed} of ${parts.length} placed</dd></div>
   <div><dt>KNOWLEDGE CHECKS</dt><dd>${answered} of ${groups.length} correct</dd></div>
   <div><dt>MODE</dt><dd>${escape(project.mode==='explore'?'Explore layout':'Guided placement')}</dd></div>
  </dl>
  <div class="guide-safety"><h2>Before you start</h2><ul><li>Work at an ESD-safe bench and ground yourself before touching the board.</li><li>Never assemble or re-seat a card with the power supply connected.</li><li>Check every connector's keying and pin order against its cable before applying power.</li><li>Follow the manufacturer's mounting hardware, torque and thermal-interface instructions for any part you buy.</li></ul></div>
  <p class="guide-disclaimer">This guide is a teaching reference. Geometry, ratings and phase counts are illustrative; no schematic, netlist, Gerber, pin mapping or manufacturable design is included, and the checks do not replace electrical, thermal or mechanical verification.</p>
 </header>
 <section class="guide-section guide-parts">
  <h2>Parts to source</h2>
  <p class="guide-section-lede">Every reference on the board, with what it is and where a builder realistically gets it: ${escape(summary)}.</p>
  <p class="guide-note">Silicon sold only to board manufacturers is marked integrated. Hardware and distributor parts are ordinary purchases; a salvage donor card covers the integrated items plus the fabricated PCB.</p>
  <table class="guide-table"><thead><tr><th>REF.</th><th>PART</th><th>QTY</th><th>SOURCE</th><th>WHAT TO BUY</th></tr></thead><tbody>${partsRows}</tbody></table>
 </section>
 <section class="guide-section guide-steps">
  <h2>Build steps</h2>
  <p class="guide-section-lede">Work in order. Each step states what the part does, where it goes, what to watch for and a question to check your understanding.</p>
  ${groups.map(group=>stepMarkup(group,project)).join('')}
 </section>
 <footer class="guide-footer">
  <h2>Further reading</h2>
  <ul>${sources.map(source=>`<li>${escape(source.name)}</li>`).join('')}</ul>
  <p>GPU Builder · educational build guide · ${escape(formatDate(date))}</p>
 </footer>`
 };
}
