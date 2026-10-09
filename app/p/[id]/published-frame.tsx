'use client';
import {useEffect,useState} from 'react';
import {loadPageContent} from '@/lib/project-client';
export default function PublishedFrame({id,name}:{id:string;name:string}){
 const [html,setHtml]=useState<string|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;loadPageContent(id,true).then(h=>{if(active)setHtml(h);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 if(error)return <p role="alert">{error}</p>;
 if(html===null)return <p>Loading your page…</p>;
 return <iframe title={name} sandbox="" srcDoc={html} style={{width:'100%',height:'calc(100dvh - 52px)',border:0,background:'white'}}/>;
}
