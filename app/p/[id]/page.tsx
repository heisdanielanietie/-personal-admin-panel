import PublishedFrame from './published-frame';
import { requireAccount } from '@/lib/auth';
import {owned,readHtml} from '@/lib/storage';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
async function Published({id}:{id:string}){const user=await requireAccount(`/p/${id}`);const p=await owned(id,user.userId);if(!p.published_key)notFound();return <main className="published-page"><div className="published-bar"><a href="/">← DauVinci Studio</a><span>{p.name} · Private published copy</span></div><PublishedFrame id={id} name={p.name}/></main>;}
export default async function Page({params}:{params:Promise<{id:string}>}){return <Published id={(await params).id}/>;}
