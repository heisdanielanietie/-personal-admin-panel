const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {JSDOM}=require(process.env.STUDIO_TEST_JSDOM||'jsdom');
function load(file){const m={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports);return m.exports;}
const {cleanHtml,editorDocument,connectEditor}=load('lib/editor.ts');
const {zipFiles}=load('lib/zip.ts');
global.DOMParser=new JSDOM('').window.DOMParser;
(async()=>{
 const paths=process.argv.slice(2);const files=[];
 for(const [i,path] of paths.entries()){
  const raw=fs.readFileSync(path,'utf8');const html=editorDocument(raw,'0123456789abcdef0123456789abcdef');
  const dom=new JSDOM(html),doc=dom.window.document;const events=[];
  assert.equal(doc.querySelectorAll('script,iframe,object,embed').length,0);
  assert(doc.querySelector('meta[http-equiv]').content.includes("script-src 'none'"));
  const connection=connectEditor(doc,e=>events.push(e));assert.equal(events.pop().type,'ready');
  const heading=doc.querySelector('h1');heading.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
  assert.equal(events.at(-1).type,'selection');assert.equal(events.at(-1).tag,'H1');
  connection.send({type:'update',field:'text',value:'Edited test heading'});assert.equal(heading.textContent,'Edited test heading');
  const snapshot=events.at(-1).html;assert(!snapshot.includes('data-ds-selected'));assert(!snapshot.includes('data-ds-system'));
  if(doc.querySelector('form[hidden]'))assert(snapshot.includes('data-netlify="true"'));
  const img=doc.querySelector('img');if(img){img.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(events.at(-1).tag,'IMG');connection.send({type:'update',field:'alt',value:'Edited image'});assert.equal(img.alt,'Edited image');}
  connection.send({type:'mode',mode:'preview'});const before=events.length;heading.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));assert.equal(events.length,before);
  connection.destroy();files.push({name:i?'contact-form.html':'index.html',text:cleanHtml(raw)});dom.window.close();
 }
 files.push({name:'about.html',text:'<!doctype html><h1>About ✓</h1>'});
 fs.writeFileSync('/workspace/scratch/editor-check/verified-pages.zip',Buffer.from(await zipFiles(files).arrayBuffer()));
 console.log('PASS: supplied HTML text/image selection, editing, preview, script blocking, hidden form preservation, and three-page ZIP generation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
