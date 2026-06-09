(function () {
  const formatDate = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.matches('[data-page="inserir-cifra"]')) return;
    if (!window.StageMusicAuth.requireAuth('inserir-cifra.html')) return;

    const titleInput = document.getElementById('song-title');
    const artistInput = document.getElementById('song-artist');
    const keyInput = document.getElementById('song-key');
    const bpmInput = document.getElementById('song-bpm');
    const tagsInput = document.getElementById('song-tags');
    const notesInput = document.getElementById('song-notes');
    const contentInput = document.getElementById('song-content');
    const preview = document.getElementById('song-preview');
    const form = document.getElementById('song-form');
    const libraryEl = document.getElementById('local-library');
    const draftStampEl = document.getElementById('draft-stamp');
    const saveStampEl = document.getElementById('save-stamp');
    const statsSongsEl = document.getElementById('stats-songs');
    const statsDraftEl = document.getElementById('stats-draft');
    const statusToastEl = document.getElementById('editor-toast');
    const hiddenIdInput = document.getElementById('song-id');
    const clearButton = document.getElementById('clear-editor');
    const demoButton = document.getElementById('load-demo');
    const draftButton = document.getElementById('save-draft');
    const exportButton = document.getElementById('export-local-json');

    let draftTimer = null;

    const getPayload = () => ({
      id: hiddenIdInput.value || '',
      title: titleInput.value,
      artist: artistInput.value,
      key: keyInput.value,
      bpm: bpmInput.value,
      tags: tagsInput.value,
      notes: notesInput.value,
      content: contentInput.value
    });

    const showToast = (message) => {
      statusToastEl.textContent = message;
      statusToastEl.classList.add('visible');
      window.clearTimeout(showToast._timer);
      showToast._timer = window.setTimeout(() => statusToastEl.classList.remove('visible'), 2200);
    };

    const renderPreview = () => {
      preview.textContent = `${titleInput.value || 'Sem título'}\n${artistInput.value || 'Sem artista'} • Tom ${keyInput.value} • ${bpmInput.value || '--'} BPM\n${tagsInput.value ? `Tags: ${tagsInput.value}\n` : ''}\n${contentInput.value || 'Preencha a cifra para visualizar aqui.'}`;
    };

    const updateStats = () => {
      const stats = window.StageMusicLocalDB.getStats();
      statsSongsEl.textContent = String(stats.songsCount);
      statsDraftEl.textContent = stats.draftExists ? `Rascunho em ${formatDate(stats.lastDraftUpdatedAt)}` : 'Nenhum rascunho';
      draftStampEl.textContent = stats.lastDraftUpdatedAt ? `Rascunho salvo automaticamente em ${formatDate(stats.lastDraftUpdatedAt)}` : 'Auto-save pronto';
      saveStampEl.textContent = stats.lastSongUpdatedAt ? `Última cifra local salva em ${formatDate(stats.lastSongUpdatedAt)}` : 'Nenhuma cifra local salva';
    };

    const loadIntoForm = (song) => {
      hiddenIdInput.value = song?.id || '';
      titleInput.value = song?.title || '';
      artistInput.value = song?.artist || '';
      keyInput.value = song?.key || 'C';
      bpmInput.value = song?.bpm || '72';
      tagsInput.value = Array.isArray(song?.tags) ? song.tags.join(', ') : (song?.tags || '');
      notesInput.value = song?.notes || '';
      contentInput.value = song?.content || '';
      renderPreview();
    };

    const renderLibrary = (songs) => {
      if (!songs.length) {
        libraryEl.innerHTML = '<article class="library-empty"><strong>Nenhuma cifra local ainda</strong><small>Salve sua primeira cifra ou deixe um rascunho automático.</small></article>';
        return;
      }
      libraryEl.innerHTML = songs.map(song => `
        <article class="library-item">
          <div>
            <strong>${escapeHtml(song.title)}</strong>
            <small>${escapeHtml(song.artist)} • Tom ${escapeHtml(song.key)} • ${escapeHtml(song.bpm)} BPM</small>
            <small>Atualizada em ${escapeHtml(formatDate(song.updatedAt))}</small>
          </div>
          <div class="library-actions">
            <button class="btn btn-outline btn-mini" type="button" data-open-song="${escapeHtml(song.id)}">Abrir</button>
            <button class="btn btn-ghost btn-mini" type="button" data-delete-song="${escapeHtml(song.id)}">Excluir</button>
          </div>
        </article>`).join('');
    };

    const refreshLibrary = () => {
      renderLibrary(window.StageMusicLocalDB.getAllSongs());
      updateStats();
    };

    const saveDraft = (feedback = false) => {
      const payload = getPayload();
      if (!payload.title && !payload.artist && !payload.content) {
        window.StageMusicLocalDB.clearDraft();
        updateStats();
        return;
      }
      window.StageMusicLocalDB.saveDraft(payload);
      updateStats();
      if (feedback) showToast('Rascunho salvo no dispositivo.');
    };

    const scheduleDraftSave = () => {
      window.clearTimeout(draftTimer);
      draftTimer = window.setTimeout(() => saveDraft(false), 500);
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const song = window.StageMusicLocalDB.saveSong(getPayload());
      hiddenIdInput.value = song.id;
      refreshLibrary();
      renderPreview();
      showToast('Cifra salva localmente com sucesso.');
    });

    [titleInput, artistInput, keyInput, bpmInput, tagsInput, notesInput, contentInput].forEach((field) => {
      field.addEventListener('input', () => {
        renderPreview();
        scheduleDraftSave();
      });
      field.addEventListener('change', scheduleDraftSave);
    });

    libraryEl.addEventListener('click', (event) => {
      const openId = event.target.getAttribute('data-open-song');
      const deleteId = event.target.getAttribute('data-delete-song');
      if (openId) {
        const song = window.StageMusicLocalDB.getSongById(openId);
        if (song) {
          loadIntoForm(song);
          showToast('Cifra local carregada no editor.');
        }
      }
      if (deleteId) {
        const song = window.StageMusicLocalDB.getSongById(deleteId);
        const confirmed = window.confirm(`Excluir a cifra local "${song?.title || 'Sem título'}"?`);
        if (!confirmed) return;
        window.StageMusicLocalDB.deleteSong(deleteId);
        if (hiddenIdInput.value === deleteId) {
          hiddenIdInput.value = '';
        }
        refreshLibrary();
        showToast('Cifra local removida.');
      }
    });

    demoButton.addEventListener('click', () => {
      loadIntoForm({
        title: 'Santo',
        artist: 'Ariane Mazur',
        key: 'D',
        bpm: '74',
        tags: ['worship', 'rock', 'palco'],
        notes: 'Entrar suave, subir no refrão final.',
        content: `[Intro]\nD  A  Bm  G\n\n[Verso]\nD                A\nTeu nome é santo sobre mim\nBm               G\nTua presença enche este lugar\n\n[Refrão]\nD        A\nSanto, santo\nBm          G\nÉs digno de louvor`
      });
      saveDraft(true);
    });

    draftButton.addEventListener('click', () => saveDraft(true));

    clearButton.addEventListener('click', () => {
      const confirmed = window.confirm('Limpar o editor e apagar o rascunho atual do dispositivo?');
      if (!confirmed) return;
      form.reset();
      hiddenIdInput.value = '';
      keyInput.value = 'C';
      bpmInput.value = '72';
      window.StageMusicLocalDB.clearDraft();
      renderPreview();
      refreshLibrary();
      showToast('Editor limpo e rascunho removido.');
    });

    exportButton.addEventListener('click', () => {
      const songsJson = window.StageMusicLocalDB.exportSongs();
      const blob = new Blob([songsJson], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stage-music-cifras-locais-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('Backup JSON das cifras locais exportado.');
    });

    const draft = window.StageMusicLocalDB.getDraft();
    if (draft) loadIntoForm(draft);
    renderPreview();
    refreshLibrary();
  });
})();
