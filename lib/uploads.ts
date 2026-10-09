import {store,HttpError,validateHtml} from '@/lib/storage';
import {HTML_CHUNK_CHARS,MAX_HTML_PARTS} from '@/lib/limits';
export function uploadPrefix(user:string,id:unknown){
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))throw new HttpError(400,'Invalid upload.');
 return `uploads/${user}/${id}/`;
}
export async function resolveHtml(user:string,b:{html?:unknown;uploadId?:unknown;parts?:unknown}){
 if(b.uploadId===undefined)return validateHtml(b.html);
 const prefix=uploadPrefix(user,b.uploadId),parts=b.parts;
 if(typeof parts!=='number'||!Number.isInteger(parts)||parts<1||parts>MAX_HTML_PARTS)throw new HttpError(400,'Invalid upload size.');
 const chunks=await Promise.all(Array.from({length:parts},(_,i)=>store().get(prefix+i,{type:'json'})));
 if(chunks.some(c=>!c||typeof c.text!=='string'||c.text.length>HTML_CHUNK_CHARS||c.expires<Date.now()))throw new HttpError(400,'Upload incomplete or expired. Please try again.');
 return validateHtml(chunks.map(c=>c!.text).join(''));
}
export async function projectData(p:import('@/lib/storage').ProjectRow){
 const {brief,readHtml}=await import('@/lib/storage');
 const html=await readHtml(p.draft_key);
 if(html.length<=HTML_CHUNK_CHARS)return {...brief(p),html};
 return {...brief(p),htmlVersion:p.draft_key.split('/').pop(),htmlParts:Math.ceil(html.length/HTML_CHUNK_CHARS)};
}
