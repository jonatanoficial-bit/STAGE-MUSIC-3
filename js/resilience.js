(function(){
 'use strict';
 const KEY='stageMusicDiagnostics';
 const memory=new Map();
 const safeStorage={
  get(key,fallback=null){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch(e){return memory.has(key)?memory.get(key):fallback}},
  set(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){console.warn('Stage Music: armazenamento local indisponível.',e);return false}},
  remove(key){memory.delete(key);try{localStorage.removeItem(key)}catch(e){}}
 };
 window.StageMusicSafeStorage=safeStorage;
 const diagnostics={startedAt:new Date().toISOString(),errors:[],online:navigator.onLine,build:window.StageMusicBuild?.version||'unknown'};
 function save(){safeStorage.set(KEY,diagnostics)}
 function report(type,message,source){diagnostics.errors.push({type,message:String(message).slice(0,500),source:String(source||'app').slice(0,200),at:new Date().toISOString()});diagnostics.errors=diagnostics.errors.slice(-20);save()}
 window.addEventListener('error',e=>report('error',e.message,e.filename));
 window.addEventListener('unhandledrejection',e=>report('promise',e.reason?.message||e.reason,'promise'));
 function banner(text,kind){let el=document.getElementById('system-status-banner');if(!el){el=document.createElement('div');el.id='system-status-banner';el.className='system-status-banner';el.setAttribute('role','status');document.body.prepend(el)}el.textContent=text;el.dataset.kind=kind;el.hidden=false}
 function updateNetwork(){diagnostics.online=navigator.onLine;save();if(!navigator.onLine) banner('Modo offline ativo — seus dados locais continuam disponíveis.','offline');else{const el=document.getElementById('system-status-banner');if(el){el.textContent='Conexão restaurada.';el.dataset.kind='online';setTimeout(()=>el.hidden=true,2200)}}}
 addEventListener('online',updateNetwork);addEventListener('offline',updateNetwork);
 document.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.classList.add('js-ready'); updateNetwork();
  document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.classList.add('asset-fallback');img.alt=img.alt||'Imagem temporariamente indisponível';report('asset','Falha ao carregar imagem',img.src)},{once:true}));
  document.querySelectorAll('button,a').forEach(el=>el.addEventListener('click',()=>el.classList.add('was-activated'),{passive:true}));
 });
 window.StageMusicDiagnostics={get:()=>structuredClone?structuredClone(diagnostics):JSON.parse(JSON.stringify(diagnostics)),clear:()=>{diagnostics.errors=[];save()},report};
 save();
})();
