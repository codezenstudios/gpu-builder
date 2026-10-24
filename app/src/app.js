import {parts,byId,groups,categories,sources} from './catalog.js';
import {createProject,installed,missing,nextPart,currentLesson,memoryStats,place,move,remove,checks,validateProject,bomCsv} from './model.js';
import {boardSvg,architectureSvg,architectureBlocks,escape as esc,icon} from './render.js';
const $=selector=>document.querySelector(selector);
const storageKey='gpu-builder.project.v1';
let project=createProject(),loadWarning='',storageAvailable=true;
try{const raw=localStorage.getItem(storageKey);if(raw)project=validateProject(JSON.parse(raw));}catch{loadWarning='Your saved project could not be loaded. You can import an exported copy or start a new build.';}
let selected=nextPart(project)?.id||'U1';
let lessonIndex=groups.findIndex(g=>!g.parts.every(p=>installed(project,p.id))||project.answers[g.index]!==g.quiz.correct);if(lessonIndex<0)lessonIndex=15;
let view='board',archSelected='compute',overlay='none',labels=true,zoom=1,pan={x:0,y:0},dock='overview',past=[],future=[],toastTimer;
let drag=null;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
$('#category-select').innerHTML=categories.map(value=>`<option>${esc(value)}</option>`).join('');
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(project));storageAvailable=true;$('#save-label').textContent='Saved on this browser';}catch{storageAvailable=false;$('#save-label').textContent='Not saved · export a copy';toast('Browser storage is unavailable. Export the project to keep your work.');}}
function commit(next,message){past.push(structuredClone(project));if(past.length>70)past.shift();future=[];project=next;save();render();if(message)toast(message);}
function undo(){if(!past.length)return;future.push(structuredClone(project));project=past.pop();reconcile();save();render();toast('Last change undone.');}
function redo(){if(!future.length)return;past.push(structuredClone(project));project=future.pop();reconcile();save();render();toast('Change restored.');}
function reconcile(){if(selected&&installed(project,selected)){lessonIndex=byId[selected].lesson;return;}selected=nextPart(project)?.id||'U1';lessonIndex=byId[selected].lesson;}
function groupNext(group){return group.parts.find(p=>!installed(project,p.id));}
function renderLibrary(){
 const search=$('#part-search').value.trim().toLowerCase();const category=$('#category-select').value;
 const visible=groups.filter(g=>(category==='All parts'||g.category===category)&&([g.short,g.title,...g.parts.flatMap(p=>[p.name,p.id])].join(' ').toLowerCase().includes(search)));
 $('#library-count').textContent=visible.length;
 $('#part-list').innerHTML=visible.length?visible.map(g=>{const count=g.parts.filter(p=>installed(project,p.id)).length;const pending=groupNext(g);const locked=pending&&missing(project,pending.id).length;return `<button class="part-card ${lessonIndex===g.index?'active':''} ${locked?'locked':''}" data-group="${g.index}" draggable="${Boolean(pending)}" aria-label="${esc(g.short)}, ${count} of ${g.parts.length} placed"><span class="part-symbol" aria-hidden="true">${g.symbol}</span><span class="part-card-text"><strong>${esc(g.short)}</strong><small>${esc(g.parts.length>1?g.parts[0].id+'–'+g.parts.at(-1).id:g.parts[0].id)}</small></span><span class="part-badge ${count===g.parts.length?'done':''}">${count===g.parts.length?icon('check',11):g.parts.length>1?count+'/'+g.parts.length:locked?'·':'+'}</span></button>`;}).join(''):'<p class="empty-search">No matching components. Try a name, category or reference such as U1.</p>';
}
function renderCanvas(){
 $('#canvas').classList.toggle('explore-mode',project.mode==='explore'&&view==='board');
 const g=groups[lessonIndex];$('#canvas').innerHTML=view==='board'?boardSvg(project,{selected,preview:groupNext(g)?.id,overlay,labels,zoom,pan}):architectureSvg(archSelected);
 $('#board-view').classList.toggle('active',view==='board');$('#board-view').setAttribute('aria-pressed',view==='board');$('#die-view').classList.toggle('active',view==='die');$('#die-view').setAttribute('aria-pressed',view==='die');
 $('#canvas-mode-label').textContent=view==='die'?'FUNCTIONAL ARCHITECTURE':project.mode==='guided'?'GUIDED WORKSPACE':'EXPLORE · DRAG TO MOVE';
 $('#zoom-level').textContent=Math.round(zoom*100)+'%';
 for(const id of ['zoom-in','zoom-out','zoom-fit'])$('#'+id).disabled=view==='die';
 $('#zoom-in').disabled=view==='die'||zoom>=2.5;$('#zoom-out').disabled=view==='die'||zoom<=.7;
 $('#labels-toggle').disabled=view==='die';document.querySelectorAll('[data-overlay]').forEach(b=>{b.classList.toggle('active',b.dataset.overlay===overlay);b.setAttribute('aria-pressed',b.dataset.overlay===overlay);b.disabled=view==='die';});
}
function renderGuide(){
 const g=groups[lessonIndex],pending=groupNext(g),done=!pending,selectedDef=byId[selected],inspected=selectedDef?.lesson===lessonIndex&&installed(project,selected);
 const id=inspected?selectedDef:pending||g.parts.at(-1),needs=pending?missing(project,pending.id):[];
 const correct=project.answers[lessonIndex]===g.quiz.correct;const answered=Object.hasOwn(project.answers,lessonIndex);
 const ref=sources[g.source];
 $('#guide-content').innerHTML=`<div class="guide-eyebrow"><span>${view==='die'?'SILICON EXPLORER':'YOUR ASSEMBLY GUIDE'}</span><span>${String(lessonIndex+1).padStart(2,'0')} / 16</span></div><div class="guide-step" aria-label="Sixteen assembly lessons">${groups.map(group=>`<span class="${group.index===lessonIndex?'current':group.parts.every(p=>installed(project,p.id))?'complete':''}"></span>`).join('')}</div><div class="lesson-index"><span class="number">${String(lessonIndex+1).padStart(2,'0')}</span><span>${esc(g.category.toUpperCase())}</span></div><h2>${esc(g.title)}<span style="color:#b86c43">.</span></h2><p class="lesson-intro">${esc(g.intro)}</p><div class="component-identity"><span class="identity-symbol" aria-hidden="true">${g.symbol}</span><div class="identity-info"><strong>${esc(id.id)}</strong><small>${esc(id.name)}${inspected?' · placed':''}</small></div></div><section class="lesson-section"><h3>What it does</h3><p>${esc(g.function)}</p></section><section class="lesson-section"><h3>Why it goes here</h3><p>${esc(g.placement)}</p></section><details class="engineering-details"><summary>Engineering notes</summary><p>${esc(g.detail)}</p></details>
 ${view==='die'?`<div class="arch-info"><strong>${esc(architectureBlocks.find(b=>b.id===archSelected).title)}</strong><p>${esc(architectureBlocks.find(b=>b.id===archSelected).text)}</p></div><div class="arch-list">${architectureBlocks.map(b=>`<button class="${b.id===archSelected?'active':''}" data-arch-select="${b.id}">${esc(b.label)}</button>`).join('')}</div><button class="button button-orange place-button" data-action="return-board">Back to board assembly ${icon('arrow')}</button>`:`${g.parts.length>1?`<div class="group-status">${g.parts.map(p=>`<span class="${installed(project,p.id)?'placed':''}">${esc(p.id)} ${installed(project,p.id)?'✓':''}</span>`).join('')}</div>`:''}<button class="button button-orange place-button" data-action="place" ${done||needs.length?'disabled':''}>${done?icon('check'):icon('plus')} ${done?'Step assembled':`Place ${esc(pending.id)}`}</button><p class="placement-note">${needs.length?'Requires '+esc(needs.join(', '))+' first.':done?'Answer the knowledge check to continue.':'Snaps to the suggested footprint · drag also supported'}</p>${inspected&&id.kind!=='pcb'?`<div class="inspect-actions"><button class="button" data-action="rotate" ${project.mode!=='explore'?'disabled':''}>${icon('rotate')} Rotate</button><button class="button" data-action="remove">${icon('trash')} Remove</button></div>${project.mode==='explore'?`<div class="nudge-controls"><span>MOVE / 5 DIAGRAM UNITS</span>${[[-5,0,'←','left'],[0,-5,'↑','up'],[0,5,'↓','down'],[5,0,'→','right']].map(([x,y,label,direction])=>`<button data-nudge-x="${x}" data-nudge-y="${y}" aria-label="Move selected component ${direction}">${label}</button>`).join('')}</div>`:''}<p class="selection-note">${project.mode==='explore'?'Drag the selected package to move it.':'Switch to Explore layout to move or rotate parts.'} Removal also removes dependent parts. Undo restores them.</p>`:''}`}
 ${done?`<section class="knowledge-check"><h3>MAKE THE CONNECTION</h3><p>${esc(g.quiz.q)}</p>${g.quiz.answers.map((answer,i)=>`<button class="answer ${answered&&project.answers[lessonIndex]===i?(i===g.quiz.correct?'correct':'incorrect'):''}" data-answer="${i}" aria-pressed="${answered&&project.answers[lessonIndex]===i}"><span>${String.fromCharCode(65+i)}</span><span>${esc(answer)}</span></button>`).join('')}${answered?`<div class="quiz-feedback ${correct?'correct':''}" role="status"><strong>${correct?'Exactly.':'Take another look.'}</strong> ${esc(g.quiz.why)}</div>`:''}</section>`:''}
 ${project.placements.length===parts.length?`<div class="complete-banner"><strong>Your teaching board is assembled.</strong><br>${Object.entries(project.answers).filter(([i,a])=>a===groups[i].quiz.correct).length}/16 knowledge checks answered correctly. Inspect the board, review the checks, or export your build.</div>`:''}<div class="lesson-navigation"><button data-action="previous" ${lessonIndex===0?'disabled':''}>← Previous</button><button data-action="next" ${lessonIndex===15||!done||!correct?'disabled':''}>Next connection ${icon('arrow')}</button></div><a class="lesson-source" href="${ref.url}" target="_blank" rel="noopener noreferrer">Reference: ${esc(ref.name)} ↗</a>`;
}
function renderDock(){
 const stat=memoryStats(project);$('#bom-count').textContent=project.placements.length;
 const learned=Object.entries(project.answers).filter(([i,a])=>a===groups[i].quiz.correct).length;
 if(dock==='overview')$('#dock-content').innerHTML=`<div class="overview"><div class="metric"><span class="metric-label">LOCAL MEMORY</span><strong>${stat.capacity} <span>GB</span></strong><small>${stat.count} of 4 GDDR6 packages</small></div><div class="metric"><span class="metric-label">MEMORY INTERFACE</span><strong>${stat.bits} <span>bit</span></strong><small>${stat.bandwidth} GB/s theoretical</small></div><div class="metric"><span class="metric-label">KNOWLEDGE CHECKS</span><strong>${String(learned).padStart(2,'0')} <span>/ 16</span></strong><small>Understand every connection</small></div></div><p class="metric-note">${stat.count?'Bandwidth = 16 Gb/s per pin × '+stat.bits+' bits ÷ 8. Illustrative, fully populated independent x32 channels; not measured performance.':'Place components to build up your board’s teaching inventory. Start with PCB1, then follow the guide.'}</p>`;
 if(dock==='bom')$('#dock-content').innerHTML=`<div class="bom-toolbar"><span>Reference designators match your board.</span><button class="button button-small" data-action="csv">${icon('download',13)} Export CSV</button></div><div class="table-scroll"><table class="bom-table"><thead><tr><th>REF.</th><th>COMPONENT</th><th>QTY</th><th>STATUS</th></tr></thead><tbody>${parts.map(p=>`<tr class="${installed(project,p.id)?'placed':''}"><td>${esc(p.id)}</td><td>${esc(p.name)}</td><td>${p.kind==='decoupling'?8:1}</td><td><span class="status-pill ${installed(project,p.id)?'':'pending'}">${installed(project,p.id)?'Placed':'To place'}</span></td></tr>`).join('')}</tbody></table></div>`;
 if(dock==='checks')$('#dock-content').innerHTML=`<div class="checks-list">${checks(project).map(c=>`<div class="check-row"><span class="check-dot ${c.ok?'pass':''}">${c.ok?'✓':'·'}</span><div><strong>${esc(c.label)}</strong><p>${esc(c.detail)}</p></div></div>`).join('')}</div>`;
 if(dock==='notes')$('#dock-content').innerHTML=`<div class="references">${sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>`).join('')}<p>Component functions are grounded in public engineering references. This is a generic teaching board. It has no vendor affiliation, component procurement list, pin mapping or verified routing. The silicon diagram uses illustrative block counts.</p></div>`;
 $('#dock-content').setAttribute('aria-labelledby','tab-'+dock);
 document.querySelectorAll('[data-tab]').forEach(el=>{el.classList.toggle('active',el.dataset.tab===dock);el.setAttribute('aria-selected',el.dataset.tab===dock);el.tabIndex=el.dataset.tab===dock?0:-1;});
}
function render(){
 $('#project-name').value=project.name;$('#mode-select').value=project.mode;$('#progress').max=parts.length;$('#progress').value=project.placements.length;$('#progress-label').textContent=project.placements.length+' of '+parts.length+' assemblies';$('#progress-percent').textContent=Math.round(project.placements.length/parts.length*100)+'%';$('#undo-button').disabled=!past.length;$('#redo-button').disabled=!future.length;
 renderLibrary();renderCanvas();renderGuide();renderDock();
}
function chooseGroup(index){lessonIndex=index;selected=(groupNext(groups[index])||groups[index].parts[0]).id;render();}
function placeCurrent(position){const pending=groupNext(groups[lessonIndex]);if(!pending)return toast('This step is already assembled.');try{
 if(position&&Math.hypot(position.x-pending.x,position.y-pending.y)>Math.max(65,pending.w/2)&&project.mode==='guided')return toast('Drop near the highlighted '+pending.id+' footprint, or use the placement button.');
 const actual=project.mode==='explore'&&pending.kind!=='pcb'?position:undefined;
 const next=place(project,pending.id,actual);selected=pending.id;commit(next,pending.id+' placed. '+(groups[lessonIndex].parts.some(p=>!installed(next,p.id))?'Add the next part in this step.':'Complete the knowledge check to continue.'));
 }catch(e){toast(e.message);}}
function selectPart(id){if(!byId[id])return;selected=id;lessonIndex=byId[id].lesson;render();}
function download(text,type,extension){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;const name=project.name.replace(/[^a-z0-9 -]/gi,'').trim().replaceAll(' ','-').slice(0,60)||'gpu-project';a.download=name+'.'+extension;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#part-search').addEventListener('input',renderLibrary);$('#category-select').addEventListener('change',renderLibrary);
$('#part-list').addEventListener('click',event=>{const button=event.target.closest('[data-group]');if(button)chooseGroup(Number(button.dataset.group));});
$('#part-list').addEventListener('dragstart',event=>{const button=event.target.closest('[data-group]');if(!button)return;chooseGroup(Number(button.dataset.group));const p=groupNext(groups[lessonIndex]);if(!p){event.preventDefault();return;}event.dataTransfer.setData('application/x-gpu-part',p.id);event.dataTransfer.effectAllowed='copy';});
function point(event){const svg=$('#board-svg');if(!svg)return null;const p=new DOMPoint(event.clientX,event.clientY);return p.matrixTransform(svg.getScreenCTM().inverse());}
$('#canvas').addEventListener('dragover',event=>{if(view==='board'){event.preventDefault();event.dataTransfer.dropEffect='copy';}});
$('#canvas').addEventListener('drop',event=>{event.preventDefault();if(view!=='board')return;const id=event.dataTransfer.getData('application/x-gpu-part');if(!byId[id])return;lessonIndex=byId[id].lesson;selected=id;placeCurrent(point(event));});
$('#canvas').addEventListener('click',event=>{if(drag?.moved)return;const el=event.target.closest('[data-part]');if(el)selectPart(el.dataset.part);const arch=event.target.closest('[data-arch]');if(arch){archSelected=arch.dataset.arch;renderCanvas();renderGuide();}});
$('#canvas').addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const el=event.target.closest('[data-part],[data-arch]');if(el){event.preventDefault();if(el.dataset.part)selectPart(el.dataset.part);else{archSelected=el.dataset.arch;renderCanvas();renderGuide();}}});
$('#canvas').addEventListener('pointerdown',event=>{
 if(view!=='board'||project.mode!=='explore'||event.button!==0)return;const el=event.target.closest('[data-part]');const start=point(event);if(!start)return;
 const id=el?.dataset.part;if(id){selected=id;lessonIndex=byId[id].lesson;}
 const old=id?project.placements.find(p=>p.id===id):null;
 drag={id,element:el,start,old,pan:{...pan},matrix:$('#board-svg').getScreenCTM().inverse(),moved:false,pointer:event.pointerId};$('#canvas').setPointerCapture(event.pointerId);
});
$('#canvas').addEventListener('pointermove',event=>{
 if(!drag)return;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(drag.matrix);const dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.hypot(dx,dy)<3)return;drag.moved=true;$('#canvas').classList.add('is-dragging');
 if(drag.id&&drag.old){drag.x=drag.old.x+dx;drag.y=drag.old.y+dy;drag.element?.setAttribute('transform',`translate(${drag.x} ${drag.y}) rotate(${drag.old.rotation})`);}else{pan={x:Math.max(-500,Math.min(500,drag.pan.x-dx)),y:Math.max(-300,Math.min(300,drag.pan.y-dy))};renderCanvas();}
});
function endDrag(event){
 if(!drag)return;const current=drag;drag=null;$('#canvas').classList.remove('is-dragging');
 if(current.moved&&current.id){try{const x=Math.round(current.x/5)*5,y=Math.round(current.y/5)*5;commit(move(project,current.id,x,y),current.id+' moved.');}catch(e){toast(e.message);render();}}
 else if(current.id){render();}
 if($('#canvas').hasPointerCapture(event.pointerId))$('#canvas').releasePointerCapture(event.pointerId);
}
$('#canvas').addEventListener('pointerup',endDrag);$('#canvas').addEventListener('pointercancel',()=>{drag=null;$('#canvas').classList.remove('is-dragging');renderCanvas();});
$('#board-view').addEventListener('click',()=>{view='board';renderCanvas();renderGuide();});$('#die-view').addEventListener('click',()=>{view='die';renderCanvas();renderGuide();});
$('#undo-button').addEventListener('click',undo);$('#redo-button').addEventListener('click',redo);
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(2.5,zoom+.25);renderCanvas();});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.7,zoom-.25);renderCanvas();});$('#zoom-fit').addEventListener('click',()=>{zoom=1;pan={x:0,y:0};renderCanvas();});
$('#labels-toggle').addEventListener('change',event=>{labels=event.target.checked;renderCanvas();});
document.querySelectorAll('[data-overlay]').forEach(button=>button.addEventListener('click',()=>{overlay=button.dataset.overlay;renderCanvas();if(overlay!=='none')toast('Illustrative '+overlay+' relationships only; these are not routed copper traces.');}));
$('#mode-select').addEventListener('change',event=>{commit({...project,mode:event.target.value});toast(project.mode==='explore'?'Explore mode: drag installed parts to move; drag the background to pan.':'Guided placement uses suggested component positions.');});
$('#project-name').addEventListener('change',event=>commit({...project,name:event.target.value.trim()||'My first graphics card'}));
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{dock=button.dataset.tab;renderDock();}));
$('.dock-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=['overview','bom','checks','notes'];const i=tabs.indexOf(dock);dock=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(i+(event.key==='ArrowRight'?1:3))%4];renderDock();$('#tab-'+dock).focus();});
$('#guide-content').addEventListener('click',event=>{
 const answer=event.target.closest('[data-answer]');if(answer){const i=Number(answer.dataset.answer);commit({...project,answers:{...project.answers,[lessonIndex]:i}});if(event.detail===0){const target=i===groups[lessonIndex].quiz.correct?$('#guide-content [data-action="next"]:not([disabled])'):$('#guide-content [data-answer="'+i+'"]');target?.focus();}return;}
 const arch=event.target.closest('[data-arch-select]');if(arch){archSelected=arch.dataset.archSelect;renderCanvas();renderGuide();return;}
 const nudge=event.target.closest('[data-nudge-x]');if(nudge){const p=project.placements.find(p=>p.id===selected);if(p)try{commit(move(project,p.id,p.x+Number(nudge.dataset.nudgeX),p.y+Number(nudge.dataset.nudgeY)));}catch(e){toast(e.message);}return;}
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='place'){placeCurrent();if(event.detail===0)($('#guide-content [data-action="place"]:not([disabled])')||$('#guide-content .answer'))?.focus();}
 if(action==='return-board'){view='board';renderCanvas();renderGuide();}
 if(action==='next'&&lessonIndex<15){chooseGroup(lessonIndex+1);if(event.detail===0)$('#guide-content [data-action="place"]:not([disabled])')?.focus();}
 if(action==='previous'&&lessonIndex>0)chooseGroup(lessonIndex-1);
 if(action==='rotate'){const p=project.placements.find(p=>p.id===selected);if(p)try{commit(move(project,p.id,p.x,p.y,(p.rotation+90)%360),p.id+' rotated.');}catch(e){toast(e.message);}}
 if(action==='remove'&&selected){const result=remove(project,selected);selected=nextPart(result.project)?.id||'PCB1';lessonIndex=byId[selected].lesson;commit(result.project,result.removed.length+' dependent '+(result.removed.length===1?'assembly removed.':'assemblies removed.')+' Undo is available.');}
});
$('#dock-content').addEventListener('click',event=>{if(event.target.closest('[data-action="csv"]'))download(bomCsv(project),'text/csv;charset=utf-8','csv');});
$('#export-button').addEventListener('click',()=>{download(JSON.stringify(project,null,2),'application/json','json');toast('Project exported. The JSON file includes your assembly and knowledge-check progress.');});
$('#import-button').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{
 if(file.size>200000)throw new Error('Choose a GPU Builder JSON file smaller than 200 KB.');const next=validateProject(JSON.parse(await file.text()));past.push(structuredClone(project));future=[];project=next;reconcile();save();render();toast('Project imported. Undo returns to the previous workspace.');
 }catch(e){toast('Import failed: '+(e instanceof SyntaxError?'The file is not valid JSON.':e.message));}finally{event.target.value='';}});
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());$('#reset-button').addEventListener('click',()=>$('#reset-dialog').showModal());
document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('#confirm-reset').addEventListener('click',()=>{$('#reset-dialog').close();selected='PCB1';lessonIndex=0;view='board';zoom=1;pan={x:0,y:0};commit(createProject(),'New project started. Undo can restore the previous workspace.');});
document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select')||document.querySelector('dialog[open]'))return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}if(event.key==='Escape'){selected=null;renderCanvas();}});
render();if(loadWarning)toast(loadWarning);else if(!storageAvailable)toast('Export your work to keep a copy.');
// Expose a read-only snapshot for local QA and learner debugging, never mutation hooks.
Object.defineProperty(window,'gpuBuilderProject',{get:()=>structuredClone(project)});
