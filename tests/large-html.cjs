const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const records=new Map();let serial=0;let signedIn=true;let accountId='owner';
const blobStore={
 async get(k){return records.get(k)?.value??null;},
 async getWithMetadata(k){const r=records.get(k);return r?{data:r.value,etag:r.etag}:null;},
 async set(k,value){records.set(k,{value,etag:String(++serial)});},
 async setJSON(k,value,opts={}){const old=records.get(k);if(opts.onlyIfNew&&old||opts.onlyIfMatch&&old?.etag!==opts.onlyIfMatch)return {modified:false};await this.set(k,value);return {modified:true};},
 async delete(k){records.delete(k);},
 async list({prefix}){return {blobs:[...records.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))};}
};
const cache={};
function load(name){const file=path.resolve(__dirname,'..',name);if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function req(n){if(n==='@netlify/blobs')return {getStore:()=>blobStore,getDeployStore:()=>blobStore};if(n==='@/lib/auth')return {currentAccount:async()=>signedIn?{userId:accountId}:null};if(n.startsWith('@/'))return load(n.slice(2)+'.ts');return require(n);}
 new Function('require','module','exports',code)(req,m,m.exports);return m.exports;
}
const uploads=load('app/api/uploads/route.ts'),projects=load('app/api/projects/route.ts'),project=load('app/api/projects/[id]/route.ts'),content=load('app/api/projects/[id]/content/route.ts');
let largest=0;const requests=[];
global.fetch=async(url,options={})=>{requests.push([url,options.method||'GET']);largest=Math.max(largest,Buffer.byteLength(options.body||''));const req=new Request('https://test.local'+url,{...options,headers:{...options.headers,origin:'https://test.local'}}),method=options.method||'GET';const id=url.split('/')[3];if(url.startsWith('/api/uploads'))return uploads[method](req);if(url==='/api/projects')return projects[method](req);if(url.includes('/content?'))return content.GET(req,{params:Promise.resolve({id})});return project[method](req,{params:Promise.resolve({id})});};
const {api,loadPageContent}=load('lib/project-client.ts');
const {allowedRequestOrigin}=load('lib/request-origin.ts');
process.env.STUDIO_ALLOWED_ORIGINS=JSON.stringify(['https://heisdanielwebdesk.netlify.app']);
const proxyRequest=(origin,extra={})=>new Request('http://localhost:3000/api/uploads',{method:'POST',headers:{...(origin?{origin}:{}),...extra}});
assert(allowedRequestOrigin(proxyRequest('https://heisdanielwebdesk.netlify.app')));
assert(!allowedRequestOrigin(proxyRequest('https://attacker.example')));
assert(!allowedRequestOrigin(proxyRequest('https://heisdanielwebdesk.netlify.app.attacker.example')));
assert(!allowedRequestOrigin(proxyRequest('null')));
assert(!allowedRequestOrigin(proxyRequest(null)));
assert(!allowedRequestOrigin(proxyRequest('https://attacker.example',{'x-forwarded-host':'attacker.example'})));

(async()=>{
 const html='<!doctype html>'+ 'x'.repeat(20_000_000-15);
 assert.equal(Buffer.byteLength(html),20_000_000);
 const created=await api('','POST',{name:'Large page',html});assert.equal(created.html,html);assert(!requests.some(([,method])=>method==='GET'));let loaded=await api('/'+created.id);assert.equal(loaded.html,html);
 loaded=await api('/'+created.id,'PATCH',{action:'publish',revision:loaded.revision,name:loaded.name,html});assert.equal(await loadPageContent(created.id,true),html);
 assert(largest<4_000_000);assert(![...records.keys()].some(k=>k.startsWith('uploads/')));
 await assert.rejects(()=>api('','POST',{name:'Oversize',html:html+'x'}),/20 MB/);
 const unicode='x'.repeat(499999)+'😀'+'é'.repeat(500000);const other=await api('','POST',{name:'Unicode',html:unicode});assert.equal((await api('/'+other.id)).html,unicode);
 // Server validation cannot be bypassed by uploading oversized UTF-8 chunks.
 const uploadId=crypto.randomUUID();for(let index=0;index<15;index++)await global.fetch('/api/uploads',{method:'POST',body:JSON.stringify({uploadId,index,text:'€'.repeat(500000)})});
 const bad=await projects.POST(new Request('https://test.local/api/projects',{method:'POST',headers:{origin:'https://test.local'},body:JSON.stringify({name:'Oversize',uploadId,parts:15})}));assert.equal(bad.status,400);
 const incomplete=await projects.POST(new Request('https://test.local/api/projects',{method:'POST',headers:{origin:'https://test.local'},body:JSON.stringify({name:'Missing',uploadId:crypto.randomUUID(),parts:1})}));assert.equal(incomplete.status,400);
 const child=await api('','POST',{name:'Contact',filename:'contact-form.html',workspaceId:created.id,html:'<h1>Contact</h1>'});
 const third=await api('','POST',{name:'About',filename:'about.html',workspaceId:child.id,html:'<h1>About</h1>'});
 assert.equal(child.workspaceId,created.id);assert.equal(third.workspaceId,created.id);
 assert.equal((await api('')).projects.filter(p=>p.workspaceId===created.id).length,3);
 await assert.rejects(()=>api('','POST',{name:'Duplicate',filename:'about.html',workspaceId:created.id,html:'<h1>Duplicate</h1>'}),/already has/);
 await assert.rejects(()=>api('','POST',{name:'Invalid',filename:'../escape.html',workspaceId:created.id,html:'<h1>Invalid</h1>'}),/filename/);
 accountId='second-user';
 await assert.rejects(()=>api('','POST',{name:'Unauthorized',filename:'hack.html',workspaceId:created.id,html:'<h1>Denied</h1>'}),/not found/);
 assert.deepEqual((await api('')).projects,[]);
 await assert.rejects(()=>api('/'+created.id),/not found/);
 await assert.rejects(()=>api('/'+created.id,'PATCH',{action:'save',revision:loaded.revision,name:'Hijack',html:'<p>Hijacked</p>'}),/not found/);
 await assert.rejects(()=>api('/'+created.id,'DELETE'),/not found/);
 await assert.rejects(()=>loadPageContent(created.id,true),/not found/);
 const second=await api('','POST',{name:'Second workspace',html:'<p>My private page</p>'});
 assert.equal((await api('')).projects.length,1);
 accountId='owner';await assert.rejects(()=>api('/'+second.id),/not found/);
 signedIn=false;assert.equal((await uploads.POST(new Request('https://test.local/api/uploads',{method:'POST',headers:{origin:'https://test.local'},body:'{}'}))).status,401);
 console.log('PASS: 20 MB import/reopen/save/publish; Unicode boundaries; bounded request sizes; cleanup; oversized and incomplete uploads; three-page workspaces and filenames; no redundant download on save; authentication gate; independent accounts and cross-account access denied.');
})().catch(e=>{console.error(e);process.exitCode=1;});
