(function(){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const fmt=iso=>{const date=new Date(iso);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(date)};
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.body.matches('[data-page="buscar-cifra"]'))return;
  const db=window.StageMusicLocalDB,catalog=window.StageMusicGlobalCatalog,$=id=>document.getElementById(id);
  const input=$('search-local-input'),filter=$('library-filter'),sort=$('library-sort'),results=$('search-local-results'),counter=$('search-local-counter'),tagBox=$('library-tag-filters'),dialog=$('song-preview-dialog'),preview=$('song-preview-content');
  let activeTag='';
  const prefill=(()=>{try{return localStorage.getItem('stage_music_home_search_term')||''}catch{return''}})();
  if(prefill){input.value=prefill;try{localStorage.removeItem('stage_music_home_search_term')}catch{}}
  const requestedFilter=new URLSearchParams(location.search).get('filter');if(['all','global','private','favorites','recent'].includes(requestedFilter))filter.value=requestedFilter;
  const privateSongs=()=>db.getAllSongs().map(song=>({...song,source:'private'}));
  const globalSongs=()=>catalog?.getAllSongs?.()||[];
  const allSongs=()=>[...globalSongs(),...privateSongs()];
  const findSong=id=>catalog?.getSongById?.(id)||db.getSongById(id);
  const tags=()=>[...new Set(allSongs().flatMap(song=>song.tags||[]).map(tag=>String(tag).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const updateStats=()=>{
    const local=privateSongs(),global=globalSongs();
    $('library-total').textContent=local.length+global.length;
    $('library-global').textContent=global.length;
    $('library-private').textContent=local.length;
    $('library-favorites').textContent=db.getFavorites().length;
    $('library-recent').textContent=db.getRecentIds().length;
  };
  const renderTags=()=>{tagBox.innerHTML=tags().map(tag=>`<button class="tag-filter" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')};
  const matches=(song,term)=>!term||normalize([song.title,song.artist,song.key,song.content,song.notes,...(song.tags||[])].join(' ')).includes(normalize(term));
  const getSongs=()=>{
    let songs=allSongs().filter(song=>matches(song,input.value.trim()));
    if(filter.value==='global')songs=songs.filter(song=>song.source==='global');
    if(filter.value==='private')songs=songs.filter(song=>song.source!=='global');
    if(filter.value==='favorites')songs=songs.filter(song=>db.isFavorite(song.id));
    if(filter.value==='recent'){const ids=db.getRecentIds();songs=songs.filter(song=>ids.includes(song.id)).sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));}
    if(activeTag)songs=songs.filter(song=>(song.tags||[]).includes(activeTag));
    if(sort.value==='updated')songs.sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
    if(sort.value==='title')songs.sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
    if(sort.value==='artist')songs.sort((a,b)=>a.artist.localeCompare(b.artist,'pt-BR'));
    if(sort.value==='key')songs.sort((a,b)=>a.key.localeCompare(b.key,'pt-BR'));
    return songs;
  };
  const actionButtons=song=>{
    if(song.source==='global'){
      const admin=catalog?.isAdmin?.();
      return admin
        ? `<a class="btn-outline" href="inserir-cifra.html?global=${encodeURIComponent(song.id)}">Editar global</a>`
        : `<button class="btn-outline" data-action="copy-private">Criar minha versão</button>`;
    }
    return `<a class="btn-outline" href="inserir-cifra.html?local=${encodeURIComponent(song.id)}">Editar</a>`;
  };
  const render=()=>{
    const songs=getSongs();
    counter.textContent=`${songs.length} ${songs.length===1?'cifra encontrada':'cifras encontradas'}`;
    if(!songs.length){
      results.innerHTML=`<article class="library-empty-state"><span>♫</span><h3>Nenhuma cifra encontrada</h3><p>Atualize o catálogo, ajuste os filtros ou crie sua própria cifra.</p><a href="inserir-cifra.html" class="btn-primary">Criar cifra</a></article>`;
      updateStats();return;
    }
    results.innerHTML=songs.map(song=>`<article class="song-card" data-id="${esc(song.id)}" data-source="${song.source==='global'?'global':'private'}"><div class="song-card-top"><div class="song-key">${esc(song.key)}</div><button class="favorite-btn ${db.isFavorite(song.id)?'active':''}" data-action="favorite" title="Favoritar">★</button></div><div class="song-source-row"><span class="catalog-source-badge ${song.source==='global'?'global':'private'}">${song.source==='global'?'Global':'Minha cifra'}</span>${song.source==='global'?'<small>Publicada pelo Stage Music</small>':'<small>Somente nesta conta</small>'}</div><h3>${esc(song.title)}</h3><p>${esc(song.artist)}</p><div class="song-meta"><span>${esc(song.bpm)} BPM</span><span>Atualizada ${esc(fmt(song.updatedAt))}</span></div><div class="song-tags">${(song.tags||[]).slice(0,4).map(tag=>`<span>#${esc(tag)}</span>`).join('')}</div><div class="song-actions"><button class="btn-secondary" data-action="preview">Visualizar</button>${actionButtons(song)}</div></article>`).join('');
    updateStats();
  };
  const openSong=song=>{
    db.markRecent(song.id);
    preview.innerHTML=`<div class="dialog-song-head"><div class="song-key">${esc(song.key)}</div><div><span class="catalog-source-badge ${song.source==='global'?'global':'private'}">${song.source==='global'?'Global':'Minha cifra'}</span><h2>${esc(song.title)}</h2><p>${esc(song.artist)} • ${esc(song.bpm)} BPM</p></div></div><div class="song-tags">${(song.tags||[]).map(tag=>`<span>#${esc(tag)}</span>`).join('')}</div>${song.notes?`<aside class="song-notes">${esc(song.notes)}</aside>`:''}<pre class="song-content">${esc(song.content||'Cifra ainda sem conteúdo.')}</pre>`;
    dialog.showModal();render();
  };
  [input,filter,sort].forEach(element=>element.addEventListener(element===input?'input':'change',render));
  document.querySelector('.tag-filter-wrap').addEventListener('click',event=>{const button=event.target.closest('[data-tag]');if(!button)return;activeTag=button.dataset.tag;document.querySelectorAll('.tag-filter').forEach(item=>item.classList.toggle('active',item.dataset.tag===activeTag));render()});
  results.addEventListener('click',event=>{
    const card=event.target.closest('.song-card');if(!card)return;
    const song=findSong(card.dataset.id);if(!song)return;
    if(event.target.closest('[data-action="favorite"]')){db.toggleFavorite(song.id);render();return;}
    if(event.target.closest('[data-action="preview"]')){openSong(song);return;}
    if(event.target.closest('[data-action="copy-private"]')){
      try{const copied=catalog.copyToPrivate(song.id);window.location.href=`inserir-cifra.html?local=${encodeURIComponent(copied.id)}`;}catch(error){alert(error?.message||'Não foi possível criar sua versão.');}
    }
  });
  $('library-reset').addEventListener('click',()=>{input.value='';filter.value='all';sort.value='updated';activeTag='';document.querySelectorAll('.tag-filter').forEach(item=>item.classList.toggle('active',item.dataset.tag===''));render()});
  $('library-refresh-global').addEventListener('click',async()=>{const button=$('library-refresh-global');button.disabled=true;button.textContent='Atualizando…';try{await catalog.refresh();renderTags();render();}catch(error){alert(error?.message||'Não foi possível atualizar o catálogo global.');}finally{button.disabled=false;button.textContent='Atualizar catálogo';}});
  window.addEventListener('stage-music-global-catalog-updated',()=>{renderTags();render()});
  renderTags();render();catalog?.start?.();
});
})();
