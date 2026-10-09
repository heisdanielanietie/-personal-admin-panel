const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
let user=null;
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(name=>name==='@netlify/identity'?{getUser:async()=>user}:{redirect:()=>{throw new Error('redirect');}},mod,mod.exports);
(async()=>{
 const {handler}=await import('../netlify/functions/identity-validate.mjs');
 for(const email of ['first@example.test','second@example.test']){
  assert.equal((await handler({body:JSON.stringify({user:{email}})})).statusCode,200);
  user={id:email,email,confirmedAt:'2026-10-09'};
  assert.equal((await mod.exports.currentAccount()).userId,email);
 }
 user={id:'unconfirmed',email:'unconfirmed@example.test'};assert.equal(await mod.exports.currentAccount(),null);
 user=null;assert.equal(await mod.exports.currentAccount(),null);
 assert.equal((await handler({body:'{}'})).statusCode,400);
 console.log('PASS: public registration, multiple verified users, and unauthenticated/unconfirmed access denied.');
})().catch(e=>{console.error(e);process.exitCode=1;});
