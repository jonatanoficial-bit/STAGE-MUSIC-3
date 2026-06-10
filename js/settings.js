(function(){
  const safeParse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.body.matches('[data-page="configuracoes"]')) return;
    const backupBtn=document.getElementById('export-full-backup');
    backupBtn?.addEventListener('click',()=>{
      const songs=window.StageMusicLocalDB?.getAllSongs?.()||[];
      const setlists=safeParse(localStorage.getItem('stage_music_setlists_v1')||'[]',[]);
      const authState=window.StageMusicAuth?.getState?.()||{};
      const syncPrefs=window.StageMusicCloudSync?.getPrefs?.()||{};
      const syncState=window.StageMusicCloudSync?.getState?.()||{};
      const payload={
        exportedAt:new Date().toISOString(),
        app:'Stage Music',
        version:window.StageMusicBuild?.version||'',
        songs,
        setlists,
        authState,
        syncPrefs,
        syncState
      };
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`stage-music-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),500);
    });
  });
})();
