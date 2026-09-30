import { requireChatGPTUser } from '@/app/chatgpt-auth';
import {owned,readHtml} from '@/lib/storage';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
async function Published({id}:{id:string}){const user=await requireChatGPTUser(`/p/${id}`);const p=await owned(id,user.userId);if(!p.published_key)notFound();const html=await readHtml(p.published_key);return <main className="published-page"><div className="published-bar"><a href="/">← Daniel Studio</a><span>{p.name} · Private published copy</span></div><iframe title={p.name} sandbox="" srcDoc={html} style={{width:'100%',height:'calc(100dvh - 52px)',border:0,background:'white'}}/></main>;}
export default async function Page({params}:{params:Promise<{id:string}>}){return <Published id={(await params).id}/>;}
