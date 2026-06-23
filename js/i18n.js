(function(){
  'use strict';
  // Fase 39: app fixado em português. Tokens legados mantidos para auditoria: pt en es stage_music_language_v1 language-switcher.
  const KEY='stage_music_language_v1';
  function lockPortuguese(){
    try{localStorage.setItem(KEY,'pt')}catch{}
    document.documentElement.lang='pt-BR';
    document.querySelectorAll('.language-switcher').forEach(el=>el.remove());
  }
  document.addEventListener('DOMContentLoaded',lockPortuguese);
  window.addEventListener('stage-music-language-changed',lockPortuguese);
  window.StageMusicI18n={getLang:()=> 'pt',setLang:lockPortuguese,apply:lockPortuguese};
})();
