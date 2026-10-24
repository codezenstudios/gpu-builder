import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustom,placeAllBanks,placeChip} from '../src/custom.js';
import {buildCustomGuide} from '../src/customGuide.js';

const date=new Date('2026-10-24T12:00:00Z');
const count=(html,needle)=>html.split(needle).length-1;

test('a 512 GB build plans sixteen packages across two banks',()=>{
 const custom=createCustom({capacityGB:512,moduleGB:32});
 const guide=buildCustomGuide(custom,{date});
 assert.equal(guide.stats.total,16);
 assert.equal(guide.stats.banks,2);
 assert.equal(guide.stats.busBits,512);
 assert.equal(count(guide.html,'class="guide-step"'),2);
 assert.ok(guide.html.includes('M1–M8'));
 assert.ok(guide.html.includes('M9–M16'));
 assert.ok(guide.html.includes('512 × 16 ÷ 8 = 1024 GB/s theoretical'));
 assert.ok(guide.html.includes('October 24, 2026'));
 assert.equal(count(guide.html,'<tr'),4); // header row, GPU row, two bank rows
});

test('a partial last bank reports its own bus slice and capacity',()=>{
 const custom=createCustom({capacityGB:96,moduleGB:16});
 const guide=buildCustomGuide(custom,{date});
 assert.equal(guide.stats.total,6);
 assert.equal(guide.stats.banks,1);
 assert.ok(guide.html.includes('M1–M6'));
 assert.ok(guide.html.includes('6 × 32 = 192 bits'));
 assert.ok(guide.html.includes('6 × 16 GB = 96 GB'));
 assert.equal(count(guide.html,'class="guide-step"'),1);
});

test('placed banks are marked while empty banks stay to place',()=>{
 const custom=placeAllBanks(createCustom({capacityGB:512,moduleGB:32}));
 const placed=buildCustomGuide(custom,{date}).html;
 assert.equal(count(placed,'guide-step-state">Placed'),2);
 assert.equal(count(placed,'✓ M1–M8'),1);
 const partial=buildCustomGuide(placeChip(createCustom({capacityGB:512,moduleGB:32}),'M3'),{date}).html;
 assert.equal(count(partial,'guide-step-state">Partly placed'),1);
 assert.equal(count(partial,'guide-step-state">To place'),1);
});

test('the custom guide escapes the project name',()=>{
 const custom=createCustom({capacityGB:24,moduleGB:8,name:'<b>fast</b> & "cheap"'});
 const html=buildCustomGuide(custom,{date}).html;
 assert.equal(html.includes('<b>fast</b>'),false);
 assert.ok(html.includes('&lt;b&gt;fast&lt;/b&gt; &amp; &quot;cheap&quot;'));
});
