import {owner,store,failure,HttpError} from '@/lib/storage';
import {uploadPrefix} from '@/lib/uploads';
import {HTML_CHUNK_CHARS,MAX_HTML_PARTS} from '@/lib/limits';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 const user=await owner(req),b=await req.json(),prefix=uploadPrefix(user,b.uploadId);
 if(!Number.isInteger(b.index)||b.index<0||b.index>=MAX_HTML_PARTS||typeof b.text!=='string'||!b.text.length||b.text.length>HTML_CHUNK_CHARS)throw new HttpError(400,'Invalid upload chunk.');
 const result=await store().setJSON(prefix+b.index,{text:b.text,expires:Date.now()+3600000},{onlyIfNew:true});
 if(!result.modified)throw new HttpError(409,'Upload chunk already exists. Please retry the upload.');
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{
 const user=await owner(req),b=await req.json(),prefix=uploadPrefix(user,b.uploadId);
 await Promise.all(Array.from({length:MAX_HTML_PARTS},(_,i)=>store().delete(prefix+i)));
 return Response.json({ok:true});
}catch(e){return failure(e);}}
