import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!file.startsWith(root.endsWith(sep)?root:root+sep)||!(await stat(file)).isFile())throw new Error('Not found');
 const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);
}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}}).listen(4180,'127.0.0.1',()=>console.log('GPU Builder: http://localhost:4180'));
