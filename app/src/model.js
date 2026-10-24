import {parts,byId,groups} from './catalog.js';
export const VERSION=1;
export function createProject(){return {version:VERSION,name:'My first graphics card',mode:'guided',placements:[],answers:{}};}
export const installed=(project,id)=>project.placements.some(p=>p.id===id);
export function missing(project,id){return byId[id].requires.filter(req=>!installed(project,req));}
export function nextPart(project){return parts.find(p=>!installed(project,p.id))||null;}
export function currentLesson(project){return nextPart(project)?.lesson??15;}
export function memoryStats(project){const count=project.placements.filter(p=>byId[p.id].kind==='memory').length;return {count,capacity:count*2,bits:count*32,bandwidth:count*32*16/8};}
function bounds(p){const def=byId[p.id];const rotated=p.rotation%180!==0;return {x:p.x,y:p.y,w:rotated?def.h:def.w,h:rotated?def.w:def.h};}
export function placementProblem(project,placement,ignoreId=null){
 const def=byId[placement.id];if(!def)return 'Unknown component.';
 if(!Number.isFinite(placement.x)||!Number.isFinite(placement.y)||![0,90,180,270].includes(placement.rotation))return 'Invalid placement.';
 if(def.kind==='pcb')return placement.x===500&&placement.y===270&&placement.rotation===0?null:'The board is the fixed mechanical reference.';
 const b=bounds(placement),edge=def.category==='Interfaces'||def.kind==='power';
 if(b.x-b.w/2<(edge?50:112)||b.x+b.w/2>950||b.y-b.h/2<90||b.y+b.h/2>(def.kind==='pcie'?469:445))return 'Keep the component inside the board envelope.';
 if(['heatsink','fan'].includes(def.kind))return null;
 for(const other of project.placements){if(other.id===ignoreId||other.id===placement.id||['pcb','heatsink','fan'].includes(byId[other.id].kind))continue;
  const a=bounds(other);if(Math.abs(a.x-b.x)<(a.w+b.w)/2+3&&Math.abs(a.y-b.y)<(a.h+b.h)/2+3)return 'This overlaps '+other.id+'. Leave space between packages.';
 }
 return null;
}
export function place(project,id,position){
 const def=byId[id];if(!def)throw new Error('Unknown component.');if(installed(project,id))throw new Error(id+' is already placed.');
 const needs=missing(project,id);if(needs.length)throw new Error('Place '+needs.join(', ')+' first.');
 const placement={id,x:position?.x??def.x,y:position?.y??def.y,rotation:0};
 const problem=placementProblem(project,placement);if(problem)throw new Error(problem);
 return {...project,placements:[...project.placements,placement]};
}
export function move(project,id,x,y,rotation){
 const old=project.placements.find(p=>p.id===id);if(!old)throw new Error('Select a placed component.');if(project.mode!=='explore')throw new Error('Switch to Explore to change the layout.');
 const replacement={...old,x,y,rotation:rotation??old.rotation};const problem=placementProblem(project,replacement,id);if(problem)throw new Error(problem);
 return {...project,placements:project.placements.map(p=>p.id===id?replacement:p)};
}
export function remove(project,id){
 const dependent=new Set([id]);let changed=true;
 while(changed){changed=false;for(const p of parts)if(!dependent.has(p.id)&&p.requires.some(req=>dependent.has(req))){dependent.add(p.id);changed=true;}}
 const remaining=project.placements.filter(p=>!dependent.has(p.id));const removed=project.placements.filter(p=>dependent.has(p.id)).map(p=>p.id);
 const answers={...project.answers};for(const p of parts.filter(p=>dependent.has(p.id)))delete answers[p.lesson];
 return {project:{...project,placements:remaining,answers},removed};
}
export function checks(project){
 const count=project.placements.length;const complete=count===parts.length;
 const invalid=project.placements.filter(p=>placementProblem(project,p,p.id));
 const dependencyErrors=project.placements.filter(p=>missing(project,p.id).length);
 const memory=memoryStats(project);
 return [
  {label:'Board foundation',ok:installed(project,'PCB1'),detail:installed(project,'PCB1')?'PCB1 establishes the mechanical reference.':'Place PCB1 to begin.'},
  {label:'Component dependencies',ok:dependencyErrors.length===0&&count>0,detail:dependencyErrors.length?'Some prerequisites are missing.':count?'All installed parts have their modeled prerequisites.':'No components placed yet.'},
  {label:'Placement envelopes',ok:invalid.length===0&&count>0,detail:invalid.length?'Review '+invalid.map(p=>p.id).join(', ')+'.':count?'No modeled package overlaps or boundary errors.':'Place components to check their envelopes.'},
  {label:'Local memory interface',ok:memory.count===4,detail:`${memory.count}/4 packages · ${memory.bits}-bit modeled bus · ${memory.capacity} GB.`},
  {label:'Cooling assembly',ok:installed(project,'HS1')&&installed(project,'FAN1'),detail:installed(project,'FAN1')?'Heatsink and fan are installed.':'Install the heatsink and fan after their prerequisites.'},
  {label:'Assembly completeness',ok:complete,detail:`${count}/${parts.length} assemblies placed. These checks are educational.`}
 ];
}
export function validateProject(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==VERSION)throw new Error('This is not a supported GPU Builder project.');
 if(typeof input.name!=='string'||input.name.length<1||input.name.length>80)throw new Error('Project name must be 1–80 characters.');
 if(!['guided','explore'].includes(input.mode)||!Array.isArray(input.placements)||input.placements.length>parts.length)throw new Error('Invalid project structure.');
 const clean=createProject();clean.name=input.name;clean.mode=input.mode;
 const seen=new Set();
 for(const value of input.placements){
  if(!value||!byId[value.id]||seen.has(value.id))throw new Error('Unknown or duplicate component.');
  if(!Number.isFinite(value.x)||!Number.isFinite(value.y)||![0,90,180,270].includes(value.rotation))throw new Error('Invalid component coordinates.');
  seen.add(value.id);clean.placements.push({id:value.id,x:value.x,y:value.y,rotation:value.rotation});
 }
 for(const p of clean.placements){if(missing(clean,p.id).length)throw new Error('The project has missing component dependencies.');const problem=placementProblem(clean,p,p.id);if(problem)throw new Error(problem);}
 if(input.answers!==undefined&&(!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers)))throw new Error('Invalid lesson answers.');
 for(const [key,value] of Object.entries(input.answers||{})){
  const i=Number(key);if(!Number.isInteger(i)||i<0||i>=groups.length||String(i)!==key||!Number.isInteger(value)||value<0||value>=groups[i].quiz.answers.length)throw new Error('Invalid lesson answer.');
  if(!groups[i].parts.every(p=>installed(clean,p.id)))throw new Error('An answer belongs to an incomplete assembly step.');clean.answers[key]=value;
 }
 return clean;
}
export function bomCsv(project){
 const escape=value=>'"'+String(value).replaceAll('"','""')+'"';
 return [['Reference','Component','Category','Quantity','Status'],...parts.map(p=>[p.id,p.name,p.category,p.id==='C3–C10'?8:1,installed(project,p.id)?'Placed':'Not placed'])].map(row=>row.map(escape).join(',')).join('\r\n');
}
