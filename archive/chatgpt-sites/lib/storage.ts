import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function db(){ if(!env.DB)throw new Error('Database unavailable');return env.DB; }
export function bucket(){const b=(env as unknown as {BUCKET:R2Bucket}).BUCKET;if(!b)throw new Error('Storage unavailable');return b;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export async function owner(request?:Request){const u=await getChatGPTUser();if(!u)throw new HttpError(401,'Please sign in again.');if(request && request.method!=='GET'){const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)throw new HttpError(403,'This request is not allowed.');}return u.userId;}
export function failure(e:unknown){console.error(e);return Response.json({error:e instanceof HttpError?e.message:'Your changes could not be saved. Please try again.'},{status:e instanceof HttpError?e.status:503});}
export function validateHtml(h:unknown):string{if(typeof h!=='string'||h.length<10)throw new HttpError(400,'Please choose a valid HTML page.');if(new TextEncoder().encode(h).length>3_000_000)throw new HttpError(400,'The page is too large. Use a page smaller than 3 MB.');return h;}
export function validateName(n:unknown){if(typeof n!=='string'||!n.trim()||n.length>80)throw new HttpError(400,'Use a website name of 1–80 characters.');return n.trim();}
export type ProjectRow={id:string;owner:string;name:string;draft_key:string;published_key:string|null;previous_key:string|null;revision:number;updated_at:string;published_at:string|null};
export async function owned(id:string,user:string){const p=await db().prepare('SELECT * FROM projects WHERE id=? AND owner=?').bind(id,user).first<ProjectRow>();if(!p)throw new HttpError(404,'Website not found.');return p;}
export async function readHtml(key:string){const o=await bucket().get(key);if(!o)throw new HttpError(503,'This page is temporarily unavailable. Please try again.');return o.text();}
export function brief(p:ProjectRow){return {id:p.id,name:p.name,revision:p.revision,updatedAt:p.updated_at,publishedAt:p.published_at,published:!!p.published_key,hasChanges:p.draft_key!==p.published_key,canRestore:!!p.previous_key};}
