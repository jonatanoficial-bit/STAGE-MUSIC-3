(function(){
'use strict';
const LOCAL_KEY='stage_music_admin_catalog_queue_v1';
const $=id=>document.getElementById(id);
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const now=()=>new Date().toISOString();
const uid=()=>`queue_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let queue=[];
let selectedId='';
let user=null;
let busy=false;

function readLocal(){try{const parsed=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}}
function writeLocal(){localStorage.setItem(LOCAL_KEY,JSON.stringify(queue));window.dispatchEvent(new CustomEvent('stage-music-admin-queue-updated',{detail:{queue}}));}
function queueCollection(rt){return rt.collection(rt.db,'users',user.uid,'adminCatalogQueue');}
function queueDocument(rt,id){return rt.doc(rt.db,'users',user.uid,'adminCatalogQueue',id);}
function normalizeItem(raw={}){
  const item={
    queueId:String(raw.queueId||raw.id||uid()),
    title:String(raw.title||'').trim(),
    artist:String(raw.artist||'').trim(),
    style:String(raw.style||'').trim(),
    tags:Array.isArray(raw.tags)?raw.tags.map(String).map(x=>x.trim()).filter(Boolean):String(raw.tags||'').split(',').map(x=>x.trim()).filter(Boolean),
    key:String(raw.key||'').trim(),
    bpm:String(raw.bpm||'').trim(),
    content:String(raw.content||'').trim(),
    notes:String(raw.notes||'').trim(),
    capo:Math.max(0,Math.min(12,Number(raw.capo||0))),
    globalId:String(raw.globalId||''),
    status:String(raw.status||''),
    error:String(raw.error||''),
    createdAt:raw.createdAt||now(),
    updatedAt:raw.updatedAt||now(),
    publishedAt:raw.publishedAt||''
  };
  return refreshItemState(item);
}
function refreshItemState(item){
  if(item.status==='published'&&item.globalId)return item;
  const duplicate=window.StageMusicGlobalCatalog?.findDuplicate?.(item.title,item.artist);
  item.duplicateGlobalId=duplicate?.id||'';
  item.duplicateTitle=duplicate?.title||'';
  if(item.error)item.status='error';
  else if(!item.title||!item.artist||!item.content)item.status='incomplete';
  else if(item.duplicateGlobalId)item.status='duplicate';
  else item.status='ready';
  return item;
}
function refreshAllStates(){queue=queue.map(refreshItemState);writeLocal();}
function setGate(text,state='info',detail=''){
  const gate=$('catalog-admin-gate');if(!gate)return;
  gate.dataset.state=state;
  gate.innerHTML=`<strong>${esc(text)}</strong>${detail?`<span>${esc(detail)}</span>`:''}`;
}
function setProgress(text,state='info'){
  const node=$('catalog-admin-progress');if(!node)return;
  node.textContent=text;node.dataset.state=state;
}
function itemStatusLabel(item){
  if(item.status==='published')return'Publicada';
  if(item.status==='ready')return'Pronta';
  if(item.status==='duplicate')return'Repetida';
  if(item.status==='error')return'Erro';
  return'Sem conteúdo';
}
function stats(){
  const counts={total:queue.length,ready:0,incomplete:0,duplicates:0,published:0};
  queue.forEach(item=>{if(item.status==='ready')counts.ready++;if(item.status==='incomplete')counts.incomplete++;if(item.status==='duplicate')counts.duplicates++;if(item.status==='published')counts.published++;});
  $('admin-stat-total').textContent=counts.total;
  $('admin-stat-ready').textContent=counts.ready;
  $('admin-stat-incomplete').textContent=counts.incomplete;
  $('admin-stat-duplicates').textContent=counts.duplicates;
  $('admin-stat-published').textContent=counts.published;
}
function filteredQueue(){
  const term=norm($('catalog-queue-search')?.value||'');
  const filter=$('catalog-queue-filter')?.value||'all';
  return queue.filter(item=>{
    if(filter!=='all'&&item.status!==filter)return false;
    if(!term)return true;
    return norm([item.title,item.artist,item.style,item.tags.join(' ')].join(' ')).includes(term);
  }).sort((a,b)=>{
    const order={ready:0,duplicate:1,incomplete:2,error:3,published:4};
    return (order[a.status]??9)-(order[b.status]??9)||new Date(a.createdAt)-new Date(b.createdAt);
  });
}
function renderQueue(){
  const list=$('catalog-queue-list');if(!list)return;
  const items=filteredQueue();
  list.innerHTML=items.length?items.map(item=>`<button class="catalog-queue-item ${item.queueId===selectedId?'active':''}" type="button" data-queue-id="${esc(item.queueId)}"><div class="catalog-queue-item-head"><div><strong>${esc(item.title||'Sem título')}</strong><small>${esc(item.artist||'Sem artista')}</small></div><span class="catalog-queue-chip ${esc(item.status)}">${itemStatusLabel(item)}</span></div><div class="catalog-queue-meta">${item.style?`<span class="catalog-queue-chip">${esc(item.style)}</span>`:''}${item.key?`<span class="catalog-queue-chip">Tom ${esc(item.key)}</span>`:''}${item.bpm?`<span class="catalog-queue-chip">${esc(item.bpm)} BPM</span>`:''}${item.duplicateGlobalId?'<span class="catalog-queue-chip duplicate">Já existe global</span>':''}</div></button>`).join(''):'<div class="catalog-queue-empty"><strong>Nenhum item nesta visualização</strong><p>Importe uma planilha ou crie uma música manualmente.</p></div>';
  stats();
}
function selectedItem(){return queue.find(item=>item.queueId===selectedId)||null;}
function setEditorDisabled(disabled){$('catalog-item-editor')?.classList.toggle('is-disabled',disabled);}
function fillEditor(item){
  setEditorDisabled(!item);
  const values={
    'catalog-queue-id':item?.queueId||'',
    'catalog-item-title':item?.title||'',
    'catalog-item-artist':item?.artist||'',
    'catalog-item-style':item?.style||'',
    'catalog-item-tags':item?.tags?.join(', ')||'',
    'catalog-item-key':item?.key||'',
    'catalog-item-bpm':item?.bpm||'',
    'catalog-item-capo':String(item?.capo||0),
    'catalog-item-notes':item?.notes||'',
    'catalog-item-content':item?.content||''
  };
  Object.entries(values).forEach(([id,value])=>{if($(id))$(id).value=value;});
  $('catalog-item-heading').textContent=item?(item.title||'Nova música'):'Editar item da fila';
  const badge=$('catalog-item-status-badge');
  badge.textContent=item?itemStatusLabel(item):'Selecione um item';
  badge.className=`catalog-source-badge ${item?.status==='ready'||item?.status==='published'?'global':'private'}`;
  const duplicate=$('catalog-duplicate-alert');
  if(item?.duplicateGlobalId){duplicate.hidden=false;duplicate.innerHTML=`Já existe uma cifra global com este título e artista: <strong>${esc(item.duplicateTitle||item.title)}</strong>. A política selecionada define se ela será ignorada, atualizada ou publicada como nova versão.`;}
  else{duplicate.hidden=true;duplicate.textContent='';}
}
function selectItem(id){selectedId=id;fillEditor(selectedItem());renderQueue();}
function editorPayload(){return normalizeItem({
  queueId:$('catalog-queue-id').value||selectedId||uid(),
  title:$('catalog-item-title').value,
  artist:$('catalog-item-artist').value,
  style:$('catalog-item-style').value,
  tags:$('catalog-item-tags').value,
  key:$('catalog-item-key').value,
  bpm:$('catalog-item-bpm').value,
  capo:$('catalog-item-capo').value,
  notes:$('catalog-item-notes').value,
  content:$('catalog-item-content').value,
  globalId:selectedItem()?.globalId||'',
  status:selectedItem()?.status||'',
  createdAt:selectedItem()?.createdAt||now(),
  publishedAt:selectedItem()?.publishedAt||'',
  updatedAt:now()
});}
async function saveCloudItem(item){
  if(!user||!window.StageMusicFirebase?.configured?.())return false;
  const rt=await window.StageMusicFirebase.init();
  await rt.setDoc(queueDocument(rt,item.queueId),item,{merge:true});
  return true;
}
async function deleteCloudItem(id){
  if(!user||!window.StageMusicFirebase?.configured?.())return false;
  const rt=await window.StageMusicFirebase.init();
  await rt.deleteDoc(queueDocument(rt,id));return true;
}
async function upsertItem(item,{cloud=true}={}){
  item=normalizeItem(item);item.updatedAt=now();
  const index=queue.findIndex(entry=>entry.queueId===item.queueId);
  if(index>=0)queue[index]=item;else queue.push(item);
  writeLocal();renderQueue();if(selectedId===item.queueId)fillEditor(item);
  if(cloud){try{await saveCloudItem(item)}catch(error){console.warn('Fila administrativa na nuvem:',error?.message||error);setProgress('Item salvo localmente, mas a nuvem não confirmou. Tente Sincronizar fila.','error');}}
  return item;
}
async function removeItem(id){queue=queue.filter(item=>item.queueId!==id);writeLocal();if(selectedId===id){selectedId='';fillEditor(null);}renderQueue();try{await deleteCloudItem(id)}catch(error){console.warn('Remoção da fila na nuvem:',error?.message||error)}}
async function loadCloudQueue(){
  if(!user||!window.StageMusicFirebase?.configured?.())return[];
  const rt=await window.StageMusicFirebase.init();
  const snap=await rt.getDocs(queueCollection(rt));
  const cloud=[];snap.forEach(docSnap=>cloud.push(normalizeItem(Object.assign({},docSnap.data(),{queueId:docSnap.id}))));
  return cloud;
}
function mergeQueues(local,cloud){
  const map=new Map();
  [...local,...cloud].forEach(raw=>{const item=normalizeItem(raw),current=map.get(item.queueId);if(!current||new Date(item.updatedAt)>=new Date(current.updatedAt))map.set(item.queueId,item);});
  return [...map.values()];
}
async function syncQueue(){
  if(busy)return;busy=true;setProgress('Sincronizando a fila administrativa…');
  try{
    const cloud=await loadCloudQueue();
    queue=mergeQueues(queue,cloud);writeLocal();
    for(let i=0;i<queue.length;i++){await saveCloudItem(queue[i]);if(i%10===0)setProgress(`Sincronizando ${i+1}/${queue.length}…`);}
    refreshAllStates();renderQueue();if(selectedId)fillEditor(selectedItem());
    setProgress(`Fila sincronizada: ${queue.length} item(ns) disponíveis nesta conta Google.`,'ok');
  }catch(error){setProgress(error?.message||'Não foi possível sincronizar a fila.','error');}
  finally{busy=false;}
}
function parseDelimited(text,delimiter){
  const rows=[];let row=[],cell='',quoted=false;
  const source=String(text||'').replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++){
    const char=source[i];
    if(char==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(char===delimiter&&!quoted){row.push(cell);cell='';}
    else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);row=[];cell='';}
    else cell+=char;
  }
  row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);
  return rows;
}
function detectDelimiter(text){const first=String(text||'').split(/\r?\n/,1)[0]||'';if(first.includes('\t'))return'\t';if(first.includes(';'))return';';return',';}
function headerKey(value){return norm(value).replace(/[^a-z0-9]+/g,' ');}
function mapHeaders(row){
  const map={};row.forEach((value,index)=>{
    const key=headerKey(value);
    if(['musica','titulo','nome da musica','song','title'].includes(key))map.title=index;
    else if(['artista','cantor','banda','ministerio','artist'].includes(key))map.artist=index;
    else if(['estilo','genero','style'].includes(key))map.style=index;
    else if(['tags','tag','categorias'].includes(key))map.tags=index;
    else if(['tom','tom oficial','key'].includes(key))map.key=index;
    else if(['bpm','bpm oficial','andamento'].includes(key))map.bpm=index;
    else if(['conteudo','conteudo da cifra','cifra','letra e acordes','content'].includes(key))map.content=index;
    else if(['observacoes','observacao','notas','notas do palco','notes'].includes(key))map.notes=index;
    else if(['capotraste','capo'].includes(key))map.capo=index;
  });return map;
}
function importRows(text){
  const delimiter=detectDelimiter(text),rows=parseDelimited(text,delimiter);
  if(!rows.length)throw new Error('Nenhuma linha válida encontrada.');
  let map=mapHeaders(rows[0]),start=0;
  if(map.title!==undefined||map.artist!==undefined)start=1;
  else map={title:0,artist:1,style:2,tags:3,key:4,bpm:5,content:6,notes:7,capo:8};
  const imported=[];
  for(let i=start;i<rows.length;i++){
    const row=rows[i],get=key=>map[key]===undefined?'':String(row[map[key]]||'').trim();
    const title=get('title'),artist=get('artist');if(!title&&!artist)continue;
    imported.push(normalizeItem({title,artist,style:get('style'),tags:get('tags'),key:get('key'),bpm:get('bpm'),content:get('content'),notes:get('notes'),capo:get('capo')||0}));
  }
  return imported;
}
async function addImported(items){
  let added=0,updated=0;
  for(const item of items){
    const existing=queue.find(entry=>norm(entry.title)===norm(item.title)&&norm(entry.artist)===norm(item.artist)&&entry.status!=='published');
    if(existing){
      const merged=normalizeItem(Object.assign({},existing,{style:item.style||existing.style,tags:item.tags.length?item.tags:existing.tags,key:item.key||existing.key,bpm:item.bpm||existing.bpm,content:item.content||existing.content,notes:item.notes||existing.notes,capo:item.capo||existing.capo,updatedAt:now()}));
      await upsertItem(merged,{cloud:true});updated++;
    }else{await upsertItem(item,{cloud:true});added++;}
    if((added+updated)%15===0)setProgress(`Importando ${added+updated}/${items.length}…`);
  }
  refreshAllStates();renderQueue();
  return{added,updated};
}
function duplicateTarget(item,policy){
  if(item.globalId)return item.globalId;
  if(!item.duplicateGlobalId)return'';
  if(policy==='update')return item.duplicateGlobalId;
  if(policy==='version')return'';
  throw new Error(`“${item.title}” já existe. Altere a política de repetidas para atualizar ou criar nova versão.`);
}
async function publishItem(item,{next=false,policy=null}={}){
  item=normalizeItem(item);
  if(!item.title||!item.artist)throw new Error('Informe música e artista.');
  if(!item.content)throw new Error(`Cole o conteúdo da cifra de “${item.title}” antes de publicar.`);
  const duplicatePolicy=policy||$('catalog-duplicate-policy').value||'skip';
  const target=duplicateTarget(item,duplicatePolicy);
  const saved=await window.StageMusicGlobalCatalog.publishSong({title:item.title,artist:item.artist,style:item.style,key:item.key||'C',bpm:item.bpm||'72',tags:item.tags,notes:item.notes,content:item.content,capo:item.capo},target);
  item.globalId=saved.id;item.status='published';item.error='';item.publishedAt=now();item.updatedAt=now();item.duplicateGlobalId=saved.id;
  await upsertItem(item,{cloud:true});
  setProgress(`Publicação confirmada: ${item.title}.`,'ok');
  if(next){const nextItem=queue.find(entry=>entry.queueId!==item.queueId&&entry.status!=='published');if(nextItem)selectItem(nextItem.queueId);else{selectedId='';fillEditor(null);}}
  return item;
}
async function publishAllReady(){
  if(busy)return;const policy=$('catalog-duplicate-policy').value||'skip';
  const candidates=queue.filter(item=>item.content&&item.title&&item.artist&&item.status!=='published');
  if(!candidates.length){setProgress('Nenhuma cifra completa aguardando publicação.','error');return;}
  if(!confirm(`Publicar ${candidates.length} cifra(s) completa(s)? A política para repetidas será: ${$('catalog-duplicate-policy').selectedOptions[0].textContent}.`))return;
  busy=true;toggleBusy(true);let success=0,skipped=0,errors=0;
  for(let i=0;i<candidates.length;i++){
    const item=candidates[i];setProgress(`Publicando ${i+1}/${candidates.length}: ${item.title}…`);
    try{await publishItem(item,{policy});success++;}
    catch(error){if(policy==='skip'&&item.duplicateGlobalId){skipped++;item.error='';item.status='duplicate';await upsertItem(item,{cloud:true});}else{errors++;item.error=error?.message||'Falha na publicação';item.status='error';await upsertItem(item,{cloud:true});}}
    await sleep(180);
  }
  busy=false;toggleBusy(false);refreshAllStates();renderQueue();if(selectedId)fillEditor(selectedItem());
  setProgress(`Lote concluído: ${success} publicada(s), ${skipped} repetida(s) ignorada(s), ${errors} erro(s).`,errors?'error':'ok');
}
function toggleBusy(on){document.querySelectorAll('#catalog-admin-content button').forEach(button=>{if(!['clear-import-text'].includes(button.id))button.disabled=on;});}
function downloadModel(){
  const header='Música\tArtista\tEstilo\tTags\tTom oficial\tBPM oficial\tConteúdo da cifra\tObservações\tCapotraste\n';
  const example='Exemplo\tArtista\tWorship\tAdoração, Ao vivo\tC\t72\t[Intro]\\nC  G  Am  F\tEntrada suave\t0\n';
  const blob=new Blob([header+example],{type:'text/tab-separated-values;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MODELO-CATALOGO-STAGE-MUSIC.tsv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function openInMainEditor(){
  const item=editorPayload();sessionStorage.setItem('stage_music_admin_editor_transfer',JSON.stringify(item));location.href='inserir-cifra.html?adminTransfer=1';
}
async function init(){
  if(!document.body.matches('[data-page="catalogo-admin"]'))return;
  const ok=await window.StageMusicAuth?.ensureAuthenticated?.('catalogo-admin.html');if(!ok)return;
  user=await window.StageMusicFirebase?.currentUser?.();
  if(!user){setGate('Conta online necessária','Entre com Google para usar a Central Administrativa.','error');return;}
  await window.StageMusicGlobalCatalog?.start?.();
  if(!window.StageMusicGlobalCatalog?.isAdminUser?.(user)){setGate('Acesso restrito','Esta central está disponível somente para a conta administradora do catálogo.','error');return;}
  setGate(`Administrador conectado: ${user.email||user.uid}`,'ok','A fila é restaurada nesta conta e cada publicação recebe confirmação individual do Firestore.');
  $('catalog-admin-content').hidden=false;
  queue=readLocal().map(normalizeItem);
  try{const cloud=await loadCloudQueue();queue=mergeQueues(queue,cloud);writeLocal();}catch(error){console.warn('Fila administrativa offline:',error?.message||error);}
  refreshAllStates();renderQueue();fillEditor(null);

  $('catalog-queue-list').addEventListener('click',event=>{const button=event.target.closest('[data-queue-id]');if(button)selectItem(button.dataset.queueId);});
  $('catalog-queue-search').addEventListener('input',renderQueue);
  $('catalog-queue-filter').addEventListener('change',renderQueue);
  $('new-queue-item').addEventListener('click',async()=>{const item=await upsertItem(normalizeItem({}),{cloud:true});selectItem(item.queueId);$('catalog-item-title').focus();});
  $('save-queue-item').addEventListener('click',async()=>{const item=await upsertItem(editorPayload(),{cloud:true});selectedId=item.queueId;fillEditor(item);setProgress('Item salvo na fila e vinculado à sua conta Google.','ok');});
  $('remove-queue-item').addEventListener('click',async()=>{const item=selectedItem();if(!item)return;if(!confirm(`Remover “${item.title||'este item'}” da fila? A cifra global já publicada não será apagada.`))return;await removeItem(item.queueId);setProgress('Item removido da fila.','ok');});
  $('publish-current-item').addEventListener('click',async()=>{try{const item=await upsertItem(editorPayload(),{cloud:true});selectedId=item.queueId;await publishItem(item);}catch(error){setProgress(error?.message||'Falha na publicação.','error');}});
  $('publish-current-next').addEventListener('click',async()=>{try{const item=await upsertItem(editorPayload(),{cloud:true});selectedId=item.queueId;await publishItem(item,{next:true});}catch(error){setProgress(error?.message||'Falha na publicação.','error');}});
  $('publish-ready-queue').addEventListener('click',publishAllReady);
  $('sync-admin-queue').addEventListener('click',syncQueue);
  $('clear-published-queue').addEventListener('click',async()=>{const done=queue.filter(item=>item.status==='published');if(!done.length)return setProgress('Não há itens concluídos para remover.');if(!confirm(`Remover ${done.length} item(ns) publicados da fila? As cifras globais serão preservadas.`))return;for(const item of done)await deleteCloudItem(item.queueId).catch(()=>{});queue=queue.filter(item=>item.status!=='published');writeLocal();selectedId='';fillEditor(null);renderQueue();setProgress('Itens concluídos removidos. O catálogo global foi preservado.','ok');});
  $('open-item-main-editor').addEventListener('click',openInMainEditor);
  $('download-import-model').addEventListener('click',downloadModel);
  $('clear-import-text').addEventListener('click',()=>{$('catalog-import-text').value='';$('catalog-import-status').textContent='Área de importação limpa.';});
  $('catalog-import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;$('catalog-import-text').value=await file.text();$('catalog-import-status').textContent=`Arquivo carregado: ${file.name}`;});
  $('import-to-queue').addEventListener('click',async()=>{try{const items=importRows($('catalog-import-text').value);setProgress(`Importando ${items.length} linha(s)…`);const result=await addImported(items);$('catalog-import-status').textContent=`${result.added} nova(s), ${result.updated} atualizada(s).`;setProgress(`Importação concluída: ${result.added} nova(s) e ${result.updated} atualizada(s).`,'ok');if(!selectedId&&queue[0])selectItem(queue[0].queueId);}catch(error){setProgress(error?.message||'Não foi possível importar.','error');}});
}
window.StageMusicCatalogAdminTools={parseDelimited,detectDelimiter,importRows,normalizeItem,mergeQueues};
document.addEventListener('DOMContentLoaded',init);
})();
