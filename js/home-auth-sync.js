(function(){
  const AUTH_KEY='stage_music_auth';
  const safeState=()=>{
    try{return window.StageMusicAuth?.getState?.()||JSON.parse(localStorage.getItem(AUTH_KEY)||'{}')}catch{return{}}
  };
  const setBusy=(button,busy,label)=>{
    if(!button)return;
    button.disabled=busy;
    button.textContent=busy?'Atualizando conteúdo...':label;
  };
  async function pullAndRefresh({automatic=false}={}){
    const button=document.getElementById('home-sync-now');
    const hint=document.getElementById('home-sync-hint');
    const state=safeState();
    if(!state?.isAuthenticated||state.mode!=='online')return false;
    if(!window.StageMusicCloudSync?.pullAllFromCloud){
      if(hint)hint.textContent='Sincronização ainda não disponível. Abra Configurações.';
      return false;
    }
    try{
      setBusy(button,true,'Atualizar meu conteúdo agora');
      if(hint)hint.textContent=automatic?'Buscando automaticamente seus dados na nuvem...':'Baixando cifras e repertórios da sua conta...';
      await window.StageMusicCloudSync.pullAllFromCloud();
      if(hint)hint.textContent='Conteúdo atualizado. Recarregando sua biblioteca...';
      setTimeout(()=>location.reload(),450);
      return true;
    }catch(error){
      console.warn('Atualização inicial:',error?.message||error);
      if(hint)hint.textContent='Não foi possível atualizar automaticamente. Toque no botão para tentar novamente.';
      try{sessionStorage.removeItem(`stage_music_home_autopull_${state.uid||state.email||'user'}`)}catch{}
      setBusy(button,false,'Atualizar meu conteúdo agora');
      return false;
    }
  }
  function render(){
    const state=safeState();
    const title=document.getElementById('home-auth-title');
    const text=document.getElementById('home-auth-text');
    const login=document.getElementById('home-login-primary');
    const sync=document.getElementById('home-sync-now');
    const hint=document.getElementById('home-sync-hint');
    const side=document.querySelector('[data-home-login-link]');
    if(!title||!login||!sync)return;
    if(state?.isAuthenticated&&state.mode==='online'){
      title.textContent=`Olá, ${state.name||'músico'}. Atualize seu conteúdo.`;
      text.textContent='Sincronize agora para carregar neste aparelho suas cifras, repertórios, equipes e eventos.';
      login.textContent='Conta conectada';
      login.href='configuracoes.html';
      login.classList.remove('btn-primary');login.classList.add('btn-outline');
      sync.hidden=false;
      if(hint)hint.textContent='Atualização recomendada ao entrar em um aparelho novo.';
      if(side){side.textContent='Minha conta';side.href='configuracoes.html';}
      const onceKey=`stage_music_home_autopull_${state.uid||state.email||'user'}`;
      if(!sessionStorage.getItem(onceKey)){
        sessionStorage.setItem(onceKey,'1');
        setTimeout(()=>pullAndRefresh({automatic:true}),700);
      }
    }else if(state?.isAuthenticated&&state.mode==='local'){
      title.textContent='Você está no modo local.';
      text.textContent='Entre com Google para proteger e acessar seu conteúdo em outros aparelhos.';
      login.textContent='Conectar com Google';
      login.href='login-cifra.html';
      sync.hidden=true;
      if(hint)hint.textContent='Seus dados atuais permanecem neste dispositivo.';
      if(side){side.textContent='Entrar com Google';side.href='login-cifra.html';}
    }else{
      title.textContent='Entre para acessar suas cifras em qualquer aparelho.';
      text.textContent='Use sua conta Google para sincronizar cifras, repertórios, equipes e Sala Live com segurança.';
      login.textContent='Entrar com Google';
      login.href='login-cifra.html';
      sync.hidden=true;
      if(hint)hint.textContent='Login recomendado para não perder seus dados.';
      if(side){side.textContent='Entrar com Google';side.href='login-cifra.html';}
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.body.matches('[data-page="home"]'))return;
    render();
    document.getElementById('home-sync-now')?.addEventListener('click',()=>pullAndRefresh());
    window.addEventListener('stage-music-auth-changed',render);
    setTimeout(render,1000);
  });
})();
