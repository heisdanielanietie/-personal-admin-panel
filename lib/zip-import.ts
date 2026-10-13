import {validPagePath} from './paths';
const LIMIT=60_000_000,FILE_LIMIT=20_000_000;
const decoder=new TextDecoder('utf-8',{fatal:true});
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;}
export async function readZip(buffer:ArrayBuffer){
 if(buffer.byteLength>FILE_LIMIT)throw new Error('Choose a ZIP no larger than 20 MB.');
 const b=new Uint8Array(buffer),v=new DataView(buffer),files=new Map<string,Uint8Array>();let end=-1;
 for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===b.length){end=i;break;}
 if(end<0)throw new Error('This is not a supported ZIP file.');
 const count=v.getUint16(end+10,true),offset=v.getUint32(end+16,true),size=v.getUint32(end+12,true);
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||count===65535||count>500||offset+size>end)throw new Error('Use a standard ZIP with at most 500 files, without ZIP64 or split volumes.');
 let at=offset,total=0;const names=new Set<string>();
 for(let i=0;i<count;i++){
  if(at+46>end||v.getUint32(at,true)!==0x02014b50)throw new Error('Invalid ZIP directory.');
  const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),crc=v.getUint32(at+16,true),compressed=v.getUint32(at+20,true),length=v.getUint32(at+24,true),nl=v.getUint16(at+28,true),extra=v.getUint16(at+30,true),comment=v.getUint16(at+32,true),local=v.getUint32(at+42,true),mode=v.getUint32(at+38,true)>>>16;
  if(at+46+nl+extra+comment>offset+size)throw new Error('Invalid ZIP entry.');
  const name=decoder.decode(b.slice(at+46,at+46+nl));at+=46+nl+extra+comment;
  if(!name||name.includes('\\')||name.startsWith('/')||name.includes(':')||name.includes('\0')||name.split('/').some(p=>p==='..'||p==='.'))throw new Error('ZIP contains an unsafe file path.');
  if((mode&0xf000)===0xa000)throw new Error('ZIP symbolic links are not supported.');
  if(name.endsWith('/'))continue;
  if(names.has(name.toLowerCase()))throw new Error('ZIP contains duplicate filenames.');names.add(name.toLowerCase());
  total+=length;if(total>LIMIT||length>FILE_LIMIT)throw new Error('ZIP expands beyond 60 MB total or 20 MB per file.');
  if(flags&1||![0,8].includes(method))throw new Error('Use an unencrypted ZIP with standard compression.');
  if(local+30>offset||v.getUint32(local,true)!==0x04034b50)throw new Error('Invalid ZIP file header.');
  const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);
  if(start+compressed>offset)throw new Error('Invalid ZIP file size.');
  let data:Uint8Array;
  if(method===0)data=b.slice(start,start+compressed);
  else{
   const stream=new Blob([b.slice(start,start+compressed)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
   const reader=stream.getReader(),chunks:Uint8Array[]=[];let n=0;
   try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>length||n>FILE_LIMIT){await reader.cancel();throw new Error('ZIP entry exceeds its declared size.');}chunks.push(r.value);}}finally{reader.releaseLock();}
   data=new Uint8Array(n);let pos=0;for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.length;}
  }
  if(data.length!==length||crc32(data)!==crc)throw new Error('ZIP is damaged: '+name);
  if(!name.startsWith('__MACOSX/')&&!name.split('/').some(p=>p.startsWith('.')))files.set(name,data);
 }
 return files;
}
const mime:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf'};
export async function importWebsiteZip(buffer:ArrayBuffer,progress?:(s:string)=>void){
 const files=await readZip(buffer),pages:{filename:string;html:string}[]=[],cache=new Map<string,string>();
 let expanded=0;const spend=(value:string)=>{expanded+=value.length;if(expanded>FILE_LIMIT)throw new Error('Page assets expand beyond 20 MB.');return value;};
 const local=(url:string,base:string)=>{if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url))return null;const u=new URL(url,'https://zip.local/'+base);return decodeURIComponent(u.pathname.slice(1));};
 const asset=(url:string,base:string)=>{const path=local(url,base);if(path===null)return url;const bytes=files.get(path);if(!bytes)throw new Error('Missing ZIP asset: '+path);if(cache.has(path))return spend(cache.get(path)!);const type=mime[path.split('.').pop()!.toLowerCase()];if(!type)throw new Error('Unsupported asset: '+path+' (use images, CSS and fonts).');let str='';for(let i=0;i<bytes.length;i+=32768)str+=String.fromCharCode(...bytes.subarray(i,i+32768));const result='data:'+type+';base64,'+btoa(str);cache.set(path,result);return spend(result);};
 const css=(text:string,base:string,stack:string[]=[]):string=>{
  if(stack.length>10)throw new Error('Too many nested CSS imports.');
  const nested:string[]=[];
  text=text.replace(/@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)|"([^"]+)"|'([^']+)')\s*([^;]*);/gi,(_,a,b,c,d,e,media)=>{const url=a??b??c??d??e;const path=local(url,base);if(path===null)return _;if(stack.includes(path))throw new Error('Circular CSS import: '+path);const bytes=files.get(path);if(!bytes)throw new Error('Missing stylesheet: '+path);const value=css(decoder.decode(bytes),path,[...stack,path]);nested.push(spend(media.trim()?'@media '+media+'{'+value+'}':value));return '/*ZIP_IMPORT_'+(nested.length-1)+'*/';});
  text=text.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,(_,a,b,c)=>'url('+JSON.stringify(asset((a??b??c).trim(),base))+')');
  return text.replace(/\/\*ZIP_IMPORT_(\d+)\*\//g,(_,i)=>nested[+i]);
 };
 for(const [path,bytes] of files){if(!/\.html?$/i.test(path))continue;if(!validPagePath(path))throw new Error('Rename this page to a simple folder/filename.html: '+path);expanded=0;progress?.('Preparing '+path+'…');
  const doc=new DOMParser().parseFromString(decoder.decode(bytes),'text/html');
  doc.querySelectorAll('script,iframe,object,embed,base').forEach(e=>e.remove());
  const processed=new WeakSet<Element>();
  doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach(link=>{const p=local(link.getAttribute('href')||'',path);if(p===null)return;const bytes=files.get(p);if(!bytes)throw new Error('Missing stylesheet: '+p);const style=doc.createElement('style');style.textContent=css(decoder.decode(bytes),p,[p]);processed.add(style);link.replaceWith(style);});
  doc.querySelectorAll('style').forEach(el=>{if(!processed.has(el))el.textContent=css(el.textContent||'',path);});
  doc.querySelectorAll<HTMLElement>('[style]').forEach(el=>el.setAttribute('style',css(el.getAttribute('style')||'',path)));
  doc.querySelectorAll('img[src],source[src],video[poster],link[rel~="icon"][href]').forEach(el=>{const key=el.hasAttribute('poster')?'poster':el.tagName==='LINK'?'href':'src';el.setAttribute(key,asset(el.getAttribute(key)||'',path));});
  doc.querySelectorAll('[srcset]').forEach(el=>{const value=el.getAttribute('srcset')||'';if(!value.trim().startsWith('data:'))el.setAttribute('srcset',value.split(',').map(item=>{const [url,...descriptor]=item.trim().split(/\s+/);return asset(url,path)+' '+descriptor.join(' ');}).join(', '));});
  const html='<!DOCTYPE html>\n'+doc.documentElement.outerHTML;if(new TextEncoder().encode(html).length>FILE_LIMIT)throw new Error(path+' exceeds 20 MB after embedding its assets.');pages.push({filename:path,html});
 }
 if(!pages.length)throw new Error('This ZIP has no HTML pages. Export a static HTML website first.');
 return pages;
}
