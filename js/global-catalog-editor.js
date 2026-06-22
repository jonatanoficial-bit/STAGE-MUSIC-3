(function(){
'use strict';
const $=id=>document.getElementById(id);
const formPayload=()=>({
  id:$('song-id')?.value||'',
  title:$('song-title')?.value||'',
  artist:$('song-artist')?.value||'',
  style:$('song-style')?.value||'',
  key:$('song-key')?.value||'C',
  bpm:$('song-bpm')?.value||'72',
  tags:$('song-tags')?.value||'',
  notes:$('song-notes')?.value||'',
  content:$('song-content')?.value||'',
  capo:Number($('song-capo')?.value||0)
});
const fireInput=(node)=>{if(!node)return;node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
const hasEditorData=()=>{const p=formPayload();return !!(p.title.trim()||p.artist.trim()||p.content.trim()||p.tags.trim()||p.notes.trim());};
function fill(song,{privateCopy=false}={}){
  if(!song)return;
  const values={
    'song-id':privateCopy?'':song.id||'',
    'song-title':song.title||'',
    'song-artist':song.artist||'',
    'song-style':song.style||'',
    'song-key':song.key||'C',
    'song-bpm':song.bpm||72,
    'song-tags':Array.isArray(song.tags)?song.tags.join(', '):(song.tags||''),
    'song-notes':song.notes||'',
    'song-content':song.content||'',
    'song-capo':song.capo||0
  };
  Object.entries(values).forEach(([id,value])=>{const node=$(id);if(node){node.value=value;fireInput(node)}});
}
function status(text,state='info'){const node=$('global-catalog-editor-status');if(!node)return;node.textContent=text;node.dataset.state=state;}
function updateModeUi(){
  const id=$('global-song-id')?.value||'';
  const publish=$('publish-global-song');
  const next=$('publish-global-next');
  const remove=$('delete-global-song');
  if(publish)publish.textContent=id?'Salvar alterações globais':'Publicar no catálogo global';
  if(next)next.textContent=id?'Salvar e preparar nova cifra':'Publicar e preparar nova cifra';
  if(remove)remove.hidden=!id;
  document.querySelectorAll('[data-global-mode]').forEach(node=>node.textContent=id?'Editando cifra global existente':'Nova cifra global');
}
function clearGlobalIdentity(){
  if($('global-song-id'))$('global-song-id').value='';
  updateModeUi();
}
function resetForNext(message='Editor pronto para a próxima cifra global.'){
  window.StageMusicEditor?.clear?.({confirmUser:false,message:''});
  clearGlobalIdentity();
  status(message,'ok');
  $('song-title')?.focus();
}
async function loadTarget(){
  const params=new URLSearchParams(location.search),globalId=params.get('global'),copyId=params.get('copyGlobal'),localId=params.get('local');
  if(params.get('adminTransfer')==='1'){
    try{const raw=sessionStorage.getItem('stage_music_admin_editor_transfer');const item=raw?JSON.parse(raw):null;sessionStorage.removeItem('stage_music_admin_editor_transfer');if(item){fill(item,{privateCopy:true});if($('global-song-id'))$('global-song-id').value=item.globalId||'';status(item.globalId?'Item da fila carregado para atualizar a cifra global.':'Item da fila carregado para nova publicação global.','ok');updateModeUi();return;}}catch(error){console.warn('Transferência da fila administrativa:',error)}}
  if(localId){const song=window.StageMusicLocalDB?.getSongById(localId);if(song){fill(song);status('Cifra privada carregada para edição.','ok')}}
  if(!globalId&&!copyId){updateModeUi();return;}
  let song=window.StageMusicGlobalCatalog?.getSongById(globalId||copyId);
  if(!song){try{await window.StageMusicGlobalCatalog?.refresh?.();song=window.StageMusicGlobalCatalog?.getSongById(globalId||copyId)}catch(error){status(error?.message||'Não foi possível carregar a cifra global.','error');return}}
  if(!song){status('Cifra global não encontrada.','error');return}
  if(copyId){fill(song,{privateCopy:true});$('global-song-id').value='';status('Cópia privada carregada. Salve normalmente na sua biblioteca.','ok');updateModeUi();return}
  fill(song,{privateCopy:true});$('global-song-id').value=song.id;status(`Editando cifra global: ${song.title}`,'ok');updateModeUi();
}
async function updateAdminUi(){
  const panel=$('global-admin-panel');if(!panel)return false;
  await window.StageMusicAuth?.ready?.();
  let isAdmin=window.StageMusicGlobalCatalog?.isAdmin?.()||false;
  try{const user=await window.StageMusicFirebase?.currentUser?.();isAdmin=window.StageMusicGlobalCatalog?.isAdminUser?.(user)||isAdmin}catch{}
  panel.hidden=!isAdmin;
  if(isAdmin)status('Administrador confirmado. Cada nova publicação recebe um ID próprio.','ok');
  return isAdmin;
}
async function publishCurrent({prepareNext=false}={}){
  const button=prepareNext?$('publish-global-next'):$('publish-global-song');
  if(button)button.disabled=true;
  try{
    const payload=formPayload();
    if(!payload.title.trim()||!payload.artist.trim())throw new Error('Informe título e artista antes de publicar.');
    if(!payload.content.trim())throw new Error('Cole o conteúdo completo da cifra antes de publicar.');
    const currentId=$('global-song-id').value;
    if(!currentId){
      const duplicate=window.StageMusicGlobalCatalog?.findDuplicate?.(payload.title,payload.artist);
      if(duplicate){
        const update=confirm(`Já existe “${duplicate.title}” de ${duplicate.artist} no catálogo.\n\nOK: atualizar a existente.\nCancelar: criar uma nova versão.`);
        if(update)$('global-song-id').value=duplicate.id;
      }
    }
    const saved=await window.StageMusicGlobalCatalog.publishSong(payload,$('global-song-id').value);
    $('global-song-id').value=saved.id;
    updateModeUi();
    status(`Publicação confirmada no Firestore: ${saved.title}`,'ok');
    if(prepareNext)resetForNext(`“${saved.title}” publicada. Editor zerado com segurança para a próxima cifra.`);
    return saved;
  }catch(error){status(error?.message||'Não foi possível publicar a cifra global.','error');throw error;}
  finally{if(button)button.disabled=false;}
}
document.addEventListener('DOMContentLoaded',async()=>{
  if(!document.body.matches('[data-page="inserir-cifra"]'))return;
  if(!await window.StageMusicAuth?.ensureAuthenticated?.('inserir-cifra.html'))return;
  await window.StageMusicGlobalCatalog?.start?.();
  const isAdmin=await updateAdminUi();
  await loadTarget();
  updateModeUi();
  window.addEventListener('stage-music-auth-changed',updateAdminUi);
  window.addEventListener('stage-music-editor-cleared',()=>{clearGlobalIdentity();status('Editor limpo. A próxima publicação criará uma cifra global nova.','ok');});
  $('new-global-song')?.addEventListener('click',()=>{
    if(hasEditorData()&&!confirm('Iniciar uma nova cifra global? Os campos atuais serão limpos.'))return;
    resetForNext();
  });
  $('publish-global-song')?.addEventListener('click',()=>publishCurrent().catch(()=>{}));
  $('publish-global-next')?.addEventListener('click',()=>publishCurrent({prepareNext:true}).catch(()=>{}));
  $('delete-global-song')?.addEventListener('click',async()=>{
    const id=$('global-song-id').value;if(!id)return;
    if(!confirm('Remover esta cifra do catálogo global? As cópias privadas dos usuários serão preservadas.'))return;
    const button=$('delete-global-song');button.disabled=true;
    try{await window.StageMusicGlobalCatalog.deleteSong(id);resetForNext('Cifra removida do catálogo. Editor pronto para uma nova publicação.');}
    catch(error){status(error?.message||'Não foi possível remover a cifra global.','error');}
    finally{button.disabled=false;}
  });
  if(isAdmin&&new URLSearchParams(location.search).get('newGlobal')==='1')resetForNext();
});
})();
