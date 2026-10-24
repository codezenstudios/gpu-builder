import {writeFileSync} from 'node:fs';
import {groups,parts} from '../src/catalog.js';
import {connect,wait,dir} from './browser.mjs';
const b=await connect();const {send,evaluate,navigate,screenshot}=b;const checks=[];
function assert(ok,label){checks.push({label,passed:!!ok});console.log((ok?'PASS ':'FAIL ')+label);if(!ok)throw new Error(label);}
const click=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(el instanceof SVGElement)el.dispatchEvent(new MouseEvent('click',{bubbles:true}));else el.click();})()`);
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await navigate();await evaluate('localStorage.clear()');await navigate();
assert(await evaluate('gpuBuilderProject.placements.length===0&&!!document.querySelector(".board-welcome")'),'Empty board begins the learning sequence');
await screenshot('desktop-empty.png');
await click('[data-group="7"]');assert(await evaluate('document.querySelector("[data-action=place]").disabled'),'GPU placement is blocked before its power prerequisites');await click('[data-group="0"]');
for(const g of groups){
 for(const p of g.parts){await click('[data-action="place"]');assert(await evaluate(`gpuBuilderProject.placements.some(p=>p.id===${JSON.stringify(p.id)})`),'Place '+p.id);}
 await click('[data-answer="'+g.quiz.correct+'"]');assert(await evaluate(`gpuBuilderProject.answers[${g.index}]===${g.quiz.correct}`),'Knowledge check '+(g.index+1));
 if(g.index<groups.length-1)await click('[data-action="next"]');
}
assert(await evaluate(`gpuBuilderProject.placements.length===${parts.length}`),'Complete '+parts.length+'-assembly build');await screenshot('desktop-complete.png');
await click('[data-tab="checks"]');assert(await evaluate('document.querySelectorAll(".check-dot.pass").length===7'),'All seven modeled checks pass');
await click('[data-tab="bom"]');assert(await evaluate(`document.querySelectorAll(".bom-table tr.placed").length===${parts.length}`),'BOM contains all placed references');
await click('[data-overlay="power"]');assert(await evaluate('!!document.querySelector(".power-flow")'),'Power overlay appears');await click('[data-overlay="data"]');assert(await evaluate('!!document.querySelector(".data-flow")'),'Data overlay appears');
await click('#die-view');await click('[data-arch="cache"]');assert(await evaluate('document.querySelector(".arch-info strong").textContent.includes("reused")'),'Architecture blocks explain cache behavior');await screenshot('architecture.png');await click('#board-view');
await evaluate(`document.querySelector('#mode-select').value='explore';document.querySelector('#mode-select').dispatchEvent(new Event('change'))`);
await click('[data-group="9"]');const before=await evaluate('gpuBuilderProject.placements.find(p=>p.id==="U7")');await click('[data-nudge-x="5"]');assert(await evaluate(`gpuBuilderProject.placements.find(p=>p.id==='U7').x===${before.x+5}`),'Keyboard-accessible component movement');await click('[data-action="rotate"]');assert(await evaluate('gpuBuilderProject.placements.find(p=>p.id==="U7").rotation===90'),'Rotate a selected component');
await click('#undo-button');assert(await evaluate('gpuBuilderProject.placements.find(p=>p.id==="U7").rotation===0'),'Undo restores rotation');await click('#redo-button');assert(await evaluate('gpuBuilderProject.placements.find(p=>p.id==="U7").rotation===90'),'Redo restores rotation');
await click('[data-action="remove"]');assert(await evaluate('!gpuBuilderProject.placements.some(p=>p.id==="U7")'),'Remove selected component');await click('#undo-button');
await navigate();assert(await evaluate(`gpuBuilderProject.placements.length===${parts.length}&&gpuBuilderProject.mode==="explore"`),'Reload restores browser-local project');
await click('#help-button');assert(await evaluate('document.querySelector("#help-dialog").open'),'Help dialog opens');await click('#help-dialog .close-dialog');
await click('#reset-button');assert(await evaluate('document.querySelector("#reset-dialog").open'),'Reset requires confirmation');await click('#reset-dialog .close-dialog');assert(await evaluate(`gpuBuilderProject.placements.length===${parts.length}`),'Cancel reset preserves the build');
const layouts=[];
for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1280,800],[1440,1100]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1100});await wait(100);
 const result=await evaluate(`({width:innerWidth,page:document.documentElement.scrollWidth,canvas:document.querySelector('#canvas').getBoundingClientRect().toJSON(),guide:document.querySelector('.guide-panel').getBoundingClientRect().toJSON(),broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length})`);layouts.push({width,height,...result});assert(result.page<=result.width+1&&!result.broken,'Layout fits '+width+'×'+height);
 if(width===390||width===820)await screenshot(width===390?'phone.png':'tablet.png');
}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await click('[data-tab="overview"]');await click('[data-overlay="none"]');await click('[data-group="7"]');await screenshot('desktop-final.png');
writeFileSync(new URL('browser-checks.json',dir),JSON.stringify({checks,layouts,errors:b.errors,failed:b.failed},null,2));assert(!b.errors.length,'No browser exceptions');assert(!b.failed.length,'No failed resources');b.close();
