(function(){
  const PREFS_KEY='stage_music_sync_prefs';
  const STATE_KEY='stage_music_sync_state';
  const SETLIST_KEY='stage_music_setlists_v1';
  const TEAMS_KEY='stage_music_teams_v1';
  const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
  const read=(key,fallback)=>window.StageMusicSafeStorage?.get?.(key,fallback)??safeParse(localStorage.getItem(key),fallback);
  const write=(key,value)=>window.StageMusicSafeStorage?.set?.(key,value)??(localStorage.setItem(key,JSON.stringify(value)),true);
  const readSetlists=()=>{const data=read(SETLIST_KEY,[]);return Array.isArray(data)?data:[]};
  const writeSetlists=(items)=>write(SETLIST_KEY,Array.isArray(items)?items:[]);
  const readTeams=()=>{const data=read(TEAMS_KEY,[]);return Array.isArray(data)?data:[]};
  const writeTeams=(items)=>write(TEAMS_KEY,Array.isArray(items)?items:[]);
  const now=()=>new Date().toISOString();
  const getAuthState=()=>window.StageMusicAuth?.getState?.()||{isAuthenticated:false,mode:'guest',provider:null,name:'',email:''};
  const getPrefs=()=>Object.assign({autoSync:false,lastDirection:'none'},read(PREFS_KEY,{}));
  const setPrefs=(patch)=>{const next=Object.assign({},getPrefs(),patch||{});write(PREFS_KEY,next);window.dispatchEvent(new CustomEvent('stage-music-sync-updated',{detail:{prefs:next,state:getState()}}));return next;};
  const getState=()=>Object.assign({lastSyncAt:'',lastUploadAt:'',lastDownloadAt:'',status:'idle',message:'Pronto para sincronizar',cloudSongs:0,cloudSetlists:0,cloudTeams:0},read(STATE_KEY,{}));
  const setState=(patch)=>{const next=Object.assign({},getState(),patch||{});write(STATE_KEY,next);window.dispatchEvent(new CustomEvent('stage-music-sync-updated',{detail:{prefs:getPrefs(),state:next}}));return next;};
  const isConfigured=()=>!!(window.STAGE_MUSIC_FIREBASE?.apiKey&&window.STAGE_MUSIC_FIREBASE?.authDomain&&window.STAGE_MUSIC_FIREBASE?.projectId&&window.STAGE_MUSIC_FIREBASE?.appId);
  let firebaseCache=null;
  async function initFirebase(){
    if(firebaseCache) return firebaseCache;
    if(!isConfigured()) throw new Error('Firebase não configurado.');
    const [{initializeApp,getApps},{getAuth},{getFirestore,collection,doc,getDocs,setDoc}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
    ]);
    const app=getApps()[0]||initializeApp(window.STAGE_MUSIC_FIREBASE);
    firebaseCache={app,auth:getAuth(app),db:getFirestore(app),collection,doc,getDocs,setDoc};
    return firebaseCache;
  }
  function mergeCloudSong(song){
    if(!song||!window.StageMusicLocalDB) return null;
    const local=window.StageMusicLocalDB.getSongById(song.id);
    if(!local||new Date(song.updatedAt||0)>=new Date(local.updatedAt||0)) return window.StageMusicLocalDB.saveSong(song);
    return local;
  }
  function mergeCloudSetlists(remoteItems){
    const localItems=readSetlists();
    const map=new Map(localItems.map(item=>[item.id,item]));
    (remoteItems||[]).forEach((item)=>{
      const current=map.get(item.id);
      if(!current||new Date(item.updatedAt||0)>=new Date(current.updatedAt||0)) map.set(item.id,item);
    });
    const merged=[...map.values()];
    writeSetlists(merged);
    return merged;
  }
  async function ensureReady(){
    const authState=getAuthState();
    if(!authState.isAuthenticated) throw new Error('Entre em uma conta antes de sincronizar.');
    if(authState.mode==='local') throw new Error('Sincronização em nuvem exige conta online. Use o login com Google ou e-mail.');
    if(!isConfigured()) throw new Error('Firebase ainda não foi configurado neste projeto.');
    const firebase=await initFirebase();
    const firebaseUser=firebase.auth.currentUser;
    const uid=firebaseUser?.uid||authState.uid||'';
    if(!uid) throw new Error('A sessão Firebase ainda não forneceu um UID válido. Saia e entre novamente na conta.');
    if(firebaseUser?.uid&&authState.uid&&firebaseUser.uid!==authState.uid) throw new Error('A sessão local não corresponde ao usuário autenticado no Firebase. Entre novamente.');
    return {authState:Object.assign({},authState,{uid,email:firebaseUser?.email||authState.email||''}),firebase,uid};
  }
  async function syncAllToCloud(){
    const {authState,firebase,uid}=await ensureReady();
    setState({status:'running',message:'Enviando dados locais para a nuvem...'});
    const songs=window.StageMusicLocalDB?.getAllSongs?.()||[];
    const setlists=readSetlists();
    const teams=readTeams();
    const owner=uid;
    const songCol=firebase.collection(firebase.db,'users',owner,'songs');
    const setlistCol=firebase.collection(firebase.db,'users',owner,'setlists');
    const teamCol=firebase.collection(firebase.db,'users',owner,'teams');
    await Promise.all(songs.map(song=>firebase.setDoc(firebase.doc(songCol,song.id),Object.assign({},song,{ownerUid:uid,ownerEmail:authState.email,updatedAt:song.updatedAt||now()}),{merge:true})));
    await Promise.all(setlists.map(list=>firebase.setDoc(firebase.doc(setlistCol,list.id),Object.assign({},list,{ownerUid:uid,ownerEmail:authState.email,updatedAt:list.updatedAt||now()}),{merge:true})));
    await Promise.all(teams.map(team=>firebase.setDoc(firebase.doc(teamCol,team.id),Object.assign({},team,{ownerUid:uid,ownerEmail:authState.email,updatedAt:team.updatedAt||now()}),{merge:true})));
    const stamp=now();
    setState({status:'success',message:'Dados locais enviados com sucesso.',lastSyncAt:stamp,lastUploadAt:stamp,cloudSongs:songs.length,cloudSetlists:setlists.length,cloudTeams:teams.length});
    return {songs:songs.length,setlists:setlists.length,teams:teams.length,stamp};
  }
  async function pullAllFromCloud(){
    const {authState,firebase,uid}=await ensureReady();
    setState({status:'running',message:'Baixando dados da nuvem...'});
    const owner=uid;
    const songCol=firebase.collection(firebase.db,'users',owner,'songs');
    const setlistCol=firebase.collection(firebase.db,'users',owner,'setlists');
    const teamCol=firebase.collection(firebase.db,'users',owner,'teams');
    const [songSnap,setlistSnap,teamSnap]=await Promise.all([firebase.getDocs(songCol),firebase.getDocs(setlistCol),firebase.getDocs(teamCol)]);
    const songs=[]; songSnap.forEach(docSnap=>songs.push(docSnap.data()));
    const setlists=[]; setlistSnap.forEach(docSnap=>setlists.push(docSnap.data()));
    const teams=[]; teamSnap.forEach(docSnap=>teams.push(docSnap.data()));
    songs.forEach(mergeCloudSong);
    const mergedSetlists=mergeCloudSetlists(setlists);
    const localTeams=readTeams();const teamMap=new Map(localTeams.map(item=>[item.id,item]));teams.forEach(item=>{const current=teamMap.get(item.id);if(!current||new Date(item.updatedAt||0)>=new Date(current.updatedAt||0))teamMap.set(item.id,item)});const mergedTeams=[...teamMap.values()];writeTeams(mergedTeams);
    const stamp=now();
    setState({status:'success',message:'Dados da nuvem aplicados no dispositivo.',lastSyncAt:stamp,lastDownloadAt:stamp,cloudSongs:songs.length,cloudSetlists:mergedSetlists.length,cloudTeams:mergedTeams.length});
    return {songs:songs.length,setlists:mergedSetlists.length,teams:mergedTeams.length,stamp};
  }
  async function syncSong(song){
    const prefs=getPrefs();
    if(!prefs.autoSync) return {skipped:true,reason:'auto-sync-disabled'};
    const {authState,firebase,uid}=await ensureReady();
    const owner=uid;
    const songCol=firebase.collection(firebase.db,'users',owner,'songs');
    const payload=Object.assign({},song,{ownerUid:uid,ownerEmail:authState.email,updatedAt:song.updatedAt||now()});
    await firebase.setDoc(firebase.doc(songCol,payload.id),payload,{merge:true});
    setState({status:'success',message:'Última cifra sincronizada automaticamente.',lastSyncAt:now(),lastUploadAt:now()});
    return {ok:true};
  }
  async function syncSetlists(setlists){
    const prefs=getPrefs();
    if(!prefs.autoSync) return {skipped:true,reason:'auto-sync-disabled'};
    const {authState,firebase,uid}=await ensureReady();
    const owner=uid;
    const setlistCol=firebase.collection(firebase.db,'users',owner,'setlists');
    const items=Array.isArray(setlists)?setlists:readSetlists();
    await Promise.all(items.map(list=>firebase.setDoc(firebase.doc(setlistCol,list.id),Object.assign({},list,{ownerUid:uid,ownerEmail:authState.email,updatedAt:list.updatedAt||now()}),{merge:true})));
    setState({status:'success',message:'Repertórios sincronizados automaticamente.',lastSyncAt:now(),lastUploadAt:now()});
    return {ok:true,count:items.length};
  }
  async function syncTeams(teams){
    const prefs=getPrefs();
    if(!prefs.autoSync) return {skipped:true,reason:'auto-sync-disabled'};
    const {authState,firebase,uid}=await ensureReady();
    const owner=uid;
    const teamCol=firebase.collection(firebase.db,'users',owner,'teams');
    const items=Array.isArray(teams)?teams:[];
    await Promise.all(items.map(team=>firebase.setDoc(firebase.doc(teamCol,team.id),Object.assign({},team,{ownerUid:uid,ownerEmail:authState.email,updatedAt:team.updatedAt||now()}),{merge:true})));
    setState({status:'success',message:'Equipes sincronizadas automaticamente.',lastSyncAt:now(),lastUploadAt:now()});
    return {ok:true,count:items.length};
  }
  function formatStamp(iso){
    if(!iso) return 'Nunca sincronizado';
    const date=new Date(iso);
    return Number.isNaN(date.getTime())?'Nunca sincronizado':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date);
  }
  function mountUi(){
    const authState=getAuthState();
    const state=getState();
    const prefs=getPrefs();
    document.querySelectorAll('[data-cloud-config]').forEach(el=>el.textContent=isConfigured()?'Firebase configurado':'Firebase não configurado');
    document.querySelectorAll('[data-cloud-account]').forEach(el=>el.textContent=authState.isAuthenticated?(authState.email||authState.name||'Sessão ativa'):'Sem sessão');
    document.querySelectorAll('[data-cloud-mode]').forEach(el=>el.textContent=authState.mode==='online'?'Conta online':'Modo local/guest');
    document.querySelectorAll('[data-cloud-message]').forEach(el=>el.textContent=state.message||'Pronto para sincronizar');
    document.querySelectorAll('[data-cloud-last-sync]').forEach(el=>el.textContent=formatStamp(state.lastSyncAt));
    document.querySelectorAll('[data-cloud-last-upload]').forEach(el=>el.textContent=formatStamp(state.lastUploadAt));
    document.querySelectorAll('[data-cloud-last-download]').forEach(el=>el.textContent=formatStamp(state.lastDownloadAt));
    document.querySelectorAll('[data-cloud-counts]').forEach(el=>el.textContent=`${state.cloudSongs||0} cifras • ${state.cloudSetlists||0} repertórios • ${state.cloudTeams||0} equipes`);
    document.querySelectorAll('[data-cloud-auto-sync]').forEach(el=>{if('checked' in el) el.checked=!!prefs.autoSync;});
    document.querySelectorAll('[data-cloud-status]').forEach(el=>{el.dataset.state=state.status||'idle';el.textContent=state.status==='running'?'Sincronizando...':state.status==='success'?'Tudo certo':'Aguardando ação';});
    document.querySelectorAll('[data-cloud-enable]').forEach(btn=>btn.disabled=!(authState.isAuthenticated&&authState.mode==='online'&&isConfigured()));
  }
  function bindUi(){
    document.querySelectorAll('[data-cloud-auto-sync]').forEach(control=>control.addEventListener('change',()=>setPrefs({autoSync:!!control.checked})));
    document.querySelectorAll('[data-cloud-upload]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;try{await syncAllToCloud();}catch(error){setState({status:'idle',message:error?.message||'Não foi possível sincronizar para a nuvem.'});alert(error?.message||'Não foi possível sincronizar para a nuvem.');}finally{btn.disabled=false;mountUi();}}));
    document.querySelectorAll('[data-cloud-download]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;try{await pullAllFromCloud();}catch(error){setState({status:'idle',message:error?.message||'Não foi possível baixar os dados da nuvem.'});alert(error?.message||'Não foi possível baixar os dados da nuvem.');}finally{btn.disabled=false;mountUi();}}));
  }
  const api={isConfigured,getPrefs,setPrefs,getState,setState,syncAllToCloud,pullAllFromCloud,syncSong,syncSetlists,syncTeams,mountUi};
  window.StageMusicCloudSync=api;
  document.addEventListener('DOMContentLoaded',()=>{mountUi();bindUi();});
  window.addEventListener('stage-music-auth-changed',mountUi);
  window.addEventListener('stage-music-sync-updated',mountUi);
})();
