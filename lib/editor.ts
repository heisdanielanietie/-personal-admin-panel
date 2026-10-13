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

export type EditorSelection={tag:string;text:string;href:string;src:string;alt:string;color:string;fontSize:number;styles:Record<string,string>;canText:boolean;canParent:boolean;canMoveUp:boolean;canMoveDown:boolean;isColumns:boolean;columns:number};
const styleFields=['color','fontSize','fontFamily','fontWeight','fontStyle','textDecoration','textAlign','lineHeight','letterSpacing','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','marginLeft','marginRight','borderRadius','width','height','maxWidth','objectFit','objectPosition','display','gap','gridTemplateColumns','flexBasis','flexGrow'];

// Controls run in the trusted parent; imported scripts remain disabled by the sandbox.
export function connectEditor(doc:Document,emit:(data:any)=>void){
 let selected:HTMLElement|null=null,mode='edit';
 type Change={undo:()=>void;redo:()=>void};
 const undo:Change[]=[],redo:Change[]=[];
 const selectable=(el:Element|null):el is HTMLElement=>!!el&&el!==doc.body&&el!==doc.documentElement&&!el.matches('head,script,style,meta,link')&&el.namespaceURI==='http://www.w3.org/1999/xhtml';
 const pick=(target:EventTarget|null)=>{const n=target as Node|null;const el=n?.nodeType===1?n as Element:n?.parentElement;return el?.closest<HTMLElement>('img,h1,h2,h3,h4,h5,h6,p,a,button,li,span,strong,b,small,label,blockquote,figcaption,section,header,footer,nav,article,aside,div,main,form')||null;};
 const history=()=>emit({type:'history',canUndo:!!undo.length,canRedo:!!redo.length});
 const info=()=>{
  if(!selected||!selected.isConnected){selected=null;emit({type:'selection',selection:null});return;}
  const c=doc.defaultView!.getComputedStyle(selected),styles:Record<string,string>={};
  styleFields.forEach(k=>styles[k]=c[k as keyof CSSStyleDeclaration] as string||'');
  // Keep user-entered responsive units visible rather than converting them to pixels.
  ['width','height','maxWidth','flexBasis','gridTemplateColumns','backgroundImage'].forEach(k=>{const v=selected!.style[k as any];if(v)styles[k]=String(v);});
  const canText=selected.matches('h1,h2,h3,h4,h5,h6,p,a,button,li,span,strong,b,small,label,blockquote,figcaption')&&!selected.querySelector('img,svg,input,button,div,section,ul,ol');
  emit({type:'selection',tag:selected.tagName,text:selected.textContent||'',href:selected.getAttribute('href')||'',src:selected.getAttribute('src')||'',alt:selected.getAttribute('alt')||'',color:c.color,fontSize:parseInt(c.fontSize)||16,styles,canText,canParent:selectable(selected.parentElement),canMoveUp:selectable(selected.previousElementSibling),canMoveDown:selectable(selected.nextElementSibling),isColumns:['grid','flex','inline-grid','inline-flex'].includes(c.display),columns:selected.children.length});
 };
 const select=(el:HTMLElement|null)=>{doc.querySelectorAll('[data-ds-selected]').forEach(e=>e.removeAttribute('data-ds-selected'));selected=el;if(el&&mode==='edit')el.setAttribute('data-ds-selected','');info();};
 const snapshot=()=>{const copy=doc.documentElement.cloneNode(true) as HTMLElement;copy.querySelectorAll('[data-ds-system]').forEach(e=>e.remove());copy.querySelectorAll('[data-ds-hover],[data-ds-selected]').forEach(e=>{e.removeAttribute('data-ds-hover');e.removeAttribute('data-ds-selected');});emit({type:'changed',html:'<!DOCTYPE html>\n'+copy.outerHTML});};
 const commit=(change:Change)=>{change.redo();undo.push(change);if(undo.length>60)undo.shift();redo.length=0;info();history();snapshot();};
 const attribute=(el:HTMLElement,key:string,value:string|null)=>{const before=el.getAttribute(key);if(before===value)return;const set=(v:string|null)=>{if(v===null)el.removeAttribute(key);else el.setAttribute(key,v);};commit({undo:()=>set(before),redo:()=>set(value)});};
 const styles=(el:HTMLElement,values:Record<string,string>)=>{const probe=el.cloneNode(false) as HTMLElement;for(const [key,value] of Object.entries(values)){if(!styleFields.includes(key))continue;const css=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());if(value)probe.style.setProperty(css,value,'important');else probe.style.removeProperty(css);}attribute(el,'style',probe.getAttribute('style'));};
 const insert=(node:HTMLElement,parent:HTMLElement,before:ChildNode|null)=>commit({redo:()=>{parent.insertBefore(node,before);select(node);},undo:()=>{node.remove();select(null);}});
 const hover=(e:MouseEvent)=>{if(mode!=='edit')return;doc.querySelector('[data-ds-hover]')?.removeAttribute('data-ds-hover');const el=pick(e.target);if(selectable(el))el.setAttribute('data-ds-hover','');};
 const click=(e:MouseEvent)=>{if((e.target as Element)?.closest?.('a'))e.preventDefault();if(mode!=='edit')return;e.preventDefault();e.stopPropagation();const el=pick(e.target);if(selectable(el))select(el);};
 const submit=(e:Event)=>e.preventDefault();
 const send=(d:any)=>{
  if(d.type==='mode'){mode=d.mode;doc.querySelectorAll('[data-ds-hover],[data-ds-selected]').forEach(e=>{e.removeAttribute('data-ds-hover');e.removeAttribute('data-ds-selected');});if(mode==='edit'&&selected)select(selected);return;}
  if(mode!=='edit')return;
  if(d.type==='undo'||d.type==='redo'){const from=d.type==='undo'?undo:redo,to=d.type==='undo'?redo:undo;const change=from.pop();if(change){change[d.type as 'undo'|'redo']();to.push(change);select(selected?.isConnected?selected:null);history();snapshot();}return;}
  if(d.type==='clear'){select(null);return;}
  if(d.type==='parent'){if(selected&&selectable(selected.parentElement))select(selected.parentElement);return;}
  if(d.type==='select-section'){const el=selected?.closest<HTMLElement>('section,header,footer,nav,article,aside');if(selectable(el||null))select(el!);return;}
  if(d.type==='update'&&selected){
   const el=selected,value=String(d.value);
   if(d.field==='text'){
    if(!el.matches('h1,h2,h3,h4,h5,h6,p,a,button,li,span,strong,b,small,label,blockquote,figcaption')||el.querySelector('img,svg,input,button,div,section,ul,ol'))return;
    if(el.textContent===value)return;const children=Array.from(el.childNodes),text=doc.createTextNode(value);commit({undo:()=>el.replaceChildren(...children),redo:()=>el.replaceChildren(text)});
   }else if(['href','src','alt'].includes(d.field)){
    if(d.field!=='alt'&&value&&!safeUrl(value,d.field==='src'))return;
    attribute(el,d.field,value);
   }else if(styleFields.includes(d.field)){
    if(d.field==='backgroundImage'){if(value&&!safeUrl(value,true))return;styles(el,{backgroundImage:value?'url('+JSON.stringify(value)+')':'none',backgroundSize:'cover',backgroundPosition:'center'});}
    else styles(el,{[d.field]:d.field==='fontSize'?value+'px':value});
   }return;
  }
  if(d.type==='image-align'&&selected?.tagName==='IMG'){const m=d.value==='left'?['0','auto']:d.value==='right'?['auto','0']:['auto','auto'];styles(selected,{display:'block',marginLeft:m[0],marginRight:m[1]});return;}
  if(d.type==='columns'&&selected){const el=selected,count=el.children.length,n=Number(d.value);if(count>=2&&count<=6&&n>=10&&n<=90){
   const name='studio-columns-'+Math.random().toString(36).slice(2),rule=doc.createElement('style'),oldStyle=el.getAttribute('style'),oldClass=el.getAttribute('class');
   const tracks=n+'fr repeat('+(count-1)+', minmax(0, '+((100-n)/(count-1))+'fr))';
   rule.textContent='.'+name+'{display:grid!important;grid-template-columns:'+tracks+'!important}.'+name+'>*{min-width:0}@media(max-width:600px){.'+name+'{grid-template-columns:minmax(0,1fr)!important}}';
   commit({redo:()=>{el.style.removeProperty('grid-template-columns');el.style.removeProperty('display');el.classList.add(name);doc.head.append(rule);},undo:()=>{rule.remove();if(oldStyle===null)el.removeAttribute('style');else el.setAttribute('style',oldStyle);if(oldClass===null)el.removeAttribute('class');else el.setAttribute('class',oldClass);}});
  }return;}
  if(d.type==='structure'&&selected){const el=selected,parent=el.parentElement!;
   if(d.action==='duplicate'){const copy=el.cloneNode(true) as HTMLElement;[copy,...Array.from(copy.querySelectorAll<HTMLElement>('*'))].forEach(n=>{n.removeAttribute('data-ds-selected');n.removeAttribute('data-ds-hover');});const ids=new Map<string,string>();[copy,...Array.from(copy.querySelectorAll<HTMLElement>('[id]'))].forEach(n=>{if(n.id){const old=n.id;n.id=old+'-copy-'+Math.random().toString(36).slice(2,9);ids.set(old,n.id);}});[copy,...Array.from(copy.querySelectorAll<HTMLElement>('*'))].forEach(n=>{for(const attr of ['for','aria-labelledby','aria-describedby','aria-controls']){const v=n.getAttribute(attr);if(v)n.setAttribute(attr,v.split(' ').map(x=>ids.get(x)||x).join(' '));}const href=n.getAttribute('href');if(href?.startsWith('#')&&ids.has(href.slice(1)))n.setAttribute('href','#'+ids.get(href.slice(1)));});insert(copy,parent,el.nextSibling);}
   if(d.action==='delete'){const next=el.nextSibling;commit({redo:()=>{el.remove();select(null);},undo:()=>{parent.insertBefore(el,next);select(el);}});}
   if(d.action==='up'||d.action==='down'){const sibling=d.action==='up'?el.previousElementSibling:el.nextElementSibling;if(selectable(sibling)){const oldNext=el.nextSibling,newNext=d.action==='up'?sibling:sibling.nextSibling;commit({redo:()=>parent.insertBefore(el,newNext),undo:()=>parent.insertBefore(el,oldNext)});}}return;
  }
  if(d.type==='background'){styles(doc.body,{backgroundColor:d.value});return;}
  if(d.type==='section'){const s=doc.createElement('section');s.style.cssText='padding:48px 7%;';const h=doc.createElement('h2');h.textContent='Your new section';const p=doc.createElement('p');p.textContent='Click this text to tell your story.';s.append(h,p);const f=doc.querySelector('footer');insert(s,f?.parentElement||doc.body,f);s.scrollIntoView?.({behavior:'smooth'});}
  if(d.type==='image'&&safeUrl(String(d.value),true)){const i=doc.createElement('img');i.src=d.value;i.alt='Describe your image';i.style.cssText='display:block;max-width:100%;height:auto;margin:32px auto;border-radius:12px';const f=doc.querySelector('footer');insert(i,f?.parentElement||doc.body,f);i.scrollIntoView?.({behavior:'smooth'});}
  if(d.type==='button'){const a=doc.createElement('a');a.href='#';a.textContent='Your button';a.style.cssText='display:inline-block;padding:14px 24px;background:#275cf4;color:white;border-radius:8px;text-decoration:none';const parent=selected?.matches('section,header,footer,div,article')?selected:doc.body;insert(a,parent,null);}
 };
 const keydown=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();send({type:e.shiftKey?'redo':'undo'});}};
 doc.addEventListener('mouseover',hover);doc.addEventListener('click',click,true);doc.addEventListener('submit',submit);doc.addEventListener('keydown',keydown);
 history();emit({type:'ready'});
 return {send,destroy(){undo.length=0;redo.length=0;doc.removeEventListener('mouseover',hover);doc.removeEventListener('click',click,true);doc.removeEventListener('submit',submit);doc.removeEventListener('keydown',keydown);}};
}
