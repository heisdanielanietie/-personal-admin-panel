import type { Metadata } from "next";
import PublishedFrame from "./published-frame";
import { requireAccount } from "@/lib/auth";
import { owned } from "@/lib/storage";
import { notFound } from "next/navigation";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Private published copy | DauVinci Studio",robots:{index:false,follow:false,noarchive:true}};
async function Published({id}:{id:string}){const user=await requireAccount(`/p/${id}`);const project=await owned(id,user.userId);if(!project.published_key)notFound();return <main className="published-page"><div className="published-bar"><a href="/workspace">← DauVinci Studio workspace</a><span>{project.name} · Private published copy</span></div><PublishedFrame id={id} name={project.name}/></main>}
export default async function Page({params}:{params:Promise<{id:string}>}){return <Published id={(await params).id}/>}
