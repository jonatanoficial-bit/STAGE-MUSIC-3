(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StageMusicLiveSharing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const clone=value=>JSON.parse(JSON.stringify(value??null));
  function normalizeCode(value){
    const raw=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(raw.startsWith('LIVE')&&raw.length>=8)return `LIVE-${raw.slice(4,8)}`;
    if(raw.length>=6)return `${raw.slice(0,3)}-${raw.slice(3,6)}`;
    return raw;
  }
  function generateCode(random=Math.random){
    let value='';
    for(let i=0;i<6;i++)value+=ALPHABET[Math.floor(random()*ALPHABET.length)%ALPHABET.length];
    return `${value.slice(0,3)}-${value.slice(3)}`;
  }
  function buildShareUrl(code,href){
    const base=new URL('convite.html',href||'https://stage-music.local/index.html');
    base.search='';
    base.hash='';
    base.searchParams.set('room',normalizeCode(code));
    return base.toString();
  }
  function compactSong(item,localSong){
    const source=Object.assign({},localSong||{},item||{});
    return {
      songId:String(source.songId||source.id||''),
      title:String(source.title||'Sem título'),
      artist:String(source.artist||'Sem artista'),
      key:String(source.key||source.originalKey||'C'),
      originalKey:String(source.originalKey||source.key||'C'),
      bpm:String(source.bpm||'72'),
      capo:Number(source.capo||0),
      duration:Number(source.duration||0),
      notes:String(source.notes||''),
      content:String(source.content||''),
      tags:Array.isArray(source.tags)?source.tags.slice(0,20):[]
    };
  }
  function snapshotSetlist(list,getSongById){
    if(!list||!Array.isArray(list.songs))return null;
    const songs=list.songs.map(item=>compactSong(item,getSongById?.(item.songId)||null));
    return {
      id:`shared_${String(list.id||Date.now())}`,
      sourceSetlistId:String(list.id||''),
      name:String(list.name||'Repertório compartilhado'),
      date:String(list.date||''),
      type:String(list.type||''),
      notes:String(list.notes||''),
      songs,
      sharedAt:new Date().toISOString(),
      source:'live-room-snapshot'
    };
  }
  function resolveRoomSetlist(room,localSetlists){
    if(room?.sharedSetlist?.songs?.length)return clone(room.sharedSetlist);
    const list=(Array.isArray(localSetlists)?localSetlists:[]).find(item=>item.id===room?.setlistId);
    return list?clone(list):null;
  }
  function payloadBytes(value){
    const text=JSON.stringify(value||{});
    if(typeof Blob!=='undefined')return new Blob([text]).size;
    if(typeof Buffer!=='undefined')return Buffer.byteLength(text,'utf8');
    return unescape(encodeURIComponent(text)).length;
  }
  function safeProfile(authState,stored){
    const auth=authState||{},profile=stored||{};
    return {
      name:String(profile.name||auth.name||auth.email?.split('@')[0]||'Músico').slice(0,60),
      instrument:String(profile.instrument||'Outro').slice(0,40)
    };
  }
  return {normalizeCode,generateCode,buildShareUrl,snapshotSetlist,resolveRoomSetlist,payloadBytes,safeProfile};
});
