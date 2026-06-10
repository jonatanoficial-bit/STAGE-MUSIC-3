(function(){
 const page=document.body?.dataset?.page||'';
 const items=[
  ['index.html','⌂','Início','home'],
  ['modo-live.html','▶','Live','modo-live'],
  ['buscar-cifra.html','⌕','Cifras','buscar-cifra'],
  ['minhas-listas.html','☷','Listas','minhas-listas'],
  ['configuracoes.html','⚙','Mais','configuracoes']
 ];
 function mount(){
  if(page==='modo-live'||document.querySelector('.mobile-audit-nav')) return;
  const nav=document.createElement('nav');nav.className='mobile-audit-nav';nav.setAttribute('aria-label','Navegação principal mobile');
  nav.innerHTML=items.map(([href,icon,label,key])=>`<a href="${href}" class="${page===key?'active':''}" aria-label="${label}"><span>${icon}</span>${label}</a>`).join('');
  document.body.appendChild(nav);
 }
 function viewportFix(){
  const meta=document.querySelector('meta[name="viewport"]');
  const value='width=device-width, initial-scale=1.0, viewport-fit=cover';
  if(meta)meta.setAttribute('content',value);else{const m=document.createElement('meta');m.name='viewport';m.content=value;document.head.appendChild(m)}
 }
 function keyboardAware(){
  if(!window.visualViewport)return;
  const apply=()=>document.documentElement.style.setProperty('--visual-vh',`${window.visualViewport.height}px`);
  window.visualViewport.addEventListener('resize',apply,{passive:true});apply();
 }
 viewportFix();
 document.addEventListener('DOMContentLoaded',()=>{mount();keyboardAware();});
})();
