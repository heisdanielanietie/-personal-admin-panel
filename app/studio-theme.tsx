'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
type Theme='light'|'dark';
const Context=createContext<{theme:Theme;toggle:()=>void}>({theme:'light',toggle:()=>{}});
export function StudioTheme({children}:{children:ReactNode}){
 const [theme,setTheme]=useState<Theme>('light');
 const apply=(value:Theme)=>{document.documentElement.dataset.studioTheme=value;document.documentElement.style.colorScheme=value;setTheme(value);};
 useEffect(()=>{try{apply(localStorage.getItem('studio-theme')==='dark'?'dark':'light');}catch{apply('light');}const sync=(e:StorageEvent)=>{if(e.key==='studio-theme')apply(e.newValue==='dark'?'dark':'light');};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 const toggle=()=>{const next=theme==='light'?'dark':'light';apply(next);try{localStorage.setItem('studio-theme',next);}catch{/* Theme switching must still work when storage is unavailable. */}};
 return <Context.Provider value={{theme,toggle}}>{children}</Context.Provider>;
}
export const useStudioTheme=()=>useContext(Context);
export function ThemeButton(){const {theme,toggle}=useStudioTheme();return <button type="button" className="studio-theme-button" aria-label="Dark mode for DauVinci Studio" aria-pressed={theme==='dark'} onClick={toggle}>{theme==='dark'?'☀ Light mode':'☾ Dark mode'}</button>;}
