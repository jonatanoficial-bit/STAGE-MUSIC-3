(function(){
'use strict';
const CACHE_KEY='stage_music_global_songs_v1';
const ADMIN_UID='lurXl8ffICMx9FsLR08TDJnyDJA3';
const ADMIN_EMAIL='jonatanoficial@gmail.com';
const listeners=new Set();
let unsubscribe=null;
let starting=null;
const safeParse=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
const readCache=()=>{const value=window.StageMusicSafeStorage?.get?.(CACHE_KEY,null);const parsed=value??safeParse(localStorage.getItem(CACHE_KEY)||'[]',[]);return Array.isArray(parsed)?parsed:[]};
const writeCache=(songs)=>{const list=Array.isArray(songs)?songs:[];if(window.StageMusicSafeStorage?.set)window.StageMusicSafeStorage.set(CACHE_KEY,list);else localStorage.setItem(CACHE_KEY,JSON.stringify(list));notify(list);return list};
const normalizeText=(value)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const createGlobalId=()=>`global_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const normalizeSong=(song,id)=>({
  id:String(song?.id||id||`global_${Date.now()}`),
  title:String(song?.title||'').trim()||'Sem título',
  artist:String(song?.artist||'').trim()||'Sem artista',
  style:String(song?.style||'').trim(),
  key:String(song?.key||'C').trim(),
  bpm:String(song?.bpm||'72').trim(),
  content:String(song?.content||'').trim(),
  notes:String(song?.notes||'').trim(),
  tags:Array.isArray(song?.tags)?song.tags.map(x=>String(x).trim()).filter(Boolean):String(song?.tags||'').split(',').map(x=>x.trim()).filter(Boolean),
  capo:Math.max(0,Math.min(12,Number(song?.capo||0))),
  source:'global',
  status:'published',
  createdAt:song?.createdAt||new Date().toISOString(),
  updatedAt:song?.updatedAt||new Date().toISOString(),
  publishedByUid:String(song?.publishedByUid||''),
  publishedByEmail:String(song?.publishedByEmail||''),
  originLocalId:String(song?.originLocalId||'')
});
function notify(songs=readCache()){
  window.dispatchEvent(new CustomEvent('stage-music-global-catalog-updated',{detail:{songs}}));
  for(const listener of listeners){try{listener(songs)}catch(error){console.warn('Listener do catálogo global:',error)}}
}
function authState(){return window.StageMusicAuth?.getState?.()||safeParse(localStorage.getItem('stage_music_auth')||'{}',{});}
function isAdminUser(user){
  const uid=String(user?.uid||authState()?.uid||'');
  const email=String(user?.email||authState()?.email||'').toLowerCase();
  return uid===ADMIN_UID||email===ADMIN_EMAIL;
}
async function requireOnlineUser(){
  if(!window.StageMusicFirebase?.configured?.())throw new Error('Firebase não configurado.');
  const user=await window.StageMusicFirebase.currentUser();
  if(!user)throw new Error('Entre com uma conta online para acessar o catálogo global.');
  return user;
}
async function start(){
  if(starting)return starting;
  starting=(async()=>{
    try{
      const user=await requireOnlineUser();
      const rt=await window.StageMusicFirebase.init();
      if(unsubscribe)unsubscribe();
      const ref=rt.collection(rt.db,'globalSongs');
      unsubscribe=rt.onSnapshot(ref,snapshot=>{
        const songs=[];
        snapshot.forEach(docSnap=>songs.push(normalizeSong(docSnap.data(),docSnap.id)));
        songs.sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
        writeCache(songs);
      },error=>{
        console.warn('Catálogo global em tempo real:',error?.message||error);
        notify();
      });
      return {user,online:true};
    }catch(error){
      console.warn('Catálogo global usando cache local:',error?.message||error);
      notify();
      return {user:null,online:false,error};
    }finally{starting=null;}
  })();
  return starting;
}
async function refresh(){
  const user=await requireOnlineUser();
  const rt=await window.StageMusicFirebase.init();
  const snapshot=await rt.getDocs(rt.collection(rt.db,'globalSongs'));
  const songs=[];snapshot.forEach(docSnap=>songs.push(normalizeSong(docSnap.data(),docSnap.id)));
  songs.sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  writeCache(songs);return songs;
}
async function publishSong(payload,globalId=''){
  const user=await requireOnlineUser();
  if(!isAdminUser(user))throw new Error('Somente o administrador pode publicar cifras globais.');
  const rt=await window.StageMusicFirebase.init();
  const id=String(globalId||payload?.globalId||createGlobalId());
  const current=readCache().find(song=>song.id===id);
  const song=normalizeSong(Object.assign({},payload,{
    id,
    createdAt:current?.createdAt||payload?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    publishedByUid:user.uid,
    publishedByEmail:user.email||'',
    originLocalId:payload?.originLocalId||payload?.id||current?.originLocalId||''
  }),id);
  const songRef=rt.doc(rt.db,'globalSongs',id);
  if(current)await rt.setDoc(songRef,song,{merge:true});
  else await rt.setDoc(songRef,song);
  const cached=readCache().filter(item=>item.id!==id);cached.unshift(song);writeCache(cached);
  return song;
}
async function deleteSong(id){
  const user=await requireOnlineUser();
  if(!isAdminUser(user))throw new Error('Somente o administrador pode remover cifras globais.');
  const rt=await window.StageMusicFirebase.init();
  await rt.deleteDoc(rt.doc(rt.db,'globalSongs',String(id)));
  writeCache(readCache().filter(song=>song.id!==String(id)));
  return true;
}
function getAllSongs(){return readCache().map(song=>normalizeSong(song,song.id)).sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));}
function getSongById(id){return getAllSongs().find(song=>song.id===String(id))||null;}
function searchSongs(term){const q=normalizeText(term).trim();if(!q)return getAllSongs();return getAllSongs().filter(song=>normalizeText([song.title,song.artist,song.style,song.key,song.content,song.notes,...(song.tags||[])].join(' ')).includes(q));}
function findDuplicate(title,artist){const t=normalizeText(title).trim(),a=normalizeText(artist).trim();if(!t)return null;return getAllSongs().find(song=>normalizeText(song.title).trim()===t&&(!a||normalizeText(song.artist).trim()===a))||null;}
function copyToPrivate(id){
  const globalSong=getSongById(id);if(!globalSong)throw new Error('Cifra global não encontrada.');
  if(!window.StageMusicLocalDB)throw new Error('Biblioteca local indisponível.');
  return window.StageMusicLocalDB.saveSong({
    title:globalSong.title,
    artist:globalSong.artist,
    style:globalSong.style,
    key:globalSong.key,
    bpm:globalSong.bpm,
    content:globalSong.content,
    notes:globalSong.notes,
    tags:[...(globalSong.tags||[]),'global'],
    capo:globalSong.capo,
    globalOriginId:globalSong.id
  });
}
function subscribe(listener){if(typeof listener!=='function')return()=>{};listeners.add(listener);listener(getAllSongs());return()=>listeners.delete(listener);}
window.StageMusicGlobalCatalog={
  cacheKey:CACHE_KEY,
  adminUid:ADMIN_UID,
  adminEmail:ADMIN_EMAIL,
  isAdmin:()=>isAdminUser(),
  isAdminUser,
  start,refresh,publishSong,deleteSong,getAllSongs,getSongById,searchSongs,findDuplicate,createGlobalId,copyToPrivate,subscribe
};
document.addEventListener('DOMContentLoaded',()=>start());
window.addEventListener('stage-music-auth-changed',()=>start());
})();
