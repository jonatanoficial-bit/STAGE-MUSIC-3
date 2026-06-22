(function(){
'use strict';
const CURRENT_KEY='stage_music_current_room';
const ROOMS_KEY='stage_music_live_rooms_v1';
const QUEUE_KEY='stage_music_live_write_queue_v1';
const HEALTH_KEY='stage_music_live_health_v1';
const DUPLICATE_MS=950;
const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
const read=(key,fallback)=>window.StageMusicSafeStorage?.get?.(key,fallback)??safeParse(localStorage.getItem(key),fallback);
const write=(key,value)=>window.StageMusicSafeStorage?.set?.(key,value)??(localStorage.setItem(key,JSON.stringify(value)),true);
const now=()=>new Date().toISOString();
const state={lastError:'',lastSyncAt:'',lastRemoteAt:'',lastAction:new Map(),flushing:false,quietTimer:null};
function normalizeQueue(){const q=read(QUEUE_KEY,{});return q&&typeof q==='object'&&!Array.isArray(q)?q:{}}
function queueCount(){return Object.keys(normalizeQueue()).length}
function health(){return read(HEALTH_KEY,{lastSyncAt:'',lastError:'',lastRemoteAt:''})||{}}
function saveHealth(patch){const next={...health(),...patch,updatedAt:now()};write(HEALTH_KEY,next);Object.assign(state,next);renderStatus();return next}
function currentContext(){const current=read(CURRENT_KEY,null),rooms=read(ROOMS_KEY,{});return current?.code?{current,room:rooms[current.code]||null,rooms}:null}
function firebaseReady(){return !!(navigator.onLine&&window.StageMusicFirebaseLive?.isReady?.()&&window.StageMusicAuth?.getState?.().mode==='online')}
function fingerprint(room){return [room?.code,room?.status,room?.index,room?.updatedAt,room?.commandAt,room?.flow?.updatedAt,(room?.members||[]).length].join('|')}
function isDuplicateAction(key,ms=DUPLICATE_MS){const stamp=Date.now(),last=state.lastAction.get(key)||0;if(stamp-last<ms)return true;state.lastAction.set(key,stamp);return false}
function queueRoom(room,reason='offline'){if(!room?.code)return false;const q=normalizeQueue();q[room.code]={room,reason,queuedAt:now(),fingerprint:fingerprint(room)};write(QUEUE_KEY,q);saveHealth({lastError:reason==='offline'?'Aguardando internet para sincronizar.':'Sincronização será tentada novamente.'});return true}
async function safePutRoom(room,{source='live'}={}){if(!room?.code)return false;const key=`put:${room.code}:${fingerprint(room)}`;if(isDuplicateAction(key,450))return true;if(!firebaseReady()){queueRoom(room,'offline');return false}try{await window.StageMusicFirebaseLive.putRoom(room);const q=normalizeQueue();delete q[room.code];write(QUEUE_KEY,q);saveHealth({lastSyncAt:now(),lastError:'',lastSource:source});return true}catch(error){console.warn('Stage Music Live Stability:',error?.message||error);queueRoom(room,'retry');saveHealth({lastError:error?.message||'Falha temporária de sincronização.'});throw error}}
async function flushQueue(){if(state.flushing||!firebaseReady())return false;const q=normalizeQueue(),entries=Object.entries(q);if(!entries.length){renderStatus();return true}state.flushing=true;renderStatus();try{for(const [code,item] of entries){try{await window.StageMusicFirebaseLive.putRoom(item.room);const latest=normalizeQueue();delete latest[code];write(QUEUE_KEY,latest);saveHealth({lastSyncAt:now(),lastError:''})}catch(error){saveHealth({lastError:error?.message||'Nuvem temporariamente indisponível.'});break}}}finally{state.flushing=false;renderStatus()}return queueCount()===0}
function markRemoteRoom(code){saveHealth({lastRemoteAt:now(),lastRemoteCode:code||''})}
function roomAgeMs(room){const stamp=Date.parse(room?.updatedAt||room?.commandAt||'');return Number.isFinite(stamp)?Date.now()-stamp:0}
function statusInfo(){const q=queueCount(),ctx=currentContext(),h=health();if(!navigator.onLine)return{state:'offline',text:'Offline — leitura protegida no aparelho'};if(q||state.flushing)return{state:'syncing',text:q?`Sincronizando ${q} alteração${q>1?'es':''}...`:'Sincronizando Sala Live...'};if(h.lastError)return{state:'error',text:'Nuvem instável — tentando recuperar'};if(ctx?.room?.status==='active'&&roomAgeMs(ctx.room)>45000)return{state:'stale',text:'Verificando atualização da Sala Live...'};if(ctx?.room?.status==='active')return{state:'online',text:'Sala Live protegida'};return{state:'online',text:'Pronto para tocar'} }
function ensureStatus(){let el=document.getElementById('live-stability-status');if(el)return el;el=document.createElement('aside');el.id='live-stability-status';el.className='live-stability-status';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);return el}
function renderStatus(){if(!document.body.matches('[data-page="modo-live"],[data-page="sala-live"]'))return;const el=ensureStatus(),info=statusInfo();el.dataset.state=info.state;el.textContent=info.text;el.classList.toggle('is-quiet',info.state==='online');el.classList.remove('is-hidden');clearTimeout(state.quietTimer);if(info.state==='online')state.quietTimer=setTimeout(()=>el.classList.add('is-hidden'),4200)}
function renderRoomHealth(){const host=document.getElementById('room-health-panel');if(!host)return;const h=health(),q=queueCount(),ctx=currentContext(),members=ctx?.room?.members?.length||0;host.innerHTML=`<article><strong>${navigator.onLine?'Online':'Offline'}</strong><small>Internet</small></article><article><strong>${q}</strong><small>Alterações pendentes</small></article><article><strong>${members}</strong><small>Participantes locais</small></article>`;const warn=document.getElementById('room-sync-warning');if(warn){warn.hidden=!(q||h.lastError||!navigator.onLine);warn.textContent=!navigator.onLine?'Sem internet agora. A sala continua legível neste aparelho.':q?'Há alterações guardadas para enviar quando a conexão estabilizar.':h.lastError?'A nuvem oscilou. O app tentará reconectar automaticamente.':''}}
function start(){renderStatus();renderRoomHealth();window.addEventListener('online',()=>{saveHealth({lastError:''});flushQueue();renderRoomHealth()});window.addEventListener('offline',()=>{saveHealth({lastError:'offline'});renderRoomHealth()});window.addEventListener('storage',event=>{if([QUEUE_KEY,HEALTH_KEY,ROOMS_KEY,CURRENT_KEY].includes(event.key)){renderStatus();renderRoomHealth()}});document.addEventListener('visibilitychange',()=>{if(!document.hidden){flushQueue();renderStatus();renderRoomHealth()}});setInterval(()=>{flushQueue();renderStatus();renderRoomHealth()},10000)}
document.addEventListener('DOMContentLoaded',start);
window.StageMusicLiveStability={safePutRoom,queueRoom,flushQueue,markRemoteRoom,isDuplicateAction,renderStatus,renderRoomHealth,statusInfo};
})();
