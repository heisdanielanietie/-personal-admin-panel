// ZIP/page names are relative paths, never filesystem destinations.
export function validPagePath(name:string){return typeof name==='string'&&name.length<=240&&!name.includes('\\')&&!name.startsWith('/')&&name.split('/').every(p=>p!=='.'&&p!=='..'&&/^[a-zA-Z0-9][a-zA-Z0-9_.() -]*$/.test(p))&&/\.html?$/i.test(name);}
