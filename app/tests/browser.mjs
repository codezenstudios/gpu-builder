import {mkdirSync,writeFileSync} from 'node:fs';
export const base='http://localhost:4180';
export const dir=new URL('../../QA/',import.meta.url);
mkdirSync(dir,{recursive:true});
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function connect(){
 const targets=await(await fetch('http://127.0.0.1:9228/json/list')).json();
 const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();const errors=[],failed=[];
 socket.addEventListener('message',event=>{const x=JSON.parse(event.data);if(x.id){const p=pending.get(x.id);pending.delete(x.id);x.error?p.reject(new Error(JSON.stringify(x.error))):p.resolve(x.result);}else if(x.method==='Runtime.exceptionThrown')errors.push(x.params.exceptionDetails);else if(x.method==='Network.responseReceived'&&x.params.response.status>=400)failed.push(x.params.response);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw new Error(JSON.stringify(x.exceptionDetails));return x.result.value;};
 async function navigate(){await send('Page.navigate',{url:base});for(let i=0;i<60;i++){await wait(100);if(await evaluate('!!window.gpuBuilderProject'))return;}throw new Error('App did not initialize.');}
 async function screenshot(name){const x=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(new URL(name,dir),Buffer.from(x.data,'base64'));}
 await send('Runtime.enable');await send('Network.enable');await send('Page.enable');return {send,evaluate,navigate,screenshot,errors,failed,close:()=>socket.close()};
}
