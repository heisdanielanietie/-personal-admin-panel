const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),zlib=require('node:zlib');
const {JSDOM}=require(process.env.STUDIO_TEST_JSDOM||'jsdom');global.DOMParser=new JSDOM('').window.DOMParser;
function load(name){const m={exports:{}};new Function('require','exports',ts.transpileModule(fs.readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n==='./paths'?load('paths'):require(n),m.exports);return m.exports;}
const {zipFiles}=load('zip'),{readZip,importWebsiteZip}=load('zip-import');
const zip=async files=>zipFiles(files.map(([name,text])=>({name,text}))).arrayBuffer();
(async()=>{
const files=[['index.html','<link rel="stylesheet" href="css/main.css"><img src="images/photo.png"><a href="pages/about.html">About</a>'],['pages/about.html','<h1>About</h1><img src="../images/photo.png">'],['css/main.css','@import url(extra.css); body{background:url(../images/photo.png)}'],['css/extra.css','h1{color:red}'],['images/photo.png','test-image-bytes']];
const buffer=await zip(files),pages=await importWebsiteZip(buffer);assert.equal(pages.length,2);assert.equal(pages[1].filename,'pages/about.html');assert(pages[0].html.includes('data:image/png;base64,'));assert(pages[0].html.includes('color:red'));assert(pages[0].html.includes('pages/about.html'));assert(pages[1].html.includes('data:image/png'));
const badPath=await zip([['../escape.html','bad']]);await assert.rejects(()=>readZip(badPath),/unsafe/);
const missing=await zip([['index.html','<img src="missing.png">']]);await assert.rejects(()=>importWebsiteZip(missing),/Missing ZIP asset/);
const dup=await zip([['index.html','a'],['INDEX.html','b']]);await assert.rejects(()=>readZip(dup),/duplicate/);
const corrupt=buffer.slice(0);new Uint8Array(corrupt)[40]^=1;await assert.rejects(()=>readZip(corrupt),/damaged/);
// Generate a standard deflated ZIP from a stored fixture.
const original=new Uint8Array(await zip([['index.html','<h1>Compressed page</h1>']])),ov=new DataView(original.buffer),nl=ov.getUint16(26,true),len=ov.getUint32(22,true),raw=original.slice(30+nl,30+nl+len),compressed=zlib.deflateRawSync(raw),local=original.slice(0,30+nl),central=original.slice(30+nl+len,original.length-22),end=original.slice(-22);new DataView(local.buffer).setUint16(8,8,true);new DataView(local.buffer).setUint32(18,compressed.length,true);new DataView(central.buffer).setUint16(10,8,true);new DataView(central.buffer).setUint32(20,compressed.length,true);new DataView(end.buffer).setUint32(16,local.length+compressed.length,true);const deflated=Buffer.concat([local,compressed,central,end]);assert.equal((await importWebsiteZip(deflated.buffer.slice(deflated.byteOffset,deflated.byteOffset+deflated.byteLength))).length,1);
const bomb=await zip([['index.html','small']]);const bv=new DataView(bomb),e=bomb.byteLength-22,at=bv.getUint32(e+16,true);bv.setUint32(at+24,60_000_001,true);await assert.rejects(()=>readZip(bomb),/expands/);
console.log('PASS: stored/deflated ZIP import, nested CSS, image embedding, page folders, duplicates, traversal, missing files, CRC and expansion limits.');
})().catch(e=>{console.error(e);process.exitCode=1;});
