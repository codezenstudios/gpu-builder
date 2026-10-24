import {mkdtempSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {connect,wait,dir} from './browser.mjs';
import {validateProject} from '../src/model.js';
import {parts} from '../src/catalog.js';
const b=await connect();const {send,evaluate,navigate}=b;const checks=[];
function assert(ok,label){checks.push({label,passed:!!ok});console.log((ok?'PASS ':'FAIL ')+label);if(!ok)throw new Error(label);}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const folder=mkdtempSync(join(tmpdir(),'gpu-builder-files-'));
await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder,eventsEnabled:true});await navigate();
const original=await evaluate('gpuBuilderProject');assert(original.placements.length===parts.length,'File tests use the completed isolated QA project');
await click('#export-button');await wait(350);let files=readdirSync(folder);const json=files.find(f=>f.endsWith('.json'));assert(Boolean(json),'Project export creates a JSON download');assert(validateProject(JSON.parse(readFileSync(join(folder,json),'utf8'))).placements.length===parts.length,'Exported JSON validates and preserves components');
await click('[data-tab="bom"]');await click('[data-action="csv"]');await wait(350);files=readdirSync(folder);const csv=files.find(f=>f.endsWith('.csv'));assert(Boolean(csv)&&readFileSync(join(folder,csv),'utf8').includes('C3–C10'),'BOM CSV downloads with component identifiers');
const bad=join(folder,'invalid.json');writeFileSync(bad,JSON.stringify({...original,placements:[{id:'NO_SUCH_PART',x:0,y:0,rotation:0}]}));
async function importFile(path){const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#import-file'});await send('DOM.setFileInputFiles',{nodeId,files:[path]});await wait(200);}
await importFile(bad);assert(await evaluate(`document.querySelector("#toast").textContent.startsWith("Import failed")&&gpuBuilderProject.placements.length===${parts.length}`),'Invalid import is rejected without replacing the workspace');
const good=join(folder,'valid.json');writeFileSync(good,JSON.stringify({...original,name:'Imported electronics study'}));await importFile(good);assert(await evaluate(`gpuBuilderProject.name==="Imported electronics study"&&gpuBuilderProject.placements.length===${parts.length}`),'Valid JSON import restores the project');await click('#undo-button');assert(await evaluate(`gpuBuilderProject.name===${JSON.stringify(original.name)}`),'Import is reversible with undo');
await click('#reset-button');await click('#confirm-reset');assert(await evaluate('gpuBuilderProject.placements.length===0'),'Confirmed reset clears the workspace');await click('#undo-button');assert(await evaluate(`gpuBuilderProject.placements.length===${parts.length}`),'Undo restores a reset workspace');
await click('[data-group="0"]');await click('[data-action="previous"]').catch(()=>{});
await evaluate(`document.querySelector('#part-search').value='U7';document.querySelector('#part-search').dispatchEvent(new Event('input'))`);assert(await evaluate('document.querySelectorAll(".part-card").length===1&&document.querySelector(".part-card").textContent.includes("Firmware")'),'Library search finds a reference identifier');await evaluate(`document.querySelector('#part-search').value='';document.querySelector('#part-search').dispatchEvent(new Event('input'))`);
await click('[data-group="9"]');await send('Page.reload');await wait(250);
await evaluate(`document.querySelector('#mode-select').value='explore';document.querySelector('#mode-select').dispatchEvent(new Event('change'))`);await click('[data-group="9"]');
const before=await evaluate('gpuBuilderProject.placements.find(p=>p.id==="U7")');
await evaluate(`document.querySelector('.canvas-frame').scrollIntoView({block:'center'})`);await wait(200);
const at=await evaluate(`(()=>{const el=document.querySelector('[data-part="U7"]'),svg=document.querySelector('#board-svg'),p=new DOMPoint(0,0).matrixTransform(el.getScreenCTM());return{x:p.x,y:p.y,scale:svg.getScreenCTM().a};})()`);
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:at.x,y:at.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:at.x+10*at.scale,y:at.y,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:at.x+10*at.scale,y:at.y,button:'left',clickCount:1});
assert(await evaluate(`gpuBuilderProject.placements.find(p=>p.id==='U7').x===${before.x+10}`),'Pointer drag moves an installed package');await click('#undo-button');
// Test external-library drag/drop using native DragEvent/DataTransfer objects.
await click('#reset-button');await click('#confirm-reset');
await evaluate(`(()=>{const source=document.querySelector('[data-group="0"]'),canvas=document.querySelector('#canvas'),svg=document.querySelector('#board-svg'),p=new DOMPoint(500,270).matrixTransform(svg.getScreenCTM()),dataTransfer=new DataTransfer();source.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer}));canvas.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer,clientX:p.x,clientY:p.y}));})()`);
assert(await evaluate('gpuBuilderProject.placements.some(p=>p.id==="PCB1")'),'Library drag and drop places the board');
// Restore the completed QA build and leave the user browser's storage untouched.
const restore=join(folder,'restore.json');writeFileSync(restore,JSON.stringify(original));await importFile(restore);
writeFileSync(new URL('browser-files.json',dir),JSON.stringify({checks,errors:b.errors,failed:b.failed},null,2));assert(!b.errors.length,'File and drag checks have no browser exceptions');b.close();
