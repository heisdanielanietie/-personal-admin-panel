import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth";
import Studio from "../studio";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Private Workspace | DauVinci Studio",robots:{index:false,follow:false,noarchive:true}};
export default async function WorkspacePage(){await requireAccount("/workspace");return <Studio/>}