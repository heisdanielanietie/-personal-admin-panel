const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
let token=null,reply=null,status=200,fail=false,calls=0;
process.env.STUDIO_IDENTITY_URL='https://identity.example.test/.netlify/identity';
global.fetch=async(url,options)=>{
 calls++;assert.equal(url,process.env.STUDIO_IDENTITY_URL+'/user');
 assert.equal(options.headers.Authorization,'Bearer '+token);
 assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');
 if(fail)throw new Error('offline');
 return {status,ok:status===200,json:async()=>reply};
};
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(name=>name==='next/headers'?{cookies:async()=>({get:()=>token?{value:token}:undefined})}:{redirect:()=>{throw new Error('redirect');}},mod,mod.exports);
(async()=>{
 assert.equal((await mod.exports.accountSession()).status,401);assert.equal(calls,0);
 token='synthetic-test-token';
 for(const email of ['first@example.test','second@example.test']){
  reply={id:email,email,confirmed_at:'2026-10-09'};
  assert.equal((await mod.exports.currentAccount()).userId,email);
 }
 reply={id:'unconfirmed',email:'unconfirmed@example.test'};
 assert.equal((await mod.exports.accountSession()).status,403);
 status=401;assert.equal(await mod.exports.currentAccount(),null);
 status=500;assert.equal((await mod.exports.accountSession()).status,503);
 status=200;reply={};assert.equal((await mod.exports.accountSession()).status,503);
 fail=true;assert.equal((await mod.exports.accountSession()).status,503);
 console.log('PASS: Next request cookies, verified Identity records, missing/invalid/unconfirmed sessions, upstream failure, and distinct errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
