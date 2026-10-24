import test from 'node:test';
import assert from 'node:assert/strict';
import {parts,groups} from '../src/catalog.js';
import {createProject,place} from '../src/model.js';
import {buildGuide,sourcingSummary,sourcingFor} from '../src/guide.js';

const date=new Date('2026-10-24T12:00:00Z');

test('the guide covers every step, part and sourcing class',()=>{
 const guide=buildGuide(createProject(),{date});
 assert.equal((guide.html.match(/class="guide-step"/g)||[]).length,22);
 assert.equal((guide.html.match(/<tr class="(?:is-placed)?">/g)||[]).length,47);
 assert.equal((guide.html.match(/<tr class="(?:is-placed)?">/g)||[]).length,parts.length);
 assert.deepEqual(sourcingSummary(),{Hardware:23,Distributor:17,Fabrication:2,Integrated:5});
 assert.ok(guide.html.includes('23 hardware · 17 distributor · 2 fabrication · 5 integrated'));
 assert.ok(guide.html.includes('0 of 47 placed'));
 assert.ok(guide.html.includes('October 24, 2026'));
});

test('the guide escapes project data and reports installed parts',()=>{
 const project=place({...createProject(),name:'<script>alert(1)</script> & "board"'},'PCB1');
 const guide=buildGuide(project,{date});
 assert.equal(guide.html.includes('<script>alert(1)</script>'),false);
 assert.ok(guide.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;board&quot;'));
 assert.ok(guide.html.includes('1 of 47 placed'));
 assert.equal((guide.html.match(/guide-step-state">Installed/g)||[]).length,1);
 assert.ok(guide.html.includes('✓ PCB1'));
});

test('each step repeats its quiz question and the correct answer',()=>{
 const html=buildGuide(createProject(),{date}).html;
 for(const group of groups){
  assert.ok(html.includes(group.quiz.q.replaceAll('&','&amp;').replaceAll('"','&quot;')));
  assert.ok(html.includes('Answer: '+group.quiz.answers[group.quiz.correct].replaceAll('&','&amp;').replaceAll('"','&quot;')));
 }
 assert.ok(html.includes('Reference: Noctua · PWM fan specifications'));
});

test('sourcing advice exists for every kind on the board',()=>{
 for(const part of parts){
  const sourcing=sourcingFor(part);
  assert.ok(['Hardware','Distributor','Fabrication','Integrated'].includes(sourcing.supply));
  assert.ok(sourcing.note.length>20);
 }
 assert.equal(sourcingFor({kind:'memory'}).supply,'Integrated');
 assert.equal(sourcingFor({kind:'standoff'}).supply,'Hardware');
 assert.equal(sourcingFor({kind:'does-not-exist'}).supply,'Distributor');
});
