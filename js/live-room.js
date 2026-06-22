(function(){
'use strict';
const ROOMS_KEY='stage_music_live_rooms_v1',CURRENT_KEY='stage_music_current_room',SETLIST_KEY='stage_music_setlists_v1',TEAMS_KEY='stage_music_teams_v1',ACTIVE='stage_music_active_setlist',PROFILE_KEY='stage_music_live_profile',PRESELECT_KEY='stage_music_room_preselect_setlist';
const $=id=>document.getElementById(id),now=()=>new Date().toISOString(),sharing=window.StageMusicLiveSharing,H=window.StageMusicHarmonic;
const KEY_OPTIONS=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B','Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm'];
const safeParse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
const read=(k,f)=>window.StageMusicSafeStorage?.get?.(k,f)??safeParse(localStorage.getItem(k),f);
const write=(k,v)=>window.StageMusicSafeStorage?.set?.(k,v)??(localStorage.setItem(k,JSON.stringify(v)),true);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normalizeCode=value=>sharing?.normalizeCode?.(value)||String(value||'').trim().toUpperCase();
const generateCode=()=>sharing?.generateCode?.()||`LIVE-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
const channel='BroadcastChannel'in window?new BroadcastChannel('stage-music-live-room'):null;
let rooms=read(ROOMS_KEY,{}),current=read(CURRENT_KEY,null),heartbeat=null,remoteUnsubscribe=null,remoteApplying=false,lastQrCode='';
const toast=t=>{const e=$('room-toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600)};
const getSetlists=()=>{const x=read(SETLIST_KEY,[]);return Array.isArray(x)?x:[]};
const getTeams=()=>{const x=read(TEAMS_KEY,[]);return Array.isArray(x)?x:[]};
function inferViewMode(instrument,role){if(role==='director')return 'director';const value=String(instrument||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return /(vocal|cantor|back|voz|soprano|alto|tenor|contralto)/.test(value)?'lyrics':'chords'}
function viewModeLabel(mode){return mode==='director'?'Diretor':mode==='lyrics'?'Letra':'Cifra'}
function viewModeOptions(selected){const options=[['auto','Automática pelo instrumento'],['chords','Músico — cifra com acordes'],['lyrics','Vocalista — letra limpa'],['director','Diretor — cifra + comandos']];return options.map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${label}</option>`).join('')}
function selectedViewMode(role='member'){const value=$('room-view-mode')?.value||'auto';return value==='auto'?inferViewMode($('room-instrument')?.value,role):value}
const getInviteProfile=()=>{try{return JSON.parse(sessionStorage.getItem('stage_music_invite_profile')||'{}')||{}}catch{return {}}};
const getProfile=()=>{const stored=read(PROFILE_KEY,{}),invite=getInviteProfile(),safe=sharing?.safeProfile?.(window.StageMusicAuth?.getState?.(),{...stored,...invite})||{name:invite.name||stored.name||'Convidado',instrument:invite.instrument||stored.instrument||'Outro'};return {...safe,viewMode:invite.viewMode||stored.viewMode||'auto',inviteRole:invite.role||stored.inviteRole||''}};
const saveProfile=()=>write(PROFILE_KEY,{name:$('room-display-name')?.value.trim()||getProfile().name,instrument:$('room-instrument')?.value||getProfile().instrument,viewMode:$('room-view-mode')?.value||getProfile().viewMode||'auto',updatedAt:now()});
const room=()=>current?.code?rooms[current.code]||null:null;
const activeMember=()=>room()?.members?.find(m=>m.id===current?.memberId)||null;
const modeLabels={normal:'Normal',repeat:'Repetir seção',vamp:'Vamp contínuo',ministry:'Ministração',spontaneous:'Espontâneo',ending:'Preparar final'};
const dynamicsLabels={normal:'Normal',soft:'Suave',build:'Crescendo',full:'Banda completa',drop:'Corte / somente voz'};
function defaultFlow(){return{section:'',mode:'normal',dynamics:'normal',modulation:0,targetKey:'',cue:'',updatedAt:'',history:[]}}
function normalizeRoom(r){return{id:r.id||`room_${Date.now()}`,code:normalizeCode(r.code||generateCode()),name:r.name||'Sala Live',setlistId:r.setlistId||r.sharedSetlist?.sourceSetlistId||'',sharedSetlist:r.sharedSetlist||null,sharingVersion:Number(r.sharingVersion)||1,teamId:r.teamId||'',directorId:r.directorId||'',ownerUid:r.ownerUid||'',ownerEmail:r.ownerEmail||'',index:Number(r.index)||0,command:r.command||'',commandAt:r.commandAt||'',commandType:r.commandType||'message',messages:Array.isArray(r.messages)?r.messages.slice(0,20):[],flow:Object.assign(defaultFlow(),r.flow||{}),status:r.status||'active',createdAt:r.createdAt||now(),updatedAt:r.updatedAt||now(),expiresAt:r.expiresAt||'',members:Array.isArray(r.members)?r.members.map(m=>({...m,viewMode:m.viewMode||inferViewMode(m.instrument,m.role)})):[]}}
Object.keys(rooms).forEach(k=>rooms[k]=normalizeRoom(rooms[k]));
function currentSetlist(r=room()){return sharing?.resolveRoomSetlist?.(r,getSetlists())||getSetlists().find(x=>x.id===r?.setlistId)||null}
function currentSong(r=room()){const list=currentSetlist(r);return list?.songs?.[r?.index||0]||null}
function savedPerformanceKey(r=room()){const song=currentSong(r);return String(song?.key||song?.originalKey||'C')}
function effectivePerformanceKey(r=room()){const base=savedPerformanceKey(r),flow=Object.assign(defaultFlow(),r?.flow||{});if(flow.targetKey)return String(flow.targetKey);if(Number(flow.modulation)&&H)return H.transposeKey(base,Number(flow.modulation),'preserve');return base}
function keyOptions(selected){return KEY_OPTIONS.map(key=>`<option value="${key}" ${key===selected?'selected':''}>${key}</option>`).join('')}
function applyInviteParams(){const params=new URLSearchParams(location.search),instrument=params.get('instrument'),view=params.get('view'),role=params.get('role');const profile=getProfile();if(instrument||view||role){const next={...profile,instrument:instrument||profile.instrument||'Outro',viewMode:view||profile.viewMode||'auto',inviteRole:role||profile.inviteRole||'',updatedAt:now()};write(PROFILE_KEY,next);sessionStorage.setItem('stage_music_invite_profile',JSON.stringify(next));}}
function setInviteRole(role,instrument,view){if($('room-instrument'))$('room-instrument').value=instrument||'Outro';if($('room-view-mode'))$('room-view-mode').value=view||'auto';write(PROFILE_KEY,{...getProfile(),instrument:instrument||'Outro',viewMode:view||'auto',inviteRole:role||'',updatedAt:now()});sessionStorage.setItem('stage_music_invite_profile',JSON.stringify({name:$('room-display-name')?.value||getProfile().name,instrument,viewMode:view,role,updatedAt:now()}));document.querySelectorAll('[data-invite-role]').forEach(btn=>btn.classList.toggle('active',btn.dataset.inviteRole===role));const mode=(view&&view!=='auto')?view:inferViewMode(instrument,'member');if($('join-profile-instrument'))$('join-profile-instrument').textContent=`${instrument||'Outro'} • ${viewModeLabel(mode)}`;saveProfile()}
function showGuestLogin(code){const panel=$('room-guest-login-panel'),link=$('room-guest-login-link');if(!panel)return;if(link){const returnPath=`sala-live.html?room=${encodeURIComponent(code)}&role=${encodeURIComponent(getProfile().inviteRole||'musico')}&instrument=${encodeURIComponent($('room-instrument')?.value||getProfile().instrument||'Outro')}&view=${encodeURIComponent($('room-view-mode')?.value||getProfile().viewMode||'auto')}`;sessionStorage.setItem('stage_music_after_login',returnPath);link.href='login-cifra.html'}panel.hidden=false}

function buildSnapshot(list){return sharing?.snapshotSetlist?.(list,id=>window.StageMusicLocalDB?.getSongById?.(id))||list}
function activateRoomSetlist(r=room()){
 const list=currentSetlist(r);if(!list?.songs?.length)return false;
 const active={...list,id:list.id||`shared_${r.code}`,roomCode:r.code,roomName:r.name,source:'live-room',startedAt:now()};
 write(ACTIVE,active);return true;
}
function extractSections(song){const text=String(song?.content||'');const found=[];text.split('\n').forEach(line=>{const m=line.trim().match(/^\[([^\]]+)\]$|^(Intro|Verso(?:\s*\d+)?|Pré-Refrão|Pre-Refrão|Refrão|Refrao|Ponte|Solo|Interlúdio|Interludio|Ministração|Ministracao|Final)\s*:?$/i);const name=(m?.[1]||m?.[2]||'').trim();if(name&&!found.some(x=>x.toLowerCase()===name.toLowerCase()))found.push(name)});return found}
function memberId(role){const auth=window.StageMusicAuth?.getState?.()||{};if(auth.uid&&auth.mode==='online')return `${role==='director'?'director':'member'}_${auth.uid}`;return `${role}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`}
async function copyText(value,message){try{await navigator.clipboard.writeText(value);toast(message||'Copiado.');return true}catch{const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const ok=document.execCommand('copy');input.remove();toast(ok?(message||'Copiado.'):'Não foi possível copiar.');return ok}}
function shareUrl(r=room()){return r?sharing?.buildShareUrl?.(r.code,location.href)||`${location.origin}${location.pathname}?room=${encodeURIComponent(r.code)}`:''}
async function renderQr(r){
 const canvas=$('room-qr-canvas');if(!canvas||!r||lastQrCode===r.code)return;lastQrCode=r.code;
 const url=shareUrl(r);
 try{if(window.QRCode?.toCanvas)await window.QRCode.toCanvas(canvas,url,{width:232,margin:1,color:{dark:'#090d1a',light:'#ffffff'}});else throw new Error('QR indisponível')}catch(error){const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#11172a';ctx.font='700 18px sans-serif';ctx.textAlign='center';ctx.fillText(r.code,canvas.width/2,canvas.height/2);console.warn('QR Code:',error?.message||error)}
}
function setCurrentRoom(codeValue,memberIdValue,role){current={code:normalizeCode(codeValue),memberId:memberIdValue,role};write(CURRENT_KEY,current);startHeartbeat();startRemoteSubscription();render()}
function clearCurrent(){current=null;write(CURRENT_KEY,null);clearInterval(heartbeat);heartbeat=null;remoteUnsubscribe?.();remoteUnsubscribe=null;render()}
function startRemoteSubscription(){
 remoteUnsubscribe?.();remoteUnsubscribe=null;
 if(!current?.code||!window.StageMusicFirebaseLive?.isReady?.()||window.StageMusicAuth?.getState?.().mode!=='online')return;
 remoteUnsubscribe=window.StageMusicFirebaseLive.subscribe(current.code,(remote)=>{if(!remote)return;remoteApplying=true;rooms[current.code]=normalizeRoom(remote);write(ROOMS_KEY,rooms);activateRoomSetlist(rooms[current.code]);remoteApplying=false;render();channel?.postMessage({type:'rooms-updated',at:now(),remote:true})},error=>console.warn('Escuta da Sala Live online:',error?.message||error));
}
function saveRooms(){
 write(ROOMS_KEY,rooms);channel?.postMessage({type:'rooms-updated',at:now()});render();const r=room();
 if(r&&!remoteApplying&&window.StageMusicFirebaseLive?.isReady?.()&&window.StageMusicAuth?.getState?.().mode==='online')return window.StageMusicFirebaseLive.putRoom(r).catch(error=>{console.warn('Sala Live online:',error?.message||error);throw error});
 return Promise.resolve();
}
function startHeartbeat(){clearInterval(heartbeat);if(!current)return;heartbeat=setInterval(()=>{const r=room(),m=activeMember();if(!r||!m)return;m.lastSeenAt=now();r.updatedAt=now();write(ROOMS_KEY,rooms);channel?.postMessage({type:'heartbeat',code:r.code})},8000)}
async function findAvailableCode(){
 for(let attempt=0;attempt<5;attempt++){
  const c=generateCode();if(rooms[c])continue;
  if(window.StageMusicFirebaseLive?.isReady?.()&&window.StageMusicAuth?.getState?.().mode==='online'){
   try{if(await window.StageMusicFirebaseLive.getRoom(c))continue}catch{}
  }
  return c;
 }
 return generateCode();
}
async function createRoom(){
 const setlistId=$('room-setlist-select').value,name=$('room-display-name').value.trim()||getProfile().name||'Diretor musical';
 if(!setlistId)return toast('Crie ou selecione um repertório primeiro.');
 const list=getSetlists().find(x=>x.id===setlistId);if(!list?.songs?.length)return toast('Adicione músicas ao repertório antes de criar a sala.');
 const sharedSetlist=buildSnapshot(list);if(!sharedSetlist?.songs?.every(song=>String(song.content||'').trim()))toast('Atenção: alguma música está sem cifra completa.');
 const auth=window.StageMusicAuth?.getState?.()||{};
 if(window.StageMusicFirebaseLive?.isReady?.()&&auth.mode!=='online'){
  sessionStorage.setItem('stage_music_after_login','sala-live.html');location.href='login-cifra.html';return;
 }
 const c=await findAvailableCode(),mid=memberId('director');saveProfile();
 const r=normalizeRoom({code:c,name:`${list.name||'Repertório'} • Sala Live`,setlistId,sharedSetlist,sharingVersion:2,teamId:$('room-team-select').value,directorId:mid,ownerUid:auth.uid||'',ownerEmail:auth.email||'',expiresAt:new Date(Date.now()+18*60*60*1000).toISOString(),members:[{id:mid,uid:auth.uid||'',name,instrument:$('room-instrument').value,role:'director',viewMode:'director',joinedAt:now(),lastSeenAt:now()}]});
 const bytes=sharing?.payloadBytes?.(r)||JSON.stringify(r).length;if(bytes>850000)return toast('Este repertório está grande demais para uma única Sala Live. Divida-o em duas listas.');
 rooms[c]=r;activateRoomSetlist(r);setCurrentRoom(c,mid,'director');
 try{await saveRooms();toast(window.StageMusicFirebaseLive?.isReady?.()?'Sala criada. Convite pronto para compartilhar.':'Sala local criada. Convite pronto.') }catch{toast('Sala criada localmente, mas a nuvem não respondeu.')}
}
async function loadRoomByCode(c){
 let r=rooms[c];
 if((!r||r.status!=='active')&&window.StageMusicFirebaseLive?.isReady?.()){
  const auth=window.StageMusicAuth?.getState?.()||{};
  if(auth.mode!=='online')return null;
  try{const remote=await window.StageMusicFirebaseLive.getRoom(c);if(remote){r=normalizeRoom(remote);rooms[c]=r;write(ROOMS_KEY,rooms)}}catch(error){console.warn('Busca online da sala:',error?.message||error)}
 }
 return r?.status==='active'?r:null;
}
async function joinRoom(options={}){
 const c=normalizeCode($('join-room-code').value);$('join-room-code').value=c;if(!c)return toast('Digite o código da sala.');
 const auth=window.StageMusicAuth?.getState?.()||{};
 if(window.StageMusicFirebaseLive?.isReady?.()&&auth.mode!=='online'&&!rooms[c]){
  const returnPath=`sala-live.html?room=${encodeURIComponent(c)}`;sessionStorage.setItem('stage_music_after_login',returnPath);location.href='login-cifra.html';return;
 }
 const r=await loadRoomByCode(c);if(!r)return toast('Sala não encontrada. Confira o código e tente novamente.');
 if(!currentSetlist(r)?.songs?.length)return toast('Esta sala antiga não contém as cifras compartilhadas. Peça ao diretor para recriar ou atualizar a sala.');
 const mid=memberId('member'),profile=getProfile(),name=$('room-display-name').value.trim()||profile.name||'Músico',instrument=$('room-instrument').value||profile.instrument||'Outro',viewMode=selectedViewMode('member');saveProfile();
 r.members=(r.members||[]).filter(m=>m.id!==mid&&!(auth.uid&&m.uid===auth.uid));
 r.members.push({id:mid,uid:auth.uid||'',name,instrument,role:'member',viewMode,joinedAt:now(),lastSeenAt:now()});r.updatedAt=now();rooms[c]=r;
 setCurrentRoom(c,mid,'member');activateRoomSetlist(r);
 try{await saveRooms();toast('Conectado. Abrindo a cifra sincronizada...')}catch{toast('Conectado localmente; a nuvem não respondeu.')}
 if(options.navigate!==false)setTimeout(()=>location.href='modo-live.html',450);
}
function leaveRoom(){const r=room();if(r&&current){r.members=(r.members||[]).filter(m=>m.id!==current.memberId);r.updatedAt=now();if(current.role==='director')r.status='ended';saveRooms().catch(()=>{})}clearCurrent();toast('Você saiu da sala.')}
async function endRoom(){const r=room();if(!r)return;r.status='ended';r.updatedAt=now();try{await saveRooms()}catch{}clearCurrent();toast('Sala encerrada.')}
async function refreshSharedContent(){const r=room();if(!r||current?.role!=='director')return;const list=getSetlists().find(x=>x.id===r.setlistId);if(!list)return toast('Repertório original não encontrado neste dispositivo.');r.sharedSetlist=buildSnapshot(list);r.sharingVersion=2;r.updatedAt=now();activateRoomSetlist(r);try{await saveRooms();toast('Cifras compartilhadas atualizadas.')}catch{toast('Atualização local concluída; nuvem indisponível.')}}
function move(step){const r=room(),list=currentSetlist(r);if(!r||!list)return;const next=Math.max(0,Math.min((list.songs?.length||1)-1,r.index+step));if(next===r.index)return toast(step<0?'Início do repertório':'Fim do repertório');r.index=next;r.command='';r.commandAt='';r.flow=defaultFlow();r.updatedAt=now();activateRoomSetlist(r);saveRooms().catch(()=>{});window.dispatchEvent(new CustomEvent('stage-room-position',{detail:{index:next,room:r}}))}
function sendCommand(text){const r=room(),message=String(text||'').trim();if(!r||!message||current?.role!=='director')return;r.command=message;r.commandAt=now();r.commandType='message';r.messages=[{id:`msg_${Date.now()}`,text:message,at:r.commandAt,author:activeMember()?.name||'Direção musical'},...(r.messages||[])].slice(0,20);r.updatedAt=now();saveRooms().catch(()=>{});if($('director-message'))$('director-message').value='';toast('Aviso destacado enviado aos músicos.')}
function pushFlowHistory(r,label){const item={id:`flow_${Date.now()}`,label,at:now()};r.flow.history=[item,...(r.flow.history||[])].slice(0,12)}
function applyFlow(patch,label,type='cue'){const r=room();if(!r||current?.role!=='director')return toast('Somente o diretor pode alterar o Worship Flow.');r.flow=Object.assign(defaultFlow(),r.flow||{},patch||{}, {updatedAt:now()});pushFlowHistory(r,label||'Fluxo atualizado');r.command=label||'Fluxo atualizado';r.commandAt=now();r.commandType=type;r.updatedAt=now();saveRooms().catch(()=>{});toast(label||'Worship Flow atualizado.')}
function flowFromControls(){const selected=$('director-performance-key')?.value||savedPerformanceKey();return{section:$('flow-section-select')?.value||'',dynamics:$('flow-dynamics')?.value||'normal',modulation:0,targetKey:selected===savedPerformanceKey()?'':selected,mode:$('flow-mode')?.value||'normal'}}
function handleFlowAction(action){const base=flowFromControls();if(action==='apply')return applyFlow(base,'Fluxo musical atualizado');if(action==='repeat')return applyFlow({...base,mode:'repeat'},`Repetir ${base.section||'seção atual'}`);if(action==='vamp')return applyFlow({...base,mode:'vamp'},`Vamp contínuo em ${base.section||'seção atual'}`);if(action==='ministry')return applyFlow({...base,mode:'ministry',dynamics:'soft'},'Entrar em ministração');if(action==='build')return applyFlow({...base,dynamics:'build'},'Crescendo progressivo');if(action==='drop')return applyFlow({...base,dynamics:'drop'},'Corte total / somente voz');if(action==='band')return applyFlow({...base,dynamics:'full'},'Banda completa entra');if(action==='ending')return applyFlow({...base,mode:'ending'},'Preparar final agora')}
function applyPerformanceKey(){
 const r=room();if(!r||current?.role!=='director')return toast('Somente o diretor pode trocar o tom.');
 const base=savedPerformanceKey(r),selected=$('director-performance-key')?.value||base;
 applyFlow({targetKey:selected===base?'':selected,modulation:0},selected===base?`Tom restaurado para ${base}`:`Tom alterado para ${selected}`,'tone');
}
function resetPerformanceKey(){const base=savedPerformanceKey();if($('director-performance-key'))$('director-performance-key').value=base;applyFlow({targetKey:'',modulation:0},`Tom restaurado para ${base}`,'tone')}
async function savePerformanceKey(){
 const r=room();if(!r||current?.role!=='director')return toast('Somente o diretor pode salvar o tom.');
 const target=$('director-performance-key')?.value||effectivePerformanceKey(r),lists=getSetlists(),list=lists.find(item=>item.id===r.setlistId),roomList=currentSetlist(r);
 if(!KEY_OPTIONS.includes(target))return toast('Escolha um tom válido.');
 if(list?.songs?.[r.index]){list.songs[r.index].key=target;list.updatedAt=now();write(SETLIST_KEY,lists);if(window.StageMusicCloudSync?.syncSetlists)window.StageMusicCloudSync.syncSetlists(lists).catch(error=>console.warn('Sincronização do tom:',error?.message||error))}
 if(r.sharedSetlist?.songs?.[r.index])r.sharedSetlist.songs[r.index].key=target;
 if(roomList?.songs?.[r.index])roomList.songs[r.index].key=target;
 r.flow=Object.assign(defaultFlow(),r.flow||{},{targetKey:'',modulation:0,updatedAt:now()});
 r.command=`Tom ${target} salvo neste repertório`;r.commandAt=now();r.commandType='tone';r.updatedAt=now();activateRoomSetlist(r);
 try{await saveRooms();toast(`Tom ${target} salvo somente neste repertório.`)}catch{toast('Tom salvo localmente; nuvem indisponível.')}
}
function renderSelects(){const lists=getSetlists(),teams=getTeams(),preselected=read(PRESELECT_KEY,'');$('room-setlist-select').innerHTML=lists.length?lists.map(x=>`<option value="${esc(x.id)}" ${x.id===preselected?'selected':''}>${esc(x.name)} • ${(x.songs||[]).length} músicas</option>`).join(''):'<option value="">Nenhum repertório disponível</option>';$('room-team-select').innerHTML='<option value="">Sem equipe</option>'+teams.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');if(preselected)write(PRESELECT_KEY,'')}
function renderFlow(r,isDirector){
 const flow=Object.assign(defaultFlow(),r?.flow||{}),song=currentSong(r),sections=extractSections(song),sectionSelect=$('flow-section-select'),base=savedPerformanceKey(r),target=effectivePerformanceKey(r);
 if(sectionSelect){const selected=flow.section||sectionSelect.value||'';sectionSelect.innerHTML='<option value="">Automática / atual</option>'+sections.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');sectionSelect.value=sections.includes(selected)?selected:''}
 if($('flow-dynamics'))$('flow-dynamics').value=flow.dynamics||'normal';
 if($('flow-mode'))$('flow-mode').value=flow.mode||'normal';
 if($('director-performance-key')){$('director-performance-key').innerHTML=keyOptions(target);$('director-performance-key').value=target}
 if($('director-key-hint'))$('director-key-hint').textContent=target===base?`Tom salvo no repertório: ${base}`:`Tom temporário ${target} • repertório salvo em ${base}`;
 if($('flow-live-state'))$('flow-live-state').textContent=flow.mode==='normal'&&flow.dynamics==='normal'&&!flow.section&&target===base?'Fluxo normal':`${modeLabels[flow.mode]||flow.mode} ativo`;
 if($('flow-summary-section'))$('flow-summary-section').textContent=flow.section||'Automática';
 if($('flow-summary-mode'))$('flow-summary-mode').textContent=modeLabels[flow.mode]||'Normal';
 if($('flow-summary-dynamics'))$('flow-summary-dynamics').textContent=dynamicsLabels[flow.dynamics]||'Normal';
 if($('flow-summary-modulation'))$('flow-summary-modulation').textContent=target;
 if($('flow-history'))$('flow-history').innerHTML=(flow.history||[]).length?(flow.history||[]).map(item=>`<article><strong>${esc(item.label)}</strong><small>${new Date(item.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></article>`).join(''):'<p class="section-subtitle">Nenhum comando avançado enviado.</p>';
 if($('worship-flow-panel'))$('worship-flow-panel').classList.toggle('readonly',!isDirector)
}
function renderInvite(r,isDirector){const panel=$('room-invite-panel');if(!panel)return;panel.hidden=!(r&&r.status==='active'&&isDirector);if(panel.hidden)return;const url=shareUrl(r);$('room-share-code').textContent=r.code;$('room-share-url').value=url;$('whatsapp-room-link').href=`https://wa.me/?text=${encodeURIComponent(`Entre na minha Sala Live do Stage Music. Código: ${r.code}\n${url}`)}`;renderQr(r)}
function render(){
 if(!document.body.matches('[data-page="sala-live"]'))return;
 const r=room(),list=currentSetlist(r),member=activeMember(),isDirector=current?.role==='director'&&r?.directorId===current?.memberId,active=r&&r.status==='active';
 $('room-stat-status').textContent=active?'Ativa':'Inativa';$('room-stat-code').textContent=active?r.code:'—';$('room-stat-members').textContent=active?(r.members||[]).length:0;$('room-stat-position').textContent=active&&list?`${Math.min(r.index+1,list.songs.length)} / ${list.songs.length}`:'0 / 0';
 $('room-role-badge').textContent=isDirector?'Diretor musical':active?'Músico conectado':'Sem sala';$('room-role-badge').dataset.role=isDirector?'director':active?'member':'';
 $('director-panel').hidden=!isDirector;$('end-room-btn').disabled=!isDirector;$('copy-room-code').disabled=!active;$('leave-room-btn').disabled=!active;$('create-room-btn').disabled=!!active;$('join-room-btn').disabled=!!active;$('joined-room-summary').hidden=!active||isDirector;
 renderInvite(r,isDirector);
 if(active){$('joined-room-name').textContent=r.name;$('joined-room-song').textContent=list?.songs?.[r.index]?.title?`Música atual: ${list.songs[r.index].title}`:'Aguardando direção musical...';const banner=$('room-command-banner');banner.hidden=!r.command;banner.textContent=r.command||''}const messageHistory=$('director-message-history');if(messageHistory){const messages=r?.messages||[];messageHistory.innerHTML=messages.length?messages.slice(0,6).map(item=>`<article><strong>${esc(item.text)}</strong><small>${esc(item.author||'Direção')} • ${new Date(item.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></article>`).join(''):'<p class="section-subtitle">Nenhum aviso enviado.</p>'}
 if(isDirector&&list){const song=list.songs?.[r.index];$('director-current-title').textContent=song?.title||'Sem música';$('director-current-meta').textContent=song?`${song.artist||'Sem artista'} • Tom atual ${effectivePerformanceKey(r)} • salvo ${savedPerformanceKey(r)} • ${r.index+1}/${list.songs.length}`:'—';$('director-prev').disabled=r.index<=0;$('director-next').disabled=r.index>=list.songs.length-1}
 const members=r?.members||[];$('room-member-list').innerHTML=members.length?members.map(m=>{const mode=m.viewMode||inferViewMode(m.instrument,m.role),roleLabel=m.role==='director'?'Diretor':'Participante';return `<article class="room-member"><div><strong>${esc(m.name)}</strong><small>${esc(m.instrument)} • ${roleLabel} • ${viewModeLabel(mode)}</small></div>${isDirector&&m.role!=='director'?`<label class="member-view-select"><span>Visual</span><select data-member-view="${esc(m.id)}"><option value="chords" ${mode==='chords'?'selected':''}>Cifra</option><option value="lyrics" ${mode==='lyrics'?'selected':''}>Letra</option></select></label>`:`<span class="room-member-status">${viewModeLabel(mode)}</span>`}</article>`}).join(''):'<p class="section-subtitle">Nenhum participante conectado.</p>';
 const profile=member?{name:member.name,instrument:member.instrument,viewMode:member.viewMode||'auto'}:getProfile();$('room-display-name').value=profile.name||'';$('room-instrument').value=profile.instrument||'Outro';if($('room-view-mode'))$('room-view-mode').value=profile.viewMode||'auto';$('join-profile-name').textContent=profile.name||'Músico';const shownMode=(profile.viewMode&&profile.viewMode!=='auto')?profile.viewMode:inferViewMode(profile.instrument,member?.role||'member');$('join-profile-instrument').textContent=`${profile.instrument||'Outro'} • ${viewModeLabel(shownMode)}`;
 renderFlow(r,isDirector)
}
function bind(){
 applyInviteParams();renderSelects();const profile=getProfile();$('room-display-name').value=profile.name;$('room-instrument').value=profile.instrument;if($('room-view-mode'))$('room-view-mode').value=profile.viewMode||'auto';
 $('room-display-name').addEventListener('input',()=>{$('join-profile-name').textContent=$('room-display-name').value.trim()||'Músico'});const updateJoinSummary=()=>{const mode=selectedViewMode(current?.role||'member');$('join-profile-instrument').textContent=`${$('room-instrument').value} • ${viewModeLabel(mode)}`;saveProfile()};$('room-instrument').addEventListener('change',updateJoinSummary);$('room-view-mode')?.addEventListener('change',updateJoinSummary);
 
 document.querySelectorAll('[data-invite-role]').forEach(btn=>btn.addEventListener('click',()=>setInviteRole(btn.dataset.inviteRole,btn.dataset.instrument,btn.dataset.view)));
 const profileRole=getProfile().inviteRole,profileView=getProfile().viewMode;document.querySelectorAll('[data-invite-role]').forEach(btn=>{if((profileRole&&btn.dataset.inviteRole===profileRole)||(!profileRole&&profileView&&btn.dataset.view===profileView))btn.classList.add('active')});
 $('join-room-code').addEventListener('input',event=>{const caret=event.target.selectionStart;event.target.value=normalizeCode(event.target.value);event.target.setSelectionRange?.(Math.min(caret+1,event.target.value.length),Math.min(caret+1,event.target.value.length))});
 $('create-room-btn').onclick=createRoom;$('join-room-btn').onclick=()=>joinRoom({navigate:true});$('leave-room-btn').onclick=leaveRoom;$('end-room-btn').onclick=endRoom;$('refresh-room-content').onclick=refreshSharedContent;
 $('copy-room-code').onclick=()=>{const r=room();if(r)copyText(r.code,'Código copiado.')};$('copy-room-link').onclick=()=>{const r=room();if(r)copyText(shareUrl(r),'Link do convite copiado.')};
 $('share-room-link').onclick=async()=>{const r=room();if(!r)return;const url=shareUrl(r),text=`Entre na minha Sala Live do Stage Music. Código: ${r.code}`;if(navigator.share){try{await navigator.share({title:'Sala Live • Stage Music',text,url});return}catch(error){if(error?.name==='AbortError')return}}await copyText(`${text}\n${url}`,'Convite copiado.')};
 $('director-prev').onclick=()=>move(-1);$('director-next').onclick=()=>move(1);
 $('director-apply-key').onclick=applyPerformanceKey;$('director-save-key').onclick=savePerformanceKey;$('director-reset-key').onclick=resetPerformanceKey;
 $('director-send-message').onclick=()=>sendCommand($('director-message').value);$('director-message').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();sendCommand(event.currentTarget.value)}});$('quick-command-grid').onclick=e=>{const b=e.target.closest('[data-command]');if(b)sendCommand(b.dataset.command)};$('worship-flow-panel')?.addEventListener('click',e=>{const b=e.target.closest('[data-flow-action]');if(b)handleFlowAction(b.dataset.flowAction)});
 const advanced=$('director-advanced-controls'),toggle=$('director-advanced-toggle');if(advanced&&toggle){const compact=matchMedia('(max-width: 780px)').matches;advanced.hidden=compact;toggle.setAttribute('aria-expanded',String(!compact));toggle.textContent=compact?'Mostrar comandos avançados':'Ocultar comandos avançados';toggle.onclick=()=>{advanced.hidden=!advanced.hidden;toggle.setAttribute('aria-expanded',String(!advanced.hidden));toggle.textContent=advanced.hidden?'Mostrar comandos avançados':'Ocultar comandos avançados'}}

 $('room-member-list')?.addEventListener('change',event=>{const select=event.target.closest('[data-member-view]'),r=room();if(!select||!r||!(current?.role==='director'&&r.directorId===current?.memberId))return;const member=(r.members||[]).find(m=>m.id===select.dataset.memberView);if(!member)return;member.viewMode=select.value;member.updatedAt=now();r.updatedAt=now();saveRooms().then(()=>toast(`${member.name}: ${viewModeLabel(member.viewMode)}`)).catch(()=>toast('Não foi possível atualizar a visualização.'))});
 channel?.addEventListener('message',()=>{rooms=read(ROOMS_KEY,{});Object.keys(rooms).forEach(k=>rooms[k]=normalizeRoom(rooms[k]));render()});window.addEventListener('storage',e=>{if(e.key===ROOMS_KEY){rooms=read(ROOMS_KEY,{});Object.keys(rooms).forEach(k=>rooms[k]=normalizeRoom(rooms[k]));render()}})
}
async function handleInviteFromUrl(){const raw=new URLSearchParams(location.search).get('room')||new URLSearchParams(location.search).get('code');if(!raw){document.documentElement.classList.remove('room-invite-pending');return;}document.body.classList.add('room-invite-mode');const c=normalizeCode(raw);$('join-room-code').value=c;$('join-invite-hint').hidden=false;const auth=window.StageMusicAuth?.getState?.()||{};const localRoom=rooms[c];if(window.StageMusicFirebaseLive?.isReady?.()&&auth.mode!=='online'&&!localRoom){showGuestLogin(c);document.documentElement.classList.remove('room-invite-pending');toast('Entre com Google para abrir esta sala em tempo real.');return}setTimeout(()=>joinRoom({navigate:true,automatic:true}),550)}
document.addEventListener('DOMContentLoaded',()=>{if(!document.body.matches('[data-page="sala-live"]'))return;bind();startHeartbeat();render();handleInviteFromUrl()});
window.StageMusicLiveRoom={getCurrent:()=>room(),getContext:()=>current,move,sendCommand,applyFlow,joinRoom,createRoom,activateRoomSetlist,currentSetlist};
})();
