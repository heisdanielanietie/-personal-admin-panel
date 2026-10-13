'use client';
import {useEffect,useState} from 'react';
import type {EditorSelection} from '@/lib/editor';
import {safeUrl} from '@/lib/editor';
import {toast} from 'sonner';

function hex(value:string){if(/^#[\da-f]{6}$/i.test(value))return value;const n=value.match(/[\d.]+/g);return n&&n.length>=3?'#'+n.slice(0,3).map(x=>Math.min(255,Math.round(Number(x))).toString(16).padStart(2,'0')).join(''):'#ffffff';}
function ValueInput({value,onCommit,placeholder}:{value:string;onCommit:(value:string)=>void;placeholder?:string}){
 const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);
 return <input value={draft} placeholder={placeholder} onChange={e=>setDraft(e.target.value)} onBlur={()=>{if(draft!==value)onCommit(draft);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){e.preventDefault();setDraft(value);}}}/>;
}
export function EditorInspector({selection:s,field,send,imageFile,busy}:{selection:EditorSelection;field:(key:string,value:string|number)=>void;send:(data:unknown)=>void;imageFile:(file?:File,replace?:boolean)=>void;busy:boolean}){
 const st=s.styles;
 const styleInput=(label:string,key:string,placeholder='auto')=><label>{label}<ValueInput value={st[key]||''} placeholder={placeholder} onCommit={v=>{if(!v||CSS.supports(key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v))field(key,v);else toast.error('Use a valid value, such as 24px, 50% or auto.');}}/></label>;
 const choice=(label:string,key:string,options:[string,string][])=> <label>{label}<select value={st[key]||''} onChange={e=>field(key,e.target.value)}><option value={st[key]||''}>Current: {st[key]||'default'}</option>{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>;
 const colour=(label:string,key:string)=><label>{label}<input type="color" value={hex(st[key]||'')} onChange={e=>field(key,e.target.value)}/></label>;
 return <fieldset className="advanced-fields" disabled={busy}>
  <div className="selection-path"><strong>{s.tag.toLowerCase()}</strong><button className="secondary" disabled={!s.canParent} onClick={()=>send({type:'parent'})}>Select parent ↑</button><button className="text-btn" onClick={()=>send({type:'select-section'})}>Select enclosing section</button></div>
  {s.canText&&<details open><summary>Text & typography</summary><label>Text<ValueText value={s.text} commit={v=>field('text',v)}/></label><p className="field-note">Replacing text removes inline formatting within this element. Undo restores it.</p>
   {choice('Font family','fontFamily',[['Arial, sans-serif','Arial'],['Georgia, serif','Georgia'],['Verdana, sans-serif','Verdana'],['Tahoma, sans-serif','Tahoma'],['"Trebuchet MS", sans-serif','Trebuchet'],['"Courier New", monospace','Courier']])}
   <div className="field-row">{colour('Text colour','color')}<label>Size (px)<input type="number" min="8" max="300" value={s.fontSize} onChange={e=>{const n=+e.target.value;if(n>=8&&n<=300)field('fontSize',n);}}/></label></div>
   <div className="field-row">{choice('Weight','fontWeight',[['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['900','Heavy']])}{choice('Style','fontStyle',[['normal','Normal'],['italic','Italic']])}</div>
   {choice('Alignment','textAlign',[['left','Left'],['center','Centre'],['right','Right'],['justify','Justify']])}
   {choice('Decoration','textDecoration',[['none','None'],['underline','Underline'],['line-through','Strikethrough']])}
   <div className="field-row">{styleInput('Line spacing','lineHeight','1.5')}{styleInput('Letter spacing','letterSpacing','0px')}</div>
  </details>}
  {s.tag==='A'&&<details open><summary>Button / link destination</summary><label>Link<ValueInput value={s.href} onCommit={v=>{if(!v||safeUrl(v))field('href',v);else toast.error('Use https://, #section, mailto:, tel: or a page.html filename.');}}/></label><p className="field-note">Use the Appearance controls below to style this link as a button.</p></details>}
  {s.tag==='BUTTON'&&<p className="field-note">This is a form/action button. Add a link button for navigation; changing its label does not connect a form service.</p>}
  {s.tag==='IMG'&&<details open><summary>Image & crop</summary><label>Description<ValueInput value={s.alt} onCommit={v=>field('alt',v)}/></label><label className="upload-label">Replace image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{imageFile(e.target.files?.[0],true);e.target.value='';}}/></label><p className="field-note">JPG, PNG, WebP or GIF · up to 750 KB</p>
   {choice('Fit inside image box','objectFit',[['contain','Show full image'],['cover','Crop to fill'],['fill','Stretch'],['none','Original size']])}
   {choice('Crop focus','objectPosition',[['center','Centre'],['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right']])}
   <p className="field-note">Set width and height below, then choose Crop to fill. The original image stays intact.</p>
   <div className="control-buttons">{['left','center','right'].map(v=><button key={v} className="secondary" onClick={()=>send({type:'image-align',value:v})}>{v==='center'?'Centre':v}</button>)}</div>
  </details>}
  <details open><summary>Appearance & size</summary>{colour('Background colour','backgroundColor')}<button className="text-btn" onClick={()=>field('backgroundColor','transparent')}>Transparent background</button>
   <label>Background image URL<ValueInput value={st.backgroundImage?.startsWith('url(')?st.backgroundImage.slice(4,-1).replace(/^["']|["']$/g,''):''} placeholder="https://…" onCommit={v=>{if(!v||safeUrl(v,true))field('backgroundImage',v);else toast.error('Use a full HTTPS image URL.');}}/></label>
   <div className="field-row">{styleInput('Width','width','100%')}{styleInput('Height','height','auto')}</div>
   <div className="field-row">{styleInput('Max. width','maxWidth','100%')}{styleInput('Rounded corners','borderRadius','12px')}</div>
   <p className="field-note">Use % widths for flexible layouts. Check Phone view after resizing.</p>
  </details>
  <details><summary>Spacing</summary><div className="field-row">{styleInput('Padding top','paddingTop','24px')}{styleInput('Padding bottom','paddingBottom','24px')}</div><div className="field-row">{styleInput('Padding left','paddingLeft','24px')}{styleInput('Padding right','paddingRight','24px')}</div><div className="field-row">{styleInput('Margin top','marginTop','0px')}{styleInput('Margin bottom','marginBottom','0px')}</div></details>
  <details><summary>Columns & layout</summary>{styleInput('Column / row gap','gap','24px')}{s.isColumns&&s.columns>=2&&s.columns<=6?<><label>First column width<select defaultValue="" key={st.gridTemplateColumns} onChange={e=>send({type:'columns',value:Number(e.target.value)})}><option value="" disabled>Choose proportion…</option>{[25,33,50,66,75].map(n=><option key={n} value={n}>{n}% · rest share remaining space</option>)}</select></label><p className="field-note">Columns stack automatically at widths of 600px and below. Check Phone view after changing the layout.</p></>:<p className="field-note">Select the parent of a column to adjust the column proportions.</p>}{styleInput('Selected flex column basis','flexBasis','auto')}</details>
  <details open><summary>Arrange selected element</summary><div className="control-buttons"><button className="secondary" disabled={!s.canMoveUp} onClick={()=>send({type:'structure',action:'up'})}>Move up</button><button className="secondary" disabled={!s.canMoveDown} onClick={()=>send({type:'structure',action:'down'})}>Move down</button><button className="secondary" onClick={()=>send({type:'structure',action:'duplicate'})}>Duplicate</button><button className="secondary danger-text" onClick={()=>{if(window.confirm('Delete this '+s.tag.toLowerCase()+' and its contents? You can undo this while this page stays open.'))send({type:'structure',action:'delete'});}}>Delete</button></div><p className="field-note">Select the enclosing section to move, copy or remove the whole section.</p></details>
 </fieldset>;
}
function ValueText({value,commit}:{value:string;commit:(v:string)=>void}){return <textarea rows={4} value={value} onChange={e=>commit(e.target.value)}/>;}
