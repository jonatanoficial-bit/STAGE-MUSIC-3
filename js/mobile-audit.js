(function(){
 const page=document.body?.dataset?.page||'';
 function authState(){try{return window.StageMusicAuth?.getState?.()||JSON.parse(localStorage.getItem('stage_music_auth')||'{}')}catch{return{}}}
 function items(){const state=authState(),logged=!!state?.isAuthenticated;return[
  ['index.html','⌂','Início','home',''],
  ['sala-live.html','◎','Sala','sala-live',''],
  ['buscar-cifra.html','⌕','Cifras','buscar-cifra',''],
  ['teste-massa.html','✓','Teste','teste-massa',''],
  [logged?'configuracoes.html':'login-cifra.html',logged?'●':'G',logged?'Conta':'Entrar',logged?'configuracoes':'login-cifra','login-priority']
 ]}
 function mount(){
  if(page==='modo-live') return;
  document.querySelector('.mobile-audit-nav')?.remove();
  const nav=document.createElement('nav');nav.className='mobile-audit-nav';nav.setAttribute('aria-label','Navegação principal mobile');
  nav.innerHTML=items().map(([href,icon,label,key,extra])=>`<a href="${href}" class="${page===key?'active ':''}${extra}" aria-label="${label}"><span>${icon}</span>${label}</a>`).join('');
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
 window.addEventListener('stage-music-auth-changed',mount);
})();
