(function(){
  const KEY='stage_music_language_v1';
  const allowed=['pt','en','es'];
  const labels={pt:'PT',en:'EN',es:'ES'};
  const messages={
    pt:{
      'Entrar por convite':'Entrar por convite','Modo Live':'Modo Live','Sala Live':'Sala Live','Buscar cifra':'Buscar cifra','Minhas listas':'Minhas listas','Equipes':'Equipes','Eventos':'Eventos','Configurações':'Configurações','Diagnóstico':'Diagnóstico','Teste em grupo':'Teste em grupo','Instalar no celular':'Instalar no celular','Enviar feedback':'Enviar feedback','Ajuda':'Ajuda','Privacidade':'Privacidade','Termos':'Termos','Produto internacional':'Produto internacional','Início':'Início','Cifras':'Cifras','Sala':'Sala','Teste':'Teste','Entrar':'Entrar','Conta':'Conta'
    },
    en:{
      'Entrar por convite':'Join by invite','Modo Live':'Live Mode','Sala Live':'Live Room','Buscar cifra':'Find songs','Minhas listas':'Setlists','Equipes':'Teams','Eventos':'Events','Configurações':'Settings','Diagnóstico':'Diagnostics','Teste em grupo':'Team test','Instalar no celular':'Install on phone','Enviar feedback':'Send feedback','Ajuda':'Help','Privacidade':'Privacy','Termos':'Terms','Produto internacional':'International product','Início':'Home','Cifras':'Songs','Sala':'Room','Teste':'Test','Entrar':'Sign in','Conta':'Account'
    },
    es:{
      'Entrar por convite':'Entrar por invitación','Modo Live':'Modo Live','Sala Live':'Sala Live','Buscar cifra':'Buscar canciones','Minhas listas':'Repertorios','Equipes':'Equipos','Eventos':'Eventos','Configurações':'Configuración','Diagnóstico':'Diagnóstico','Teste em grupo':'Prueba en equipo','Instalar no celular':'Instalar en el móvil','Enviar feedback':'Enviar feedback','Ajuda':'Ayuda','Privacidade':'Privacidad','Termos':'Términos','Produto internacional':'Producto internacional','Início':'Inicio','Cifras':'Canciones','Sala':'Sala','Teste':'Prueba','Entrar':'Entrar','Conta':'Cuenta'
    }
  };
  function current(){try{return allowed.includes(localStorage.getItem(KEY))?localStorage.getItem(KEY):'pt'}catch{return 'pt'}}
  function setLang(lang){try{localStorage.setItem(KEY,lang)}catch{};document.documentElement.lang=lang==='pt'?'pt-BR':lang==='en'?'en':'es';apply(lang);window.dispatchEvent(new CustomEvent('stage-music-language-changed',{detail:{lang}}));}
  function apply(lang=current()){
    document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.getAttribute('data-i18n');if(messages[lang]?.[key])el.textContent=messages[lang][key];});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const key=el.getAttribute('data-i18n-placeholder');if(messages[lang]?.[key])el.setAttribute('placeholder',messages[lang][key]);});
    document.querySelectorAll('.language-content').forEach(el=>el.classList.toggle('active',el.dataset.lang===lang));
    document.querySelectorAll('.language-switcher button').forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===lang));
  }
  function mount(){
    if(document.querySelector('.language-switcher'))return;
    const nav=document.createElement('div');nav.className='language-switcher';nav.setAttribute('aria-label','Idioma / Language / Idioma');
    nav.innerHTML=allowed.map(lang=>`<button type="button" data-lang="${lang}" aria-label="${labels[lang]}">${labels[lang]}</button>`).join('');
    nav.addEventListener('click',ev=>{const btn=ev.target.closest('button[data-lang]');if(btn)setLang(btn.dataset.lang)});
    document.body.appendChild(nav);
    apply(current());
  }
  document.addEventListener('DOMContentLoaded',mount);
  window.StageMusicI18n={setLang,current,apply,messages};
})();
