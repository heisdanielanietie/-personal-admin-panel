import {owner,owned,readHtml,failure,HttpError} from '@/lib/storage';
import {HTML_CHUNK_CHARS} from '@/lib/limits';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{
 const p=await owned((await ctx.params).id,await owner()),q=new URL(req.url).searchParams;
 const key=q.get('published')==='1'?p.published_key:p.draft_key;
 if(!key)throw new HttpError(404,'No published page yet.');
 const version=key.split('/').pop();
 if(q.has('version')&&q.get('version')!==version)throw new HttpError(409,'The page changed. Please reopen it.');
 const part=Number(q.get('part')||0),html=await readHtml(key),parts=Math.ceil(html.length/HTML_CHUNK_CHARS);
 if(!Number.isInteger(part)||part<0||part>=parts)throw new HttpError(400,'Invalid page chunk.');
 return Response.json({text:html.slice(part*HTML_CHUNK_CHARS,(part+1)*HTML_CHUNK_CHARS),parts,version},{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e);}}
