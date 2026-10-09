import {MAX_HTML_BYTES,HTML_CHUNK_CHARS,MAX_HTML_PARTS} from '@/lib/limits';
async function request(url:string,method='GET',body?:unknown){
 const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>({error:'The request failed. Please try again.'}));
 if(!r.ok)throw new Error(data.error||'Something went wrong. Please try again.');
 return data;
}
export async function loadPageContent(id:string,published=false,version?:string,count?:number){
 const base='/api/projects/'+encodeURIComponent(id)+'/content?published='+(published?'1':'0');
 const first=await request(base+'&part=0'+(version?'&version='+encodeURIComponent(version):''));
 if(!Number.isInteger(first.parts)||first.parts<1||first.parts>MAX_HTML_PARTS||(count&&count!==first.parts))throw new Error('The page changed. Please reopen it.');
 const chunks=[first.text];
 for(let i=1;i<first.parts;i++)chunks.push((await request(base+'&part='+i+'&version='+encodeURIComponent(first.version))).text);
 return chunks.join('');
}
export async function api(path:string,method='GET',body?:any){
 let uploadId:string|undefined;
 try{
  let payload=body;
  if(typeof body?.html==='string'){
   if(new TextEncoder().encode(body.html).length>MAX_HTML_BYTES)throw new Error('The page is too large. Use a page no larger than 20 MB.');
   if(body.html.length>HTML_CHUNK_CHARS){
    uploadId=crypto.randomUUID();
    const parts=Math.ceil(body.html.length/HTML_CHUNK_CHARS);
    for(let index=0;index<parts;index++)await request('/api/uploads','POST',{uploadId,index,text:body.html.slice(index*HTML_CHUNK_CHARS,(index+1)*HTML_CHUNK_CHARS)});
    const {html,...rest}=body;payload={...rest,uploadId,parts};
   }
  }
  const data=await request('/api/projects'+path,method,payload);
  if(data.htmlParts)data.html=await loadPageContent(data.id,false,data.htmlVersion,data.htmlParts);
  return data;
 }finally{
  if(uploadId)await request('/api/uploads','DELETE',{uploadId}).catch(()=>{});
 }
}
