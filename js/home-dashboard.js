(function(){
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[char]));
  const fmtDate = (iso) => {
    if (!iso) return 'Sem dados';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? 'Sem dados' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };
  const durationText = (minutes) => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    return total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}min` : `${total} min`;
  };
  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };
  const getSetlists = () => {
    const stored = window.StageMusicSafeStorage?.get?.('stage_music_setlists_v1', null);
    const lists = Array.isArray(stored) ? stored : safeParse(localStorage.getItem('stage_music_setlists_v1') || '[]', []);
    return Array.isArray(lists) ? lists : [];
  };
  const getActiveSetlist = () => {
    const stored = window.StageMusicSafeStorage?.get?.('stage_music_active_setlist', null);
    const current = stored && typeof stored === 'object' ? stored : safeParse(localStorage.getItem('stage_music_active_setlist') || 'null', null);
    return current && typeof current === 'object' ? current : null;
  };
  const setSearchPrefill = (term) => {
    try { localStorage.setItem('stage_music_home_search_term', String(term || '').trim()); } catch {}
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.matches('[data-page="home"]')) return;

    const db = window.StageMusicLocalDB;
    const songs = db?.getAllSongs?.() || [];
    const stats = db?.getStats?.() || { songsCount: 0, favoritesCount: 0, recentCount: 0, lastSongUpdatedAt: null };
    const recentIds = db?.getRecentIds?.() || [];
    const recentSongs = recentIds.map((id) => db.getSongById(id)).filter(Boolean);
    const recentPool = recentSongs.length ? recentSongs : songs.slice(0, 3);
    const setlists = getSetlists().slice().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    const activeSetlist = getActiveSetlist() || setlists[0] || null;
    const totalSongsInSetlists = setlists.reduce((sum, list) => sum + (Array.isArray(list.songs) ? list.songs.length : 0), 0);
    const readySongs = setlists.flatMap((list) => Array.isArray(list.songs) ? list.songs : []).filter((song) => song?.rehearsed).length;
    const readyPercent = totalSongsInSetlists ? `${Math.round((readySongs / totalSongsInSetlists) * 100)}%` : '0%';

    const updateText = (id, text) => {
      const node = document.getElementById(id);
      if (node) node.textContent = text;
    };

    updateText('home-stat-songs', String(stats.songsCount || 0));
    updateText('home-stat-setlists', String(setlists.length));
    updateText('home-stat-favorites', String(stats.favoritesCount || 0));
    updateText('home-stat-ready', readyPercent);

    updateText('hero-live-name', activeSetlist?.name || 'Nenhum repertório ativo');
    updateText('hero-live-meta', activeSetlist ? `${activeSetlist.songs?.length || 0} músicas • ${activeSetlist.type || 'Evento'}${activeSetlist.date ? ` • ${activeSetlist.date}` : ''}` : 'Crie um repertório para começar sua rotina de palco.');
    updateText('hero-next-action', activeSetlist?.songs?.length ? 'Abrir Live' : 'Montar repertório');
    updateText('hero-library-size', `${stats.songsCount || 0} ${stats.songsCount === 1 ? 'cifra' : 'cifras'}`);
    updateText('hero-last-activity', fmtDate(stats.lastSongUpdatedAt || activeSetlist?.updatedAt || null));

    const recentWrap = document.getElementById('home-recent-songs');
    if (recentWrap) {
      if (!recentPool.length) {
        recentWrap.innerHTML = `
          <div class="song-row empty-home-row">
            <div class="song-meta">
              <strong>Sua biblioteca ainda está vazia</strong>
              <small>Crie ou importe sua primeira cifra para ver atalhos rápidos aqui.</small>
            </div>
            <div class="song-actions">
              <a class="soft-btn" href="login-cifra.html">Criar cifra</a>
            </div>
          </div>`;
      } else {
        recentWrap.innerHTML = recentPool.slice(0, 4).map((song) => `
          <article class="song-row">
            <div class="song-meta">
              <strong>${esc(song.title)}</strong>
              <small>${esc(song.artist || 'Sem artista')} • Tom ${esc(song.key || 'C')} • ${esc(song.bpm || '72')} BPM</small>
            </div>
            <div class="song-actions">
              <a class="soft-btn" href="modo-live.html">Live</a>
              <a class="soft-btn" href="buscar-cifra.html">Biblioteca</a>
            </div>
          </article>
        `).join('');
      }
    }

    const setlistWrap = document.getElementById('home-setlists');
    if (setlistWrap) {
      if (!setlists.length) {
        setlistWrap.innerHTML = `
          <div class="list-card empty-home-card">
            <strong>Nenhum repertório criado</strong>
            <small>Monte seu primeiro setlist para culto, show, ministração ou ensaio.</small>
            <div class="list-badges"><span>Começar</span><span>Organização</span></div>
          </div>`;
      } else {
        setlistWrap.innerHTML = setlists.slice(0, 3).map((list) => {
          const songsCount = Array.isArray(list.songs) ? list.songs.length : 0;
          const minutes = (list.songs || []).reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
          const ready = (list.songs || []).filter((item) => item?.rehearsed).length;
          return `
            <article class="list-card">
              <strong>${esc(list.name)}</strong>
              <small>${songsCount} ${songsCount === 1 ? 'música' : 'músicas'} • ${durationText(minutes)} • ${esc(list.type || 'Evento')}</small>
              <div class="list-badges">
                <span>${ready}/${songsCount || 0} prontas</span>
                <span>${esc(list.status || 'draft')}</span>
              </div>
            </article>
          `;
        }).join('');
      }
    }

    const searchInput = document.querySelector('[data-home-search]');
    if (searchInput) {
      searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const term = searchInput.value.trim();
        setSearchPrefill(term);
        event.preventDefault();
        window.location.href = 'buscar-cifra.html';
      });
    }

    document.querySelectorAll('[data-fill-search]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-fill-search') || '';
        setSearchPrefill(value);
      });
    });
  });
})();
