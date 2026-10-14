// Execute the actual dialog-opening function with setter spies. No auth or network needed.
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/studio.tsx','utf8'),ast=ts.createSourceFile('studio.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let fn;
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='showImport')fn=node;ts.forEachChild(node,visit);}visit(ast);assert(fn);
const code=ts.transpileModule(fn.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const fresh of [true,false]){const calls=[],names=['setNewWorkspace','setName','setPendingPages','setFileName','setFileHtml','setAdd'],setters=names.map(name=>value=>calls.push([name,value]));const open=new Function(...names,code+';return showImport;')(...setters);assert.doesNotThrow(()=>open(fresh));assert.deepEqual(calls,[['setNewWorkspace',fresh],['setName',''],['setPendingPages',[]],['setFileName',''],['setFileHtml',''],['setAdd',true]]);}
console.log('PASS: Add website and Add HTML pages reset import fields, preserve the requested destination and open the upload dialog without recursion.');
