(function(){
'use strict';
const ROOMS_KEY='stage_music_live_rooms_v1',CURRENT_KEY='stage_music_current_room',SETLIST_KEY='stage_music_setlists_v1',ACTIVE='stage_music_active_setlist';
const sharing=window.StageMusicLiveSharing,H=window.StageMusicHarmonic;
const KEY_OPTIONS=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B','Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm'];
const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
const read=(key,fallback)=>window.StageMusicSafeStorage?.get?.(key,fallback)??safeParse(localStorage.getItem(key),fallback);
const write=(key,value)=>window.StageMusicSafeStorage?.set?.(key,value)??(localStorage.setItem(key,JSON.stringify(value)),true);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const channel='BroadcastChannel'in window?new BroadcastChannel('stage-music-live-room'):null;
let lastCommandAt='',lastFlowAt='',remoteStop=null,remoteCode='',dockBound=false;

function now(){return new Date().toISOString()}
function context(){const current=read(CURRENT_KEY,null),rooms=read(ROOMS_KEY,{});return current?.code?{current,room:rooms[current.code]||null,rooms}:null}
function isDirector(ctx=context()){return !!(ctx?.room&&ctx.current?.role==='director'&&ctx.room.directorId===ctx.current.memberId)}
function resolveList(room){const localLists=read(SETLIST_KEY,[]);return sharing?.resolveRoomSetlist?.(room,localLists)||(localLists.find(item=>item.id===room?.setlistId))||null}
function roomSong(room,list=resolveList(room)){return list?.songs?.[Number(room?.index)||0]||null}
function savedKey(room,list=resolveList(room)){const song=roomSong(room,list);return String(song?.key||song?.originalKey||'C')}
function effectiveKey(room,list=resolveList(room)){
 const base=savedKey(room,list),flow=room?.flow||{};
 if(flow.targetKey)return String(flow.targetKey);
 if(Number(flow.modulation)&&H)return H.transposeKey(base,Number(flow.modulation),'preserve');
 return base;
}
function keyOptions(selected){return KEY_OPTIONS.map(key=>`<option value="${key}" ${key===selected?'selected':''}>${key}</option>`).join('')}
function ensureBanner(){let banner=document.getElementById('live-room-banner');if(banner)return banner;banner=document.createElement('section');banner.id='live-room-banner';banner.className='live-room-banner';banner.hidden=true;document.getElementById('live-song-head')?.after(banner);return banner}
function ensureFlowPanel(){let panel=document.getElementById('live-worship-flow');if(panel)return panel;panel=document.createElement('section');panel.id='live-worship-flow';panel.className='live-worship-flow';panel.hidden=true;panel.innerHTML='<div><small>WORSHIP FLOW</small><strong id="live-flow-main">Fluxo normal</strong></div><div class="live-flow-tags"><span id="live-flow-section">Seção automática</span><span id="live-flow-dynamics">Dinâmica normal</span><span id="live-flow-modulation">Tom do repertório</span></div>';document.getElementById('live-song-head')?.after(panel);return panel}
function ensureDirectorAlert(){let alert=document.getElementById('live-director-alert');if(alert)return alert;alert=document.createElement('aside');alert.id='live-director-alert';alert.className='live-director-alert';alert.hidden=true;alert.setAttribute('role','alert');alert.setAttribute('aria-live','assertive');alert.innerHTML='<span>DIREÇÃO MUSICAL</span><strong id="live-director-alert-text"></strong><small id="live-director-alert-time"></small>';document.body.appendChild(alert);return alert}
function showDirectorAlert(room){const alert=ensureDirectorAlert(),text=document.getElementById('live-director-alert-text'),time=document.getElementById('live-director-alert-time');if(!alert||!room?.command)return;text.textContent=room.command;time.textContent=`${room.commandType==='tone'?'TOM DA APRESENTAÇÃO':room.commandType==='cue'?'COMANDO AO VIVO':'AVISO DO DIRETOR'} • ${new Date(room.commandAt||Date.now()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;alert.dataset.type=room.commandType||'message';alert.hidden=false;alert.classList.remove('show');requestAnimationFrame(()=>alert.classList.add('show'));clearTimeout(showDirectorAlert.timer);showDirectorAlert.timer=setTimeout(()=>{alert.classList.remove('show');setTimeout(()=>alert.hidden=true,260)},8000)}
function normalizeText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function gotoSection(name){if(!name)return;const target=normalizeText(name),buttons=[...document.querySelectorAll('#section-buttons button')];buttons.find(button=>normalizeText(button.textContent)===target||normalizeText(button.textContent).includes(target)||target.includes(normalizeText(button.textContent)))?.click()}
async function persistRoom(ctx,room){
 if(!ctx?.current?.code||!room)return;
 ctx.rooms[ctx.current.code]=room;write(ROOMS_KEY,ctx.rooms);channel?.postMessage({type:'rooms-updated',at:now()});
 if(window.StageMusicFirebaseLive?.isReady?.()&&window.StageMusicAuth?.getState?.().mode==='online'){
  try{await window.StageMusicFirebaseLive.putRoom(room)}catch(error){console.warn('Central do Diretor:',error?.message||error);throw error}
 }
}
function defaultFlow(){return{section:'',mode:'normal',dynamics:'normal',modulation:0,targetKey:'',cue:'',updatedAt:'',history:[]}}
function updateRoomCommand(room,text,type='system'){room.command=String(text||'').trim();room.commandAt=now();room.commandType=type;room.updatedAt=now()}
function applyFlow(flow,ctx=context(),list=ctx?.room?resolveList(ctx.room):null){
 const panel=ensureFlowPanel(),room=ctx?.room;
 if(!room){panel.hidden=true;window.StageMusicLiveMode?.setTemporaryKey?.('');return}
 const base=savedKey(room,list),target=effectiveKey(room,list),special=!!(flow?.updatedAt||flow?.section||(flow?.mode&&flow.mode!=='normal')||(flow?.dynamics&&flow.dynamics!=='normal')||target!==base);
 panel.hidden=!special;
 const modeLabels={normal:'Fluxo normal',repeat:'Repetir seção',vamp:'Vamp contínuo',ministry:'Ministração',spontaneous:'Espontâneo',ending:'Preparar final'};
 const dynLabels={normal:'Dinâmica normal',soft:'Dinâmica suave',build:'Crescendo',full:'Banda completa',drop:'Corte / somente voz'};
 document.getElementById('live-flow-main').textContent=modeLabels[flow?.mode]||'Fluxo atualizado';
 document.getElementById('live-flow-section').textContent=flow?.section?`Seção: ${flow.section}`:'Seção automática';
 document.getElementById('live-flow-dynamics').textContent=dynLabels[flow?.dynamics]||'Dinâmica normal';
 document.getElementById('live-flow-modulation').textContent=target===base?`Tom ${base}`:`Tom ${target}`;
 window.StageMusicLiveMode?.setTemporaryKey?.(target===base?'':target);
 if(flow?.updatedAt&&flow.updatedAt!==lastFlowAt){
  lastFlowAt=flow.updatedAt;
  if(flow.section)setTimeout(()=>gotoSection(flow.section),120);
  const repeat=document.getElementById('section-repeat');
  if(flow.mode==='repeat'&&repeat&&!repeat.classList.contains('active'))repeat.click();
  if(flow.mode!=='repeat'&&repeat?.classList.contains('active'))repeat.click();
  window.StageMusicToast?.(`${modeLabels[flow.mode]||'Fluxo'} • ${target===base?`Tom ${base}`:`Tom ${target}`}`);
 }
}
function ensureRemoteSubscription(){
 const current=read(CURRENT_KEY,null),code=current?.code||'';
 if(!code||!window.StageMusicFirebaseLive?.isReady?.()||window.StageMusicAuth?.getState?.().mode!=='online'){remoteStop?.();remoteStop=null;remoteCode='';return}
 if(remoteCode===code&&remoteStop)return;
 remoteStop?.();remoteCode=code;
 remoteStop=window.StageMusicFirebaseLive.subscribe(code,(remote)=>{if(!remote)return;const rooms=read(ROOMS_KEY,{});rooms[code]=remote;write(ROOMS_KEY,rooms);sync()},error=>console.warn('Sala Live online no leitor:',error?.message||error));
}
function renderDirectorDock(ctx,list){
 const toggle=document.getElementById('director-dock-toggle'),dock=document.getElementById('director-live-dock'),director=isDirector(ctx);
 if(!toggle||!dock)return;
 const rail=document.getElementById('director-quick-rail');
 toggle.hidden=!director;dock.hidden=!director||!dock.classList.contains('open');if(rail)rail.hidden=!director;
 document.body.classList.toggle('live-room-director',director);
 document.body.classList.toggle('live-room-member',!!ctx?.room&&!director);
 if(!director)return;
 const room=ctx.room,song=roomSong(room,list),base=savedKey(room,list),target=effectiveKey(room,list),select=document.getElementById('director-live-key');
 document.getElementById('director-dock-room').textContent=`${room.code} • ${(room.members||[]).length} conectados`;
 document.getElementById('director-dock-position').textContent=`${Number(room.index||0)+1} / ${list?.songs?.length||0}`;
 document.getElementById('director-dock-title').textContent=song?.title||'Sem música';
 document.getElementById('director-dock-saved-key').textContent=target===base?`Tom salvo ${base}`:`Temporário ${target} • salvo ${base}`;
 if(select){select.innerHTML=keyOptions(target);select.value=target}
 document.getElementById('director-live-prev').disabled=Number(room.index||0)<=0;
 document.getElementById('director-live-next').disabled=Number(room.index||0)>=(list?.songs?.length||1)-1;const history=document.getElementById('director-live-message-history');if(history){const messages=room.messages||[];history.innerHTML=messages.length?messages.slice(0,4).map(item=>`<article><strong>${esc(item.text)}</strong><small>${esc(item.author||'Direção')} • ${new Date(item.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></article>`).join(''):'<small>Nenhum aviso enviado.</small>'}
}
async function setRoomIndex(target){
 const ctx=context();if(!isDirector(ctx))return;
 const list=resolveList(ctx.room),next=Math.max(0,Math.min(Number(target)||0,(list?.songs?.length||1)-1));
 if(next===Number(ctx.room.index||0))return;
 ctx.room.index=next;ctx.room.flow=defaultFlow();updateRoomCommand(ctx.room,'');await persistRoom(ctx,ctx.room).catch(()=>{});
}
async function applyDirectorKey(){
 const ctx=context();if(!isDirector(ctx))return window.StageMusicToast?.('Somente o diretor pode trocar o tom.');
 const list=resolveList(ctx.room),base=savedKey(ctx.room,list),selected=document.getElementById('director-live-key')?.value||base;
 ctx.room.flow=Object.assign(defaultFlow(),ctx.room.flow||{},{targetKey:selected===base?'':selected,modulation:0,updatedAt:now()});
 updateRoomCommand(ctx.room,selected===base?`Tom restaurado para ${base}`:`Tom alterado para ${selected}`,'tone');
 await persistRoom(ctx,ctx.room).catch(()=>{});
 applyFlow(ctx.room.flow,ctx,list);renderDirectorDock(ctx,list);
}
async function resetDirectorKey(){
 const ctx=context();if(!isDirector(ctx))return;
 const list=resolveList(ctx.room),base=savedKey(ctx.room,list),select=document.getElementById('director-live-key');if(select)select.value=base;
 ctx.room.flow=Object.assign(defaultFlow(),ctx.room.flow||{},{targetKey:'',modulation:0,updatedAt:now()});updateRoomCommand(ctx.room,`Tom restaurado para ${base}`,'tone');
 await persistRoom(ctx,ctx.room).catch(()=>{});applyFlow(ctx.room.flow,ctx,list);renderDirectorDock(ctx,list);
}
async function saveDirectorKey(){
 const ctx=context();if(!isDirector(ctx))return window.StageMusicToast?.('Somente o diretor pode salvar o tom.');
 const list=resolveList(ctx.room),selected=document.getElementById('director-live-key')?.value||effectiveKey(ctx.room,list);
 if(!KEY_OPTIONS.includes(selected))return window.StageMusicToast?.('Escolha um tom válido.');
 const localLists=read(SETLIST_KEY,[]),localList=localLists.find(item=>item.id===ctx.room.setlistId);
 if(localList?.songs?.[ctx.room.index]){localList.songs[ctx.room.index].key=selected;localList.updatedAt=now();write(SETLIST_KEY,localLists);window.StageMusicWorkspaceCloud?.saveSetlists?.(localLists,{immediate:true}).catch(error=>console.warn('Proteção permanente do repertório:',error?.message||error));window.StageMusicCloudSync?.syncSetlists?.(localLists).catch(error=>console.warn('Sincronização opcional do repertório:',error?.message||error))}
 if(ctx.room.sharedSetlist?.songs?.[ctx.room.index])ctx.room.sharedSetlist.songs[ctx.room.index].key=selected;
 const resolved=resolveList(ctx.room);if(resolved?.songs?.[ctx.room.index])resolved.songs[ctx.room.index].key=selected;
 ctx.room.flow=Object.assign(defaultFlow(),ctx.room.flow||{},{targetKey:'',modulation:0,updatedAt:now()});updateRoomCommand(ctx.room,`Tom ${selected} salvo neste repertório`,'tone');
 const active={...(resolved||{}),id:resolved?.id||`shared_${ctx.room.code}`,roomCode:ctx.room.code,roomName:ctx.room.name,source:'live-room',startedAt:now()};write(ACTIVE,active);
 window.StageMusicLiveMode?.updateSavedKey?.(selected);
 await persistRoom(ctx,ctx.room).catch(()=>{});
 window.StageMusicToast?.(`Tom ${selected} salvo somente neste repertório.`);
 renderDirectorDock(ctx,resolveList(ctx.room));
}
async function sendDirectorMessage(){
 const ctx=context();if(!isDirector(ctx))return window.StageMusicToast?.('Somente o diretor pode enviar avisos.');
 const input=document.getElementById('director-live-message'),message=String(input?.value||'').trim();if(!message)return window.StageMusicToast?.('Digite uma mensagem para a banda.');
 const auth=window.StageMusicAuth?.getState?.()||{},author=auth.name||'Direção musical';
 ctx.room.command=message;ctx.room.commandAt=now();ctx.room.commandType='message';ctx.room.messages=[{id:`msg_${Date.now()}`,text:message,at:ctx.room.commandAt,author},...(ctx.room.messages||[])].slice(0,20);ctx.room.updatedAt=now();
 await persistRoom(ctx,ctx.room).catch(()=>{});if(input)input.value='';showDirectorAlert(ctx.room);renderDirectorDock(ctx,resolveList(ctx.room));window.StageMusicToast?.('Aviso enviado para todos.');
}
function openDirectorDock(focusId){const dock=document.getElementById('director-live-dock'),toggle=document.getElementById('director-dock-toggle');if(!dock)return;dock.classList.add('open');dock.hidden=false;toggle?.setAttribute('aria-expanded','true');setTimeout(()=>document.getElementById(focusId)?.focus(),120)}
function bindDirectorDock(){
 if(dockBound)return;dockBound=true;
 const toggle=document.getElementById('director-dock-toggle'),dock=document.getElementById('director-live-dock');
 toggle?.addEventListener('click',()=>{dock.classList.toggle('open');toggle.setAttribute('aria-expanded',String(dock.classList.contains('open')));dock.hidden=!dock.classList.contains('open');sync()});
 document.getElementById('director-dock-close')?.addEventListener('click',()=>{dock.classList.remove('open');dock.hidden=true;toggle?.setAttribute('aria-expanded','false')});
 document.getElementById('director-live-apply-key')?.addEventListener('click',applyDirectorKey);
 document.getElementById('director-live-save-key')?.addEventListener('click',saveDirectorKey);
 document.getElementById('director-live-reset-key')?.addEventListener('click',resetDirectorKey);
 document.getElementById('director-live-prev')?.addEventListener('click',()=>window.StageMusicLiveMode?.goToIndex?.((window.StageMusicLiveMode?.getIndex?.()||0)-1));
 document.getElementById('director-live-next')?.addEventListener('click',()=>window.StageMusicLiveMode?.goToIndex?.((window.StageMusicLiveMode?.getIndex?.()||0)+1));
 document.getElementById('director-live-send-message')?.addEventListener('click',sendDirectorMessage);
 document.getElementById('director-live-message')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();sendDirectorMessage()}});
 document.getElementById('director-quick-key')?.addEventListener('click',()=>openDirectorDock('director-live-key'));
 document.getElementById('director-quick-message')?.addEventListener('click',()=>openDirectorDock('director-live-message'));
 document.getElementById('director-quick-next')?.addEventListener('click',()=>window.StageMusicLiveMode?.goToIndex?.((window.StageMusicLiveMode?.getIndex?.()||0)+1));
}
function sync(){
 ensureRemoteSubscription();
 const ctx=context(),badge=document.getElementById('live-room-status'),banner=ensureBanner(),flowPanel=ensureFlowPanel();
 if(!ctx?.room||ctx.room.status!=='active'){
  document.body.classList.remove('live-room-active');
  if(badge)badge.textContent='Sala Live';banner.hidden=true;flowPanel.hidden=true;window.StageMusicLiveMode?.setTemporaryKey?.('');
  renderDirectorDock(null,null);return;
 }
 document.body.classList.add('live-room-active');
 const {room}=ctx,list=resolveList(room);
 if(list){
  const active=read(ACTIVE,null),signature=JSON.stringify((list.songs||[]).map(song=>[song.songId||song.id||'',song.key||'',song.originalKey||'',song.content?.length||0])),target={...list,id:list.id||`shared_${room.code}`,roomCode:room.code,roomName:room.name,source:'live-room',startedAt:active?.startedAt||now(),roomSignature:signature};
  const changed=active?.id!==target.id||active?.roomCode!==room.code||active?.roomSignature!==signature;
  if(changed){write(ACTIVE,target);if(window.StageMusicLiveMode?.getSetlist?.())window.StageMusicLiveMode.refreshSetlist(target);else{location.reload();return}}
  window.StageMusicLiveMode?.goToIndex?.(Number(room.index||0),{broadcast:false});
 }
 const director=isDirector(ctx);
 if(badge){badge.textContent=director?`Direção • ${room.code}`:`Acompanhando • ${room.code}`;badge.href='sala-live.html'}
 const prev=document.getElementById('live-prev-btn'),next=document.getElementById('live-next-btn');
 if(!director){if(prev)prev.disabled=true;if(next)next.disabled=true}
 if(room.command&&room.commandAt!==lastCommandAt){lastCommandAt=room.commandAt;banner.hidden=false;banner.textContent=room.command;showDirectorAlert(room);window.StageMusicToast?.(room.command);clearTimeout(sync.t);sync.t=setTimeout(()=>banner.hidden=true,6500)}
 applyFlow(room.flow||defaultFlow(),ctx,list);renderDirectorDock(ctx,list);
}
document.addEventListener('DOMContentLoaded',()=>{
 if(!document.body.matches('[data-page="modo-live"]'))return;
 const tool=document.getElementById('live-tools');
 if(tool&&!document.getElementById('live-room-status')){const link=document.createElement('a');link.id='live-room-status';link.className='live-room-link';link.href='sala-live.html';link.textContent='Sala Live';tool.appendChild(link)}
 bindDirectorDock();sync();
 channel?.addEventListener('message',sync);
 window.addEventListener('storage',event=>{if(event.key===ROOMS_KEY||event.key===CURRENT_KEY||event.key===SETLIST_KEY)sync()});
 window.addEventListener('stage:live-song-changed',()=>setTimeout(sync,60));
 window.addEventListener('stage:live-local-navigation',event=>{const ctx=context();if(isDirector(ctx))setRoomIndex(event.detail?.index)});
 setInterval(sync,1800);
});
})();