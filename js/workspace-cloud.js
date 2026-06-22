(function(){
  'use strict';

  const VERSION='1.0.0';
  const STATUS_EVENT='stage-music-workspace-status';
  const RESTORED_EVENT='stage-music-workspace-restored';
  const COLLECTIONS={
    setlists:{key:'stage_music_setlists_v1',cloud:'setlists',label:'repertórios'},
    teams:{key:'stage_music_teams_v1',cloud:'teams',label:'equipes'},
    events:{key:'stage_music_events_v1',cloud:'events',label:'eventos'}
  };

  const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
  const read=(key,fallback)=>window.StageMusicSafeStorage?.get?.(key,fallback)??safeParse(localStorage.getItem(key),fallback);
  const write=(key,value)=>window.StageMusicSafeStorage?.set?.(key,value)??(localStorage.setItem(key,JSON.stringify(value)),true);
  const authState=()=>window.StageMusicAuth?.getState?.()||{isAuthenticated:false,mode:'guest',uid:'',email:''};
  const isConfigured=()=>!!(window.STAGE_MUSIC_FIREBASE?.apiKey&&window.STAGE_MUSIC_FIREBASE?.authDomain&&window.STAGE_MUSIC_FIREBASE?.projectId&&window.STAGE_MUSIC_FIREBASE?.appId);
  const now=()=>new Date().toISOString();
  const itemTime=item=>new Date(item?.updatedAt||item?.createdAt||0).getTime()||0;
  const normalizeItems=value=>Array.isArray(value)?value.filter(item=>item&&item.id):[];
  const fingerprint=items=>JSON.stringify(normalizeItems(items).map(item=>[item.id,item.updatedAt||'',item.createdAt||'']).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));

  let runtimePromise=null;
  let restorePromise=null;
  const saveTimers=new Map();
  const pendingSaves=new Map();
  let status={state:'idle',message:'Proteção em nuvem pronta.',updatedAt:''};

  function emit(next){
    status=Object.assign({},status,next||{},{updatedAt:now()});
    window.dispatchEvent(new CustomEvent(STATUS_EVENT,{detail:status}));
    renderStatus();
    return status;
  }

  function renderStatus(){
    const page=document.body?.dataset?.page||'';
    if(!['minhas-listas','equipes','eventos','sala-live'].includes(page))return;
    let pill=document.getElementById('workspace-cloud-status');
    if(!pill){
      pill=document.createElement('div');
      pill.id='workspace-cloud-status';
      pill.className='workspace-cloud-status';
      pill.setAttribute('role','status');
      pill.setAttribute('aria-live','polite');
      document.body.appendChild(pill);
    }
    const state=authState();
    if(!(state.isAuthenticated&&state.mode==='online')){
      pill.dataset.state='local';
      pill.textContent='Somente neste aparelho';
      pill.title='Entre com Google para salvar repertórios, equipes e eventos permanentemente.';
      return;
    }
    pill.dataset.state=status.state;
    pill.textContent=status.state==='saving'?'Salvando na conta…':status.state==='restoring'?'Restaurando da nuvem…':status.state==='error'?'Falha ao salvar — toque para tentar':'Salvo na conta Google';
    pill.title=status.message||'';
  }

  async function getRuntime(){
    if(runtimePromise)return runtimePromise;
    runtimePromise=(async()=>{
      if(!isConfigured())throw new Error('Firebase não configurado.');
      const [{initializeApp,getApps},{getAuth,onAuthStateChanged},{getFirestore,collection,doc,getDocs,setDoc,deleteDoc}] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
      ]);
      const app=getApps()[0]||initializeApp(window.STAGE_MUSIC_FIREBASE);
      return {app,auth:getAuth(app),db:getFirestore(app),onAuthStateChanged,collection,doc,getDocs,setDoc,deleteDoc};
    })();
    return runtimePromise;
  }

  async function waitForUser(runtime,timeout=8000){
    if(runtime.auth.currentUser)return runtime.auth.currentUser;
    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);try{stop?.()}catch{};error?reject(error):resolve(value)};
      const stop=runtime.onAuthStateChanged(runtime.auth,user=>user&&finish(user),error=>finish(null,error));
      const timer=setTimeout(()=>finish(null,new Error('A autenticação ainda não ficou pronta.')),timeout);
    });
  }

  async function ready(){
    const state=authState();
    if(!(state.isAuthenticated&&state.mode==='online'))throw new Error('Entre com Google para salvar permanentemente.');
    const runtime=await getRuntime();
    const user=await waitForUser(runtime);
    const uid=user?.uid||state.uid||'';
    if(!uid)throw new Error('UID do Firebase indisponível.');
    if(state.uid&&user?.uid&&state.uid!==user.uid)throw new Error('A conta local não corresponde à sessão Firebase.');
    return {runtime,user,uid,email:user?.email||state.email||''};
  }

  function merge(localItems,remoteItems){
    const local=normalizeItems(localItems),remote=normalizeItems(remoteItems),map=new Map();
    local.forEach(item=>map.set(item.id,item));
    remote.forEach(item=>{
      const current=map.get(item.id);
      if(!current||itemTime(item)>=itemTime(current))map.set(item.id,item);
    });
    return [...map.values()].sort((a,b)=>itemTime(b)-itemTime(a));
  }

  async function restoreAll(options={}){
    if(restorePromise&&!options.force)return restorePromise;
    restorePromise=(async()=>{
      const state=authState();
      if(!(state.isAuthenticated&&state.mode==='online')||!isConfigured())return {skipped:true};
      const {runtime,uid,email}=await ready();
      const sessionKey=`stage_music_workspace_restore_${VERSION}_${uid}`;
      if(!options.force&&sessionStorage.getItem(sessionKey))return {skipped:true,reason:'already-restored'};
      emit({state:'restoring',message:'Restaurando repertórios, equipes e eventos da conta…'});
      let changed=false;
      const counts={};
      for(const [name,def] of Object.entries(COLLECTIONS)){
        const localItems=normalizeItems(read(def.key,[]));
        const snap=await runtime.getDocs(runtime.collection(runtime.db,'users',uid,def.cloud));
        const remoteItems=[];
        snap.forEach(d=>remoteItems.push(Object.assign({id:d.id},d.data())));
        const merged=merge(localItems,remoteItems);
        const before=fingerprint(localItems),after=fingerprint(merged);
        if(before!==after){write(def.key,merged);changed=true;}
        const remoteMap=new Map(remoteItems.map(item=>[item.id,item]));
        const toUpload=merged.filter(item=>{const remote=remoteMap.get(item.id);return !remote||itemTime(item)>itemTime(remote)});
        await Promise.all(toUpload.map(item=>runtime.setDoc(
          runtime.doc(runtime.db,'users',uid,def.cloud,item.id),
          Object.assign({},item,{ownerUid:uid,ownerEmail:email,updatedAt:item.updatedAt||now()}),
          {merge:true}
        )));
        counts[name]=merged.length;
      }
      sessionStorage.setItem(sessionKey,now());
      emit({state:'saved',message:`Proteção concluída: ${counts.setlists||0} repertórios, ${counts.teams||0} equipes e ${counts.events||0} eventos.`});
      window.dispatchEvent(new CustomEvent(RESTORED_EVENT,{detail:{changed,counts}}));
      const page=document.body?.dataset?.page||'';
      const reloadPages=['home','minhas-listas','equipes','eventos','sala-live'];
      const reloadKey=`stage_music_workspace_reload_${VERSION}_${uid}_${page}`;
      if(changed&&reloadPages.includes(page)&&!sessionStorage.getItem(reloadKey)){
        sessionStorage.setItem(reloadKey,'1');
        setTimeout(()=>location.reload(),240);
      }
      return {changed,counts};
    })().catch(error=>{
      emit({state:'error',message:error?.message||'Não foi possível restaurar os dados.'});
      console.warn('Workspace Cloud restore:',error?.message||error);
      return {error};
    }).finally(()=>{restorePromise=null});
    return restorePromise;
  }

  async function persistCollection(name,items){
    const def=COLLECTIONS[name];
    if(!def)throw new Error('Coleção desconhecida.');
    const {runtime,uid,email}=await ready();
    const clean=normalizeItems(items);
    emit({state:'saving',message:`Salvando ${def.label} na conta Google…`});
    await Promise.all(clean.map(item=>runtime.setDoc(
      runtime.doc(runtime.db,'users',uid,def.cloud,item.id),
      Object.assign({},item,{ownerUid:uid,ownerEmail:email,updatedAt:item.updatedAt||now()}),
      {merge:true}
    )));
    emit({state:'saved',message:`${def.label.charAt(0).toUpperCase()+def.label.slice(1)} salvos permanentemente.`});
    return {ok:true,count:clean.length};
  }

  function saveCollection(name,items,options={}){
    const state=authState();
    if(!(state.isAuthenticated&&state.mode==='online')||!isConfigured()){
      renderStatus();
      return Promise.resolve({skipped:true,reason:'offline-or-guest'});
    }
    pendingSaves.set(name,normalizeItems(items));
    clearTimeout(saveTimers.get(name));
    if(options.immediate){
      pendingSaves.delete(name);
      return persistCollection(name,items).catch(error=>{emit({state:'error',message:error?.message||'Falha ao salvar na nuvem.'});throw error});
    }
    return new Promise(resolve=>{
      const timer=setTimeout(async()=>{
        saveTimers.delete(name);
        const payload=pendingSaves.get(name)||[];
        pendingSaves.delete(name);
        try{resolve(await persistCollection(name,payload))}
        catch(error){emit({state:'error',message:error?.message||'Falha ao salvar na nuvem.'});console.warn('Workspace Cloud save:',error?.message||error);resolve({error})}
      },350);
      saveTimers.set(name,timer);
    });
  }

  async function deleteItem(name,id){
    const def=COLLECTIONS[name];
    if(!def||!id)return {skipped:true};
    const state=authState();
    if(!(state.isAuthenticated&&state.mode==='online')||!isConfigured())return {skipped:true,reason:'offline-or-guest'};
    try{
      const {runtime,uid}=await ready();
      emit({state:'saving',message:`Removendo item de ${def.label}…`});
      await runtime.deleteDoc(runtime.doc(runtime.db,'users',uid,def.cloud,id));
      emit({state:'saved',message:'Alteração removida também da nuvem.'});
      return {ok:true};
    }catch(error){emit({state:'error',message:error?.message||'Falha ao remover na nuvem.'});throw error}
  }

  const api={
    version:VERSION,
    restoreAll,
    refresh:()=>restoreAll({force:true}),
    saveSetlists:(items,options)=>saveCollection('setlists',items,options),
    saveTeams:(items,options)=>saveCollection('teams',items,options),
    saveEvents:(items,options)=>saveCollection('events',items,options),
    deleteSetlist:id=>deleteItem('setlists',id),
    deleteTeam:id=>deleteItem('teams',id),
    deleteEvent:id=>deleteItem('events',id),
    getStatus:()=>Object.assign({},status)
  };
  window.StageMusicWorkspaceCloud=api;

  function scheduleRestore(){setTimeout(()=>restoreAll(),350)}
  document.addEventListener('DOMContentLoaded',()=>{renderStatus();scheduleRestore()});
  window.addEventListener('stage-music-auth-changed',()=>{renderStatus();scheduleRestore()});
  window.addEventListener('online',()=>{renderStatus();restoreAll({force:true})});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')renderStatus()});
  document.addEventListener('click',event=>{if(event.target?.id==='workspace-cloud-status'&&status.state==='error')restoreAll({force:true})});
})();
