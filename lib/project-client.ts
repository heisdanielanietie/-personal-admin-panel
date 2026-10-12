import {MAX_HTML_BYTES,HTML_CHUNK_CHARS,MAX_HTML_PARTS} from '@/lib/limits';
export type Progress=(message:string)=>void;
async function request(url:string,method='GET',body?:unknown){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 try{
  const r=await fetch(url,{method,signal:controller.signal,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await r.json().catch(()=>({error:'The request failed. Please try again.'}));
  if(!r.ok)throw new Error(data.error||'Something went wrong. Please try again.');return data;
 }catch(e){if(controller.signal.aborted)throw new Error('The request timed out. Check your connection, then reopen your workspace to see whether the page was saved.');throw e;}finally{clearTimeout(timer);}
}
// Bounded batches wait for all in-flight requests before cleaning upload chunks.
async function batches(count:number,fn:(index:number)=>Promise<void>){
 for(let start=0;start<count;start+=4){const results=await Promise.allSettled(Array.from({length:Math.min(4,count-start)},(_,i)=>fn(start+i)));const failure=results.find(r=>r.status==='rejected');if(failure?.status==='rejected')throw failure.reason;}
}
export async function loadPageContent(id:string,published=false,version?:string,count?:number,progress?:Progress){
 const base='/api/projects/'+encodeURIComponent(id)+'/content?published='+(published?'1':'0');
 const first=await request(base+'&part=0'+(version?'&version='+encodeURIComponent(version):''));
 if(!Number.isInteger(first.parts)||first.parts<1||first.parts>MAX_HTML_PARTS||(count&&count!==first.parts))throw new Error('The page changed. Please reopen it.');
 const chunks=new Array<string>(first.parts);chunks[0]=first.text;let done=1;
 await batches(first.parts-1,async i=>{chunks[i+1]=(await request(base+'&part='+(i+1)+'&version='+encodeURIComponent(first.version))).text;progress?.('Opening page '+Math.round(++done/first.parts*100)+'%');});
 return chunks.join('');
}
export async function api(path:string,method='GET',body?:any,progress?:Progress){
 let uploadId:string|undefined;
 try{
  let payload=body;
  if(typeof body?.html==='string'){
   if(new TextEncoder().encode(body.html).length>MAX_HTML_BYTES)throw new Error('The page is too large. Use a page no larger than 20 MB.');
   if(body.html.length>HTML_CHUNK_CHARS){
    uploadId=crypto.randomUUID();const parts=Math.ceil(body.html.length/HTML_CHUNK_CHARS);let done=0;
    await batches(parts,async index=>{await request('/api/uploads','POST',{uploadId,index,text:body.html.slice(index*HTML_CHUNK_CHARS,(index+1)*HTML_CHUNK_CHARS)});progress?.('Uploading '+Math.round(++done/parts*100)+'%');});
    const {html,...rest}=body;payload={...rest,uploadId,parts};
   }
  }
  progress?.(method==='GET'?'Opening page…':'Saving page…');
  const data=await request('/api/projects'+path,method,payload);
  // The server stores this exact validated HTML. No need to download it again.
  if(typeof body?.html==='string'&&method!=='GET')data.html=body.html;
  else if(data.htmlParts)data.html=await loadPageContent(data.id,false,data.htmlVersion,data.htmlParts,progress);
  return data;
 }finally{
  if(uploadId)void request('/api/uploads','DELETE',{uploadId}).catch(()=>{});
 }
}
