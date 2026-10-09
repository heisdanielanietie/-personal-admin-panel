import {MAX_HTML_BYTES} from '@/lib/limits';
import {getStore,getDeployStore} from '@netlify/blobs';
import {currentOwner} from '@/lib/auth';
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export function store(){return process.env.CONTEXT==='production'?getStore({name:'daniel-studio',consistency:'strong'}):getDeployStore({name:'daniel-studio',consistency:'strong'});}
export async function owner(request?:Request){const u=await currentOwner();if(!u)throw new HttpError(401,'Please sign in with the workspace owner account.');if(request&&request.method!=='GET'){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new HttpError(403,'This request is not allowed.');}return u.userId;}
export function failure(e:unknown){console.error(e);return Response.json({error:e instanceof HttpError?e.message:'Your changes could not be saved. Please try again.'},{status:e instanceof HttpError?e.status:503,headers:{'Cache-Control':'no-store'}});}
export function validateHtml(h:unknown):string{if(typeof h!=='string'||h.length<10)throw new HttpError(400,'Please choose a valid HTML page.');if(new TextEncoder().encode(h).length>MAX_HTML_BYTES)throw new HttpError(400,'The page is too large. Use a page no larger than 20 MB.');return h;}
export function validateName(n:unknown){if(typeof n!=='string'||!n.trim()||n.length>80)throw new HttpError(400,'Use a website name of 1–80 characters.');return n.trim();}
export type ProjectRow={id:string;owner:string;name:string;draft_key:string;published_key:string|null;previous_key:string|null;revision:number;updated_at:string;published_at:string|null;deleted?:boolean};
export function recordKey(user:string,id:string){if(!/^[0-9a-f-]{36}$/i.test(id))throw new HttpError(404,'Website not found.');return `projects/${user}/${id}.json`;}
export async function ownedVersion(id:string,user:string){const found=await store().getWithMetadata(recordKey(user,id),{type:'json'});if(!found?.data||found.data.deleted||found.data.owner!==user)throw new HttpError(404,'Website not found.');if(!found.etag)throw new HttpError(503,'The saved version cannot be verified. Try again.');return {project:found.data as ProjectRow,etag:found.etag};}
export async function owned(id:string,user:string){return (await ownedVersion(id,user)).project;}
export async function readHtml(key:string){const html=await store().get(key,{type:'text'});if(!html)throw new HttpError(503,'This page is temporarily unavailable.');return html;}
export async function writeRecord(p:ProjectRow,etag?:string){const result=await store().setJSON(recordKey(p.owner,p.id),p,etag?{onlyIfMatch:etag}:{onlyIfNew:true});if(!result.modified)throw new HttpError(409,'This website changed in another window. Reopen it before saving.');}
export function brief(p:ProjectRow){return {id:p.id,name:p.name,revision:p.revision,updatedAt:p.updated_at,publishedAt:p.published_at,published:!!p.published_key,hasChanges:p.draft_key!==p.published_key,canRestore:!!p.previous_key};}
