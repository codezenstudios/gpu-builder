import test from 'node:test';
import assert from 'node:assert/strict';
import {parts,groups,byId} from '../src/catalog.js';
import {createProject,place,move,remove,checks,validateProject,memoryStats,bomCsv} from '../src/model.js';
function full(){return parts.reduce((project,part)=>place(project,part.id),createProject());}
const positionOf=id=>({x:byId[id].x,y:byId[id].y,rotation:0});
test('the guided sequence completes with unique references and all learning checks passing',()=>{
 assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
 const project=full();assert.equal(project.placements.length,47);assert.equal(checks(project).length,7);assert.ok(checks(project).every(check=>check.ok));assert.deepEqual(memoryStats(project),{count:4,capacity:8,bits:128,bandwidth:256});assert.deepEqual(validateProject(project),project);
});
test('the mechanical and thermal lessons follow real build order',()=>{
 assert.equal(groups.length,22);assert.equal(parts.length,47);
 assert.deepEqual(groups.slice(14).map(g=>g.short),['Standoffs','Thermal pads','Thermal paste','Heatsink','Cooling fans','Backplate','PCIe bracket','Power cable']);
 assert.deepEqual(byId.HS1.requires,['U1','TIM1','J4']);assert.deepEqual(byId.TIM1.requires,['U1','TP1','TP2','TP3','TP4','TP5']);
 const project=full();assert.equal(checks(project).find(c=>c.label==='Cooling stack').ok,true);assert.equal(checks(project).find(c=>c.label==='Thermal interface').ok,true);
 assert.equal(byId['C3–C10'].qty,8);assert.equal(byId.FAN2.qty,1);
});
test('a saved v1 project upgrades instead of failing to load',()=>{
 const legacyIds=['PCB1','J1','J2','U6','U8','U9','U10','U11','L1','L2','L3','L4','C1','C2','U1','U2','U3','U4','U5','U7','Y1','C3–C10','J3','J4','HS1','FAN1'];
 const legacy={version:1,name:'Old build',mode:'guided',answers:{0:0,14:0},placements:legacyIds.map(id=>({id,...positionOf(id)}))};
 const upgraded=validateProject(legacy);
 assert.equal(upgraded.version,2);assert.equal(upgraded.name,'Old build');assert.equal(upgraded.answers[0],0);
 assert.equal(upgraded.placements.some(p=>p.id==='HS1'),false);assert.equal(upgraded.placements.some(p=>p.id==='FAN1'),false);
 assert.equal(upgraded.placements.some(p=>p.id==='J4'),true);assert.equal(upgraded.placements.length,24);
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
 const csv=bomCsv(restored);assert.ok(csv.includes('"C3–C10","Decoupling capacitor bank","Support","8","Placed"'));assert.ok(csv.includes('"TP5","Power-stage thermal pad","Cooling","1","Placed"'));assert.equal(csv.split('\r\n').length,48);
});
