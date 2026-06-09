(function(){
 const SONGS_KEY='stage_music_local_songs',DRAFT_KEY='stage_music_song_draft',FAV_KEY='stage_music_favorites',RECENT_KEY='stage_music_recent_songs';
 const safeParse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
 const get=(k,f)=>window.StageMusicSafeStorage?.get(k,f)??safeParse(localStorage.getItem(k),f);
 const set=(k,v)=>window.StageMusicSafeStorage?.set(k,v)??(localStorage.setItem(k,JSON.stringify(v)),true);
 const readSongs=()=>{const x=get(SONGS_KEY,[]);return Array.isArray(x)?x:[]}; const writeSongs=x=>(set(SONGS_KEY,x),x);
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const blob=s=>normalize([s.title,s.artist,s.key,s.content,s.notes,...(s.tags||[])].filter(Boolean).join(' '));
 const create=p=>{const n=new Date().toISOString();return{id:p.id||`song_${Date.now()}`,title:String(p.title||'').trim()||'Sem título',artist:String(p.artist||'').trim()||'Sem artista',key:String(p.key||'C').trim(),bpm:String(p.bpm||'72').trim(),content:String(p.content||'').trim(),notes:String(p.notes||'').trim(),tags:Array.isArray(p.tags)?p.tags:String(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean),createdAt:p.createdAt||n,updatedAt:n,source:'local'}};
 const api={
  getAllSongs(){return readSongs().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt))},getSongById(id){return readSongs().find(x=>x.id===id)||null},
  saveSong(p){const songs=readSongs(),song=create(p),i=songs.findIndex(x=>x.id===song.id);if(i>=0){song.createdAt=songs[i].createdAt||song.createdAt;songs[i]=song}else songs.push(song);writeSongs(songs);this.clearDraft();return song},
  deleteSong(id){const x=readSongs().filter(s=>s.id!==id);writeSongs(x);this.setFavorite(id,false);return x},
  searchSongs(term){const q=normalize(String(term||'').trim());return !q?this.getAllSongs():this.getAllSongs().filter(s=>blob(s).includes(q))},
  getFavorites(){const x=get(FAV_KEY,[]);return Array.isArray(x)?x:[]},isFavorite(id){return this.getFavorites().includes(id)},setFavorite(id,on){const fav=new Set(this.getFavorites());on?fav.add(id):fav.delete(id);set(FAV_KEY,[...fav]);return on},toggleFavorite(id){return this.setFavorite(id,!this.isFavorite(id))},
  markRecent(id){const list=get(RECENT_KEY,[]).filter(x=>x!==id);list.unshift(id);set(RECENT_KEY,list.slice(0,30))},getRecentIds(){const x=get(RECENT_KEY,[]);return Array.isArray(x)?x:[]},
  getAllTags(){return [...new Set(this.getAllSongs().flatMap(s=>s.tags||[]).map(x=>x.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))},
  saveDraft(p){const c=this.getDraft()||{},d={id:p.id||c.id||`draft_${Date.now()}`,title:String(p.title||'').trim(),artist:String(p.artist||'').trim(),key:String(p.key||'C').trim(),bpm:String(p.bpm||'72').trim(),content:String(p.content||'').trim(),notes:String(p.notes||'').trim(),tags:String(p.tags||'').trim(),updatedAt:new Date().toISOString()};set(DRAFT_KEY,d);return d},getDraft(){return get(DRAFT_KEY,null)},clearDraft(){window.StageMusicSafeStorage?.remove(DRAFT_KEY)||localStorage.removeItem(DRAFT_KEY)},
  getStats(){const songs=this.getAllSongs(),draft=this.getDraft();return{songsCount:songs.length,favoritesCount:this.getFavorites().length,tagsCount:this.getAllTags().length,recentCount:this.getRecentIds().length,draftExists:!!draft,lastSongUpdatedAt:songs[0]?.updatedAt||null,lastDraftUpdatedAt:draft?.updatedAt||null}},exportSongs(){return JSON.stringify(this.getAllSongs(),null,2)}
 };window.StageMusicLocalDB=api;
})();
