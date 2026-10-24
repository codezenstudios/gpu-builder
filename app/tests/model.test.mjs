import test from 'node:test';
import assert from 'node:assert/strict';
import {parts,groups,byId} from '../src/catalog.js';
import {createProject,place,move,remove,checks,validateProject,memoryStats,bomCsv} from '../src/model.js';
function full(){return parts.reduce((project,part)=>place(project,part.id),createProject());}
test('the guided sequence completes with unique references and all learning checks passing',()=>{
 assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
 const project=full();assert.equal(project.placements.length,26);assert.ok(checks(project).every(check=>check.ok));assert.deepEqual(memoryStats(project),{count:4,capacity:8,bits:128,bandwidth:256});assert.deepEqual(validateProject(project),project);
});
test('prerequisites prevent placing a processor or cooler on an incomplete build',()=>{
 const project=place(createProject(),'PCB1');assert.throws(()=>place(project,'U1'),/Place C1, C2 first/);assert.throws(()=>place(project,'HS1'),/Place U1/);assert.equal(project.placements.length,1);assert.throws(()=>place(project,'PCB1'),/already placed/);
});
test('removing a core prerequisite cascades to dependent assemblies and clears affected quiz answers',()=>{
 const project=full();project.answers=Object.fromEntries(groups.map(g=>[g.index,g.quiz.correct]));
 const result=remove(project,'U1');assert.ok(result.removed.includes('U2'));assert.ok(result.removed.includes('HS1'));assert.ok(result.removed.includes('FAN1'));assert.ok(result.project.placements.some(p=>p.id==='L1'));assert.equal(result.project.answers[7],undefined);assert.equal(result.project.answers[3],groups[3].quiz.correct);assert.deepEqual(validateProject(result.project),result.project);
 const empty=remove(project,'PCB1').project;assert.equal(empty.placements.length,0);assert.deepEqual(empty.answers,{});
});
test('exploration rejects collisions and boundary violations without mutating the original project',()=>{
 const project={...full(),mode:'explore'};const old=structuredClone(project);
 assert.throws(()=>move(project,'U2',446,270),/overlaps/);assert.throws(()=>move(project,'U2',-1,20),/inside/);assert.deepEqual(project,old);
 const moved=move(project,'U7',635,410);assert.equal(moved.placements.find(p=>p.id==='U7').y,410);assert.deepEqual(validateProject(moved),moved);
 assert.throws(()=>move({...project,mode:'guided'},'U7',635,410),/Explore/);
});
test('import rejects malformed, unknown, duplicate, unbounded and inconsistent project data',()=>{
 for(const input of [null,{},[],{...createProject(),version:9},{...createProject(),name:'x'.repeat(81)},{...createProject(),mode:'admin'}])assert.throws(()=>validateProject(input));
 const project=full();
 for(const placement of [{id:'unknown',x:0,y:0,rotation:0},{id:'PCB1',x:Infinity,y:270,rotation:0},{id:'PCB1',x:500,y:270,rotation:4}])assert.throws(()=>validateProject({...createProject(),placements:[placement]}));
 assert.throws(()=>validateProject({...project,placements:[...project.placements,project.placements[0]]}));
 assert.throws(()=>validateProject({...project,placements:project.placements.filter(p=>p.id!=='U1')}),/dependencies/);
 assert.throws(()=>validateProject({...createProject(),answers:{0:0}}),/incomplete/);
 assert.throws(()=>validateProject({...project,answers:{0:100}}),/answer/);
});
test('JSON round-trip preserves answers and BOM reflects grouped capacitors accurately',()=>{
 const project=full();project.answers[0]=groups[0].quiz.correct;const restored=validateProject(JSON.parse(JSON.stringify(project)));assert.deepEqual(restored,project);
 const csv=bomCsv(restored);assert.ok(csv.includes('"C3–C10","Decoupling capacitor bank","Support","8","Placed"'));assert.equal(csv.split('\r\n').length,27);
});
