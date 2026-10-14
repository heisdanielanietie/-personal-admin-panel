import {useId} from 'react';

/** Isolate the original white artwork using its green channel (the purple backdrop has none). */
export function Brand(){
 const id=`brand-${useId().replace(/:/g,'')}`;
 return <span className="dauvinci-wordmark"><svg viewBox="170 280 1720 490" role="img" aria-label="DauVinci Studio">
  <defs><filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
   <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 1 0 0 0" result="artwork"/>
   <feFlood floodColor="currentColor" result="ink"/><feComposite in="ink" in2="artwork" operator="in"/>
  </filter></defs>
  <image href="/brand/dauvinci-horizontal-dvs.png" width="2048" height="1033" filter={`url(#${id})`}/>
 </svg></span>;
}
