window.StageMusicBuild = Object.freeze({
  app: 'Stage Music', version: 'v0.8.0', versionNumber: '0.8.0', date: '09/06/2026', isoDate: '2026-06-09',
  time: '12:38', stamp: '20260609-1238', phase: 3, phaseLabel: 'Fase 3', phaseName: 'Biblioteca de Cifras Profissional',
  environment: 'production', costStrategy: 'free-first', resilience: 'anti-break-v2'
});
(function renderBuildInfo(){
 const b=window.StageMusicBuild; const full='Build '+b.version+' • '+b.date+' '+b.time+' • '+b.phaseLabel;
 document.querySelectorAll('[data-build-info], #build-info').forEach(function(el){el.textContent=full;el.title=b.phaseName+' • '+b.environment+' • '+b.resilience});
 document.querySelectorAll('[data-build-version]').forEach(function(el){el.textContent=b.version});
 document.querySelectorAll('[data-build-phase]').forEach(function(el){el.textContent=b.phaseLabel+' — '+b.phaseName});
 document.documentElement.dataset.build=b.versionNumber;
})();
