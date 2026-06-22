(function(){
  'use strict';
  const STORAGE_KEY='stage_music_feedback_beta_v1';
  const $=id=>document.getElementById(id);
  const fields=['tester-name','tester-role','device-info','overall-score','tested-area','worked-well','issue-found','suggestion'];
  const safeParse=value=>{try{return JSON.parse(value||'{}')}catch{return {}}};
  const now=()=>new Date().toISOString();
  const build=()=>window.StageMusicBuild?.version||'versão não identificada';
  const state=()=>window.StageMusicAuth?.getState?.()||{isAuthenticated:false,mode:'guest',uid:'',email:''};

  function read(){return safeParse(localStorage.getItem(STORAGE_KEY));}
  function write(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(Object.assign({},data,{updatedAt:now()})));}
  function collect(){
    const data={};
    fields.forEach(id=>{const el=$(id);data[id.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=el?.value?.trim?.()||el?.value||'';});
    data.version=build();
    data.createdAt=data.createdAt||now();
    data.userAgent=navigator.userAgent;
    data.screen=`${window.screen?.width||'?'}x${window.screen?.height||'?'} / viewport ${window.innerWidth}x${window.innerHeight}`;
    const auth=state();
    data.authMode=auth.mode||'guest';
    data.userEmail=auth.email||'';
    return data;
  }
  function text(data){
    return `Stage Music — feedback de teste
Versão: ${data.version||build()}
Data: ${new Date().toLocaleString('pt-BR')}
Nome: ${data.testerName||'não informado'}
Função: ${data.testerRole||'não informada'}
Aparelho: ${data.deviceInfo||'não informado'}
Tela: ${data.screen||'não identificada'}
Área testada: ${data.testedArea||'não informada'}
Nota geral: ${data.overallScore||'sem nota'}

O que funcionou bem:
${data.workedWell||'-'}

O que ficou confuso ou falhou:
${data.issueFound||'-'}

Sugestão de melhoria:
${data.suggestion||'-'}`;
  }
  function render(){
    const data=collect();
    const preview=$('feedback-preview');
    if(preview) preview.textContent=text(data);
  }
  function hydrate(){
    const data=read();
    const map={testerName:'tester-name',testerRole:'tester-role',deviceInfo:'device-info',overallScore:'overall-score',testedArea:'tested-area',workedWell:'worked-well',issueFound:'issue-found',suggestion:'suggestion'};
    Object.entries(map).forEach(([key,id])=>{if(data[key]&&$(id))$(id).value=data[key];});
  }
  async function saveCloud(data){
    const auth=state();
    if(!(auth.isAuthenticated&&auth.mode==='online')) return {skipped:true};
    if(!window.StageMusicFirebase?.configured?.()) return {skipped:true};
    const rt=await window.StageMusicFirebase.init();
    const user=await window.StageMusicFirebase.currentUser();
    if(!user?.uid) return {skipped:true};
    const id=`feedback_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await rt.setDoc(rt.doc(rt.db,'users',user.uid,'testFeedback',id),Object.assign({},data,{id,ownerUid:user.uid,ownerEmail:user.email||auth.email||'',createdAt:now(),updatedAt:now()}),{merge:true});
    return {ok:true,id};
  }
  async function copyCurrent(){
    const data=collect();
    const payload=text(data);
    try{await navigator.clipboard.writeText(payload);return true}catch{alert(payload);return false}
  }
  function setStatus(message,type){
    const box=$('feedback-cloud-status');
    if(!box)return;
    box.textContent=message;
    if(type)box.dataset.state=type;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    window.StageMusicAuth?.ready?.().finally(()=>{
      const auth=state();
      if(auth.isAuthenticated&&auth.mode==='online')setStatus('Conta Google ativa: o feedback também pode ser salvo na sua conta.','saved');
    });
    hydrate();
    fields.forEach(id=>$(id)?.addEventListener('input',()=>{write(collect());render();}));
    $('feedback-form')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const data=collect();
      write(data);
      setStatus('Salvando feedback…');
      try{
        const result=await saveCloud(data);
        if(result.ok)setStatus('Feedback salvo neste aparelho e na sua conta Google.','saved');
        else setStatus('Feedback salvo neste aparelho. Copie e envie pelo WhatsApp se necessário.','saved');
      }catch(error){
        console.warn('Feedback cloud save:',error?.message||error);
        setStatus('Feedback salvo neste aparelho. Não foi possível enviar para a nuvem agora.','error');
      }
      render();
    });
    $('copy-feedback')?.addEventListener('click',async()=>{if(await copyCurrent()){const btn=$('copy-feedback');btn.textContent='Copiado';setTimeout(()=>btn.textContent='Copiar feedback',1500);}});
    $('share-feedback')?.addEventListener('click',async()=>{
      const payload=text(collect());
      if(navigator.share){try{await navigator.share({title:'Feedback Stage Music',text:payload});return}catch{}}
      await copyCurrent();
    });
    render();
  });
})();
