(function(){
  const safeParse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
  const MANAGED_KEYS=[
    'stage_music_local_songs','stage_music_song_draft','stage_music_favorites','stage_music_recent_songs',
    'stage_music_setlists_v1','stage_music_teams_v1','stage_music_events_v1','stage_music_instrument_profiles_v1',
    'stage_music_external_controls_v1','stage_music_sync_prefs','stage_music_sync_state','stage_music_active_instrument',
    'stage_music_live_profile','stage_music_active_setlist','stage_music_stage_checklist_v1','stage_music_onboarding_completed_v1','stage_music_global_songs_v1'
  ];
  const ARRAY_KEYS=new Set(['stage_music_local_songs','stage_music_favorites','stage_music_recent_songs','stage_music_setlists_v1','stage_music_teams_v1','stage_music_events_v1','stage_music_global_songs_v1']);
  const ID_ARRAY_KEYS=new Set(['stage_music_local_songs','stage_music_setlists_v1','stage_music_teams_v1','stage_music_events_v1','stage_music_global_songs_v1']);
  const RECOVERY_KEY='stage_music_recovery_snapshot_v1';
  const readRaw=(key)=>{const raw=localStorage.getItem(key);return raw===null?null:safeParse(raw,raw)};
  const writeValue=(key,value)=>{if(value===undefined||value===null){localStorage.removeItem(key);return}localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value))};
  const collectData=()=>Object.fromEntries(MANAGED_KEYS.map(key=>[key,readRaw(key)]).filter(([,value])=>value!==null));
  const setStatus=(text,kind='info')=>{const node=document.getElementById('backup-status');if(!node)return;node.textContent=text;node.dataset.state=kind};
  const downloadJson=(payload,name)=>{const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
  const mergeIdArray=(current,incoming)=>{const map=new Map((Array.isArray(current)?current:[]).map(item=>[item?.id||JSON.stringify(item),item]));for(const item of Array.isArray(incoming)?incoming:[]){const id=item?.id||JSON.stringify(item),existing=map.get(id);if(!existing){map.set(id,item);continue}const incomingDate=new Date(item?.updatedAt||item?.createdAt||0),existingDate=new Date(existing?.updatedAt||existing?.createdAt||0);if(incomingDate>=existingDate)map.set(id,item)}return [...map.values()]};
  const mergeValue=(key,current,incoming)=>{
    if(ID_ARRAY_KEYS.has(key))return mergeIdArray(current,incoming);
    if(key==='stage_music_favorites'||key==='stage_music_recent_songs')return [...new Set([...(Array.isArray(current)?current:[]),...(Array.isArray(incoming)?incoming:[])])];
    if(ARRAY_KEYS.has(key))return Array.isArray(incoming)?incoming:Array.isArray(current)?current:[];
    if(current&&incoming&&typeof current==='object'&&typeof incoming==='object'&&!Array.isArray(current)&&!Array.isArray(incoming))return Object.assign({},current,incoming);
    return incoming;
  };
  const normalizeBackup=(payload)=>{
    if(!payload||typeof payload!=='object')throw new Error('Arquivo JSON inválido.');
    if(payload.app&&payload.app!=='Stage Music')throw new Error('Este arquivo não pertence ao Stage Music.');
    if(payload.data&&typeof payload.data==='object')return {schemaVersion:payload.schemaVersion||2,data:payload.data,exportedAt:payload.exportedAt||''};
    const legacy={};
    if(Array.isArray(payload.songs))legacy.stage_music_local_songs=payload.songs;
    if(Array.isArray(payload.setlists))legacy.stage_music_setlists_v1=payload.setlists;
    if(payload.syncPrefs)legacy.stage_music_sync_prefs=payload.syncPrefs;
    if(payload.syncState)legacy.stage_music_sync_state=payload.syncState;
    if(!Object.keys(legacy).length)throw new Error('Nenhum dado reconhecido no backup.');
    return {schemaVersion:1,data:legacy,exportedAt:payload.exportedAt||''};
  };
  const saveRecovery=()=>localStorage.setItem(RECOVERY_KEY,JSON.stringify({savedAt:new Date().toISOString(),data:collectData()}));
  const applyData=(data,mode)=>{
    if(!data||typeof data!=='object')throw new Error('Backup sem dados válidos.');
    saveRecovery();
    if(mode==='replace')for(const key of MANAGED_KEYS)localStorage.removeItem(key);
    let applied=0;
    for(const [key,incoming] of Object.entries(data)){
      if(!MANAGED_KEYS.includes(key)||incoming===undefined)continue;
      const value=mode==='merge'?mergeValue(key,readRaw(key),incoming):incoming;
      writeValue(key,value);applied++;
    }
    if(!applied)throw new Error('O arquivo não contém itens compatíveis com esta versão.');
    return applied;
  };
  async function importBackup(file){
    if(!file)throw new Error('Selecione um arquivo de backup.');
    if(file.size>15*1024*1024)throw new Error('O backup ultrapassa o limite seguro de 15 MB.');
    const text=await file.text(),payload=normalizeBackup(safeParse(text,null));
    const mode=document.getElementById('backup-import-mode')?.value||'merge';
    const confirmText=mode==='replace'?'Isso substituirá cifras, repertórios e preferências locais. Uma cópia de recuperação será criada. Continuar?':'Os dados do arquivo serão mesclados com os dados atuais. Continuar?';
    if(!confirm(confirmText))return false;
    const applied=applyData(payload.data,mode);
    localStorage.setItem('stage_music_last_backup_import',new Date().toISOString());
    setStatus(`${applied} grupos de dados restaurados. Recarregando o aplicativo…`,'ok');
    setTimeout(()=>location.reload(),650);return true;
  }
  function exportBackup(){
    const payload={app:'Stage Music',schemaVersion:2,version:window.StageMusicBuild?.version||'',exportedAt:new Date().toISOString(),data:collectData(),summary:{songs:window.StageMusicLocalDB?.getAllSongs?.().length||0,setlists:(safeParse(localStorage.getItem('stage_music_setlists_v1')||'[]',[])||[]).length,teams:(safeParse(localStorage.getItem('stage_music_teams_v1')||'[]',[])||[]).length,events:(safeParse(localStorage.getItem('stage_music_events_v1')||'[]',[])||[]).length}};
    downloadJson(payload,`stage-music-backup-${new Date().toISOString().slice(0,10)}.json`);
    localStorage.setItem('stage_music_last_backup_export',new Date().toISOString());
    setStatus('Backup completo exportado com sucesso.','ok');
  }
  function undoRestore(){
    const recovery=safeParse(localStorage.getItem(RECOVERY_KEY)||'null',null);
    if(!recovery?.data){setStatus('Não existe restauração anterior para desfazer.','warn');return}
    if(!confirm('Restaurar o estado local anterior à última importação?'))return;
    for(const key of MANAGED_KEYS)localStorage.removeItem(key);
    for(const [key,value] of Object.entries(recovery.data))if(MANAGED_KEYS.includes(key))writeValue(key,value);
    localStorage.removeItem(RECOVERY_KEY);setStatus('Estado anterior recuperado. Recarregando…','ok');setTimeout(()=>location.reload(),650);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.body.matches('[data-page="configuracoes"]'))return;
    const testFirebaseBtn=document.getElementById('test-firebase-connection');
    testFirebaseBtn?.addEventListener('click',async()=>{
      testFirebaseBtn.disabled=true;
      try{
        if(!window.StageMusicFirebase?.configured?.())throw new Error('Preencha js/firebase-config.js antes de testar.');
        const rt=await window.StageMusicFirebase.init(),user=await window.StageMusicFirebase.currentUser(),ref=rt.doc(rt.db,'systemChecks',user?.uid||'anonymous');
        await rt.setDoc(ref,{app:'Stage Music',checkedAt:rt.serverTimestamp(),uid:user?.uid||'',email:user?.email||''},{merge:true});
        alert(user?'Firebase conectado e autenticado com sucesso.':'Firebase conectado, mas falta login online.');
      }catch(error){alert(error?.message||'Falha ao testar Firebase.')}finally{testFirebaseBtn.disabled=false}
    });
    document.getElementById('export-full-backup')?.addEventListener('click',exportBackup);
    const fileInput=document.getElementById('backup-file-input');
    document.getElementById('import-full-backup')?.addEventListener('click',()=>fileInput?.click());
    fileInput?.addEventListener('change',async()=>{try{setStatus('Validando o arquivo…');await importBackup(fileInput.files?.[0])}catch(error){setStatus(error?.message||'Não foi possível restaurar o backup.','error')}finally{fileInput.value=''}});
    document.getElementById('undo-last-restore')?.addEventListener('click',undoRestore);
    if(localStorage.getItem(RECOVERY_KEY))setStatus('Existe uma cópia de recuperação da última restauração.','warn');
  });
})();
