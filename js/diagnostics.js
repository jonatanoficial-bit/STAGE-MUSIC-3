(function(){
  const $=id=>document.getElementById(id);
  const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
  const readArray=(key)=>{const value=window.StageMusicSafeStorage?.get?.(key,null);const parsed=value??safeParse(localStorage.getItem(key)||'[]',[]);return Array.isArray(parsed)?parsed:[]};
  const state={report:null,deferredPrompt:null};
  const check=(id,label,stateName,detail,weight=0)=>({id,label,state:stateName,detail,weight,passed:stateName==='ok'});
  const authState=()=>window.StageMusicAuth?.getState?.()||safeParse(localStorage.getItem('stage_music_auth')||'{}',{});
  function storageCheck(){
    const key='stage_music_diagnostic_probe';
    try{localStorage.setItem(key,'ok');const ok=localStorage.getItem(key)==='ok';localStorage.removeItem(key);return ok}catch{return false}
  }
  async function serviceWorkerCheck(){
    if(!('serviceWorker' in navigator))return {supported:false,active:false};
    try{const reg=await navigator.serviceWorker.getRegistration();return {supported:true,active:!!(reg?.active||navigator.serviceWorker.controller)}}catch{return {supported:true,active:false}}
  }
  async function firebaseCheck(){
    const configured=!!window.StageMusicFirebase?.configured?.();
    if(!configured)return {configured:false,initialized:false,user:null};
    try{await window.StageMusicFirebase.init();const user=await window.StageMusicFirebase.currentUser();return {configured:true,initialized:true,user}}catch(error){return {configured:true,initialized:false,user:null,error:error?.message||String(error)}}
  }
  function pwaMode(){return window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true}
  function currentRoom(){return window.StageMusicSafeStorage?.get?.('stage_music_current_room',null)??safeParse(localStorage.getItem('stage_music_current_room')||'null',null)}
  function activeSetlist(){return window.StageMusicSafeStorage?.get?.('stage_music_active_setlist',null)??safeParse(localStorage.getItem('stage_music_active_setlist')||'null',null)}
  function lastBackup(){return localStorage.getItem('stage_music_last_backup_export')||''}
  function fmtDate(value){if(!value)return 'Ainda não registrado';const date=new Date(value);return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date)}
  async function buildReport(){
    const [sw,firebase]=await Promise.all([serviceWorkerCheck(),firebaseCheck()]);
    const auth=authState();
    const songs=window.StageMusicLocalDB?.getAllSongs?.()||[];
    const setlists=readArray('stage_music_setlists_v1');
    const teams=readArray('stage_music_teams_v1');
    const events=readArray('stage_music_events_v1');
    const sync=window.StageMusicCloudSync?.getState?.()||{};
    const storageOk=storageCheck();
    const technical=[
      check('storage','Armazenamento local',storageOk?'ok':'error',storageOk?'Leitura e gravação local funcionando.':'O navegador bloqueou o armazenamento local.',15),
      check('service-worker','PWA e cache offline',sw.active?'ok':sw.supported?'warn':'error',sw.active?'Service Worker ativo neste aparelho.':sw.supported?'Suporte disponível, mas ainda não está ativo.':'Este navegador não suporta Service Worker.',15),
      check('firebase-config','Configuração Firebase',firebase.configured?'ok':'warn',firebase.configured?'Projeto Firebase reconhecido.':'A nuvem não está configurada nesta publicação.',10),
      check('firebase-runtime','Inicialização Firebase',firebase.initialized?'ok':firebase.configured?'warn':'info',firebase.initialized?'SDK inicializado com sucesso.':firebase.error||'Será testado após configurar o Firebase.',10),
      check('connection','Conexão atual',navigator.onLine?'ok':'warn',navigator.onLine?'O aparelho está online.':'Modo offline ativo; dados locais continuam disponíveis.',5),
      check('broadcast','Sincronização local de sala','BroadcastChannel' in window?'ok':'warn','BroadcastChannel '+('BroadcastChannel' in window?'disponível para comunicação entre abas.':'não disponível neste navegador.'),5),
      check('wake-lock','Tela ativa','wakeLock' in navigator?'ok':'warn','Wake Lock '+('wakeLock' in navigator?'compatível com este navegador.':'indisponível; o app continuará funcionando sem ele.'),5),
      check('pwa-mode','Modo aplicativo',pwaMode()?'ok':'info',pwaMode()?'Stage Music aberto como aplicativo instalado.':'Aberto no navegador; a instalação é opcional.',5)
    ];
    const setup=[
      check('login','Conta online',auth?.isAuthenticated&&auth.mode==='online'?'ok':'warn',auth?.isAuthenticated&&auth.mode==='online'?`Conectado como ${auth.email||auth.name}.`:'Entre com Google ou e-mail para sincronizar entre aparelhos.',10),
      check('songs','Biblioteca de cifras',songs.length?'ok':'warn',songs.length?`${songs.length} cifra${songs.length===1?'':'s'} disponível${songs.length===1?'':'is'}.`:'Crie ou baixe sua primeira cifra.',5),
      check('setlists','Repertório preparado',setlists.length?'ok':'warn',setlists.length?`${setlists.length} repertório${setlists.length===1?'':'s'} criado${setlists.length===1?'':'s'}.`:'Monte um repertório antes da apresentação.',5),
      check('active-setlist','Repertório ativo',activeSetlist()?.songs?.length?'ok':'warn',activeSetlist()?.songs?.length?`${activeSetlist().name||'Repertório'} pronto para o Live.`:'Abra um repertório no Modo Live para validar o fluxo.',5),
      check('teams','Equipe cadastrada',teams.length?'ok':'info',teams.length?`${teams.length} equipe${teams.length===1?'':'s'} cadastrada${teams.length===1?'':'s'}.`:'Opcional: cadastre sua banda ou ministério.',2),
      check('events','Evento programado',events.length?'ok':'info',events.length?`${events.length} evento${events.length===1?'':'s'} planejado${events.length===1?'':'s'}.`:'Opcional: organize ensaios e apresentações.',2),
      check('sync','Sincronização recente',sync.lastSyncAt?'ok':auth?.mode==='online'?'warn':'info',sync.lastSyncAt?`Última sincronização: ${fmtDate(sync.lastSyncAt)}.`:'Ainda não há sincronização registrada neste aparelho.',8),
      check('backup','Backup de segurança',lastBackup()?'ok':'warn',lastBackup()?`Último backup exportado em ${fmtDate(lastBackup())}.`:'Exporte um backup antes de mudanças importantes.',5),
      check('room','Sala Live testada',currentRoom()?.code?'ok':'info',currentRoom()?.code?`Última sala: ${currentRoom().code}.`:'Crie uma sala e teste o QR Code em outro aparelho.',3)
    ];
    const all=[...technical,...setup];const max=all.reduce((sum,item)=>sum+item.weight,0);const earned=all.reduce((sum,item)=>sum+(item.passed?item.weight:0),0);const score=max?Math.round(earned/max*100):0;
    return {generatedAt:new Date().toISOString(),build:window.StageMusicBuild||{},technical,setup,score,counts:{songs:songs.length,setlists:setlists.length,teams:teams.length,events:events.length},auth:{isAuthenticated:!!auth?.isAuthenticated,mode:auth?.mode||'guest',email:auth?.email||''},firebase:{configured:firebase.configured,initialized:firebase.initialized,authenticated:!!firebase.user},capabilities:{serviceWorker:sw,wakeLock:'wakeLock' in navigator,broadcastChannel:'BroadcastChannel' in window,webMidi:'requestMIDIAccess' in navigator,standalone:pwaMode(),online:navigator.onLine}};
  }
  function itemHtml(item){const icon=item.state==='ok'?'✓':item.state==='error'?'!':item.state==='warn'?'!':'i';return `<article class="diagnostic-item" data-state="${item.state}"><span class="diagnostic-icon">${icon}</span><div><strong>${item.label}</strong><small>${item.detail}</small></div></article>`}
  function setStatus(node,checks){if(!node)return;const errors=checks.filter(x=>x.state==='error').length,warnings=checks.filter(x=>x.state==='warn').length;node.dataset.state=errors?'error':warnings?'warn':'ok';node.textContent=errors?'Atenção':warnings?'Ajustes recomendados':'Tudo certo'}
  function render(report){
    state.report=report;
    $('technical-checks').innerHTML=report.technical.map(itemHtml).join('');
    $('setup-checks').innerHTML=report.setup.map(itemHtml).join('');
    setStatus($('technical-status'),report.technical);setStatus($('setup-status'),report.setup);
    $('readiness-score').textContent=`${report.score}%`;$('readiness-ring').style.setProperty('--score',report.score);
    const title=report.score>=85?'Pronto para apresentação':report.score>=65?'Quase pronto':report.score>=40?'Configuração em andamento':'Ação necessária';
    const summary=report.score>=85?'Os pontos essenciais deste aparelho estão preparados. Faça apenas o checklist final de palco.':report.score>=65?'O núcleo funciona, mas há recomendações importantes antes do uso ao vivo.':'Conclua os itens marcados antes de depender do app em uma apresentação.';
    $('readiness-title').textContent=title;$('readiness-summary').textContent=summary;
  }
  async function run(){const button=$('run-diagnostics');if(button){button.disabled=true;button.textContent='Verificando…'}try{render(await buildReport())}finally{if(button){button.disabled=false;button.textContent='Executar novamente'}}}
  function download(){if(!state.report)return;const blob=new Blob([JSON.stringify(state.report,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`stage-music-diagnostico-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  function stageChecks(){const saved=safeParse(localStorage.getItem('stage_music_stage_checklist_v1')||'{}',{});document.querySelectorAll('[data-stage-check]').forEach(input=>{const key=input.dataset.stageCheck;input.checked=!!saved[key];input.addEventListener('change',()=>{saved[key]=input.checked;localStorage.setItem('stage_music_stage_checklist_v1',JSON.stringify(saved))})})}
  function installSupport(){const button=$('install-stage-music');window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.deferredPrompt=event;if(button){button.disabled=false;button.textContent='Instalar aplicativo'}});button?.addEventListener('click',async()=>{if(!state.deferredPrompt)return;state.deferredPrompt.prompt();await state.deferredPrompt.userChoice;state.deferredPrompt=null;button.disabled=true;button.textContent='Instalação solicitada'});if(pwaMode()&&button){button.disabled=true;button.textContent='Aplicativo instalado'}}
  document.addEventListener('DOMContentLoaded',()=>{if(!document.body.matches('[data-page="diagnostico"]'))return;stageChecks();installSupport();$('run-diagnostics')?.addEventListener('click',run);$('download-diagnostics')?.addEventListener('click',download);run();window.addEventListener('online',run);window.addEventListener('offline',run);window.addEventListener('stage-music-auth-changed',()=>setTimeout(run,250));window.addEventListener('stage-music-sync-updated',()=>setTimeout(run,250))});
})();
