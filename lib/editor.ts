export const sampleHtml=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My creative portfolio</title><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#172039;background:#fff}nav{display:flex;justify-content:space-between;align-items:center;padding:28px 7%;border-bottom:1px solid #e8ebf2}nav strong{font-size:21px}a{color:inherit;text-decoration:none}nav a{font-size:14px}header{padding:80px 7%;background:#edf2ff}header small{font-size:13px;letter-spacing:2px;color:#275cf4}h1{font-size:clamp(36px,6vw,74px);line-height:1.05;letter-spacing:-3px;max-width:800px;margin:24px 0}header p{font-size:19px;line-height:1.6;max-width:530px;color:#536078}.button{display:inline-block;background:#275cf4;color:white;padding:16px 24px;border-radius:8px;margin-top:18px;font-weight:bold}section{padding:52px 7%}h2{font-size:32px;letter-spacing:-1px;margin-top:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.card{background:#f5f7fb;padding:26px;border-radius:12px}.card b{font-size:20px}.card p{line-height:1.6;color:#536078}footer{padding:30px 7%;border-top:1px solid #e8ebf2;color:#536078}@media(max-width:580px){.grid{grid-template-columns:1fr}header{padding-top:50px}h1{letter-spacing:-1px}}</style></head><body><nav><strong>Daniel.</strong><a href="#contact">Let's work together ↗</a></nav><header><small>DESIGN · WEB · IDEAS</small><h1>Good ideas deserve<br>a great presence.</h1><p>I create thoughtful designs and websites that help brands stand out and connect with people.</p><a class="button" href="#contact">Let's create something</a></header><section><h2>What I can help you with</h2><div class="grid"><div class="card"><b>Brand identity</b><p>Visual identities that make a memorable first impression.</p></div><div class="card"><b>Graphic design</b><p>Clear, engaging designs for your next big idea.</p></div><div class="card"><b>Web design</b><p>Responsive websites that put your business first.</p></div></div></section><section id="contact"><h2>Have a project in mind?</h2><p>Tell me what you are working on. Let's bring it to life.</p><a class="button" href="mailto:hello@example.com">Get in touch</a></section><footer><p>Your name · Creative portfolio</p></footer></body></html>`;
export function safeUrl(s:string,image=false){if(image&&/^data:image\/(png|jpeg|webp|gif);base64,/i.test(s))return true;if(!image&&/^(?:\.\/)?[a-zA-Z0-9][a-zA-Z0-9_.() -]*\.html?(?:[?#].*)?$/i.test(s))return true;return /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(s);}
export function cleanHtml(raw:string){const doc=new DOMParser().parseFromString(raw,'text/html');doc.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv],link[rel="import"]').forEach(e=>e.remove());doc.querySelectorAll('*').forEach(el=>{for(const a of Array.from(el.attributes)){if(/^on/i.test(a.name)||a.name==='srcdoc'||a.name.startsWith('data-ds')||a.name==='nonce')el.removeAttribute(a.name);if(['href','src','action','formaction','xlink:href'].includes(a.name)&&/^\s*(javascript|vbscript|data:text\/html):/i.test(a.value))el.removeAttribute(a.name);}});return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML;}
export function editorDocument(html:string,token:string){
 const doc=new DOMParser().parseFromString(cleanHtml(html),'text/html');
 const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';
 policy.content="default-src https: data: blob:; script-src 'none'; style-src 'unsafe-inline' https:; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; connect-src 'none'";
 policy.setAttribute('data-ds-system','');doc.head.prepend(policy);
 const style=doc.createElement('style');style.setAttribute('data-ds-system','');
 style.textContent='[data-ds-hover]{outline:2px dashed #275cf4!important;outline-offset:4px;cursor:pointer!important}[data-ds-selected]{outline:2px solid #275cf4!important;outline-offset:5px}';doc.head.append(style);
 return '<!DOCTYPE html>'+doc.documentElement.outerHTML;
}

// Runs in the trusted parent app. The imported frame has no allow-scripts permission.
export function connectEditor(doc:Document,emit:(data:any)=>void){
 let selected:HTMLElement|null=null,mode='edit';
 const pick=(target:EventTarget|null)=>{
  const node=target as Node|null;
  const element=node?.nodeType===1?node as Element:node?.parentElement;
  return element?.closest<HTMLElement>('img,h1,h2,h3,h4,h5,h6,p,a,button,li,span,strong,b,small,label,blockquote,figcaption')||null;
 };
 const snapshot=()=>{
  const copy=doc.documentElement.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[data-ds-system]').forEach(e=>e.remove());
  copy.querySelectorAll('[data-ds-hover],[data-ds-selected]').forEach(e=>{e.removeAttribute('data-ds-hover');e.removeAttribute('data-ds-selected');});
  emit({type:'changed',html:'<!DOCTYPE html>\n'+copy.outerHTML});
 };
 const info=()=>{if(!selected)return;const c=doc.defaultView!.getComputedStyle(selected);emit({type:'selection',tag:selected.tagName,text:selected.textContent||'',href:selected.getAttribute('href')||'',src:selected.getAttribute('src')||'',alt:selected.getAttribute('alt')||'',color:c.color,fontSize:parseInt(c.fontSize)||16});};
 const hover=(e:MouseEvent)=>{if(mode!=='edit')return;doc.querySelector('[data-ds-hover]')?.removeAttribute('data-ds-hover');pick(e.target)?.setAttribute('data-ds-hover','');};
 const click=(e:MouseEvent)=>{
  // Keep imported links from navigating away from the editor, including Preview.
  if((e.target as Element)?.closest?.('a'))e.preventDefault();
  if(mode!=='edit')return;e.preventDefault();e.stopPropagation();const el=pick(e.target);if(!el)return;
  selected?.removeAttribute('data-ds-selected');selected=el;selected.setAttribute('data-ds-selected','');info();
 };
 const submit=(e:Event)=>e.preventDefault();
 doc.addEventListener('mouseover',hover);doc.addEventListener('click',click,true);doc.addEventListener('submit',submit);
 const send=(d:any)=>{
  if(d.type==='mode'){mode=d.mode;doc.querySelectorAll('[data-ds-hover],[data-ds-selected]').forEach(e=>{e.removeAttribute('data-ds-hover');e.removeAttribute('data-ds-selected');});return;}
  if(d.type==='update'&&selected){if(d.field==='text')selected.textContent=d.value;else if(['href','src','alt'].includes(d.field))selected.setAttribute(d.field,d.value);else if(d.field==='color')selected.style.color=d.value;else if(d.field==='fontSize')selected.style.fontSize=d.value+'px';snapshot();}
  if(d.type==='background'){doc.body.style.backgroundColor=d.value;snapshot();}
  if(d.type==='section'){const s=doc.createElement('section');s.style.cssText='padding:48px 7%;';const h=doc.createElement('h2');h.textContent='Your new section';const p=doc.createElement('p');p.textContent='Click this text to tell your story.';s.append(h,p);const f=doc.querySelector('footer');if(f)f.before(s);else doc.body.append(s);s.scrollIntoView?.({behavior:'smooth'});snapshot();}
  if(d.type==='image'){const i=doc.createElement('img');i.src=d.value;i.alt='Describe your image';i.style.cssText='display:block;max-width:86%;height:auto;margin:32px auto;border-radius:12px';const f=doc.querySelector('footer');if(f)f.before(i);else doc.body.append(i);i.scrollIntoView?.({behavior:'smooth'});snapshot();}
 };
 emit({type:'ready'});
 return {send,destroy(){doc.removeEventListener('mouseover',hover);doc.removeEventListener('click',click,true);doc.removeEventListener('submit',submit);}};
}
