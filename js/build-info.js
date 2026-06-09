window.StageMusicBuild = Object.freeze({
  app: 'Stage Music', version: 'v1.0.0', versionNumber: '1.0.0', date: '09/06/2026', isoDate: '2026-06-09',
  time: '12:56', stamp: '20260609-1256', phase: 5, phaseLabel: 'Fase 5', phaseName: 'Repertórios e Setlists',
  environment: 'production', costStrategy: 'free-first', resilience: 'anti-break-v4'
});
(function renderBuildInfo(){
 const b=window.StageMusicBuild; const full='Build '+b.version+' • '+b.date+' '+b.time+' • '+b.phaseLabel;
 document.querySelectorAll('[data-build-info], #build-info').forEach(function(el){el.textContent=full;el.title=b.phaseName+' • '+b.environment+' • '+b.resilience});
 document.querySelectorAll('[data-build-version]').forEach(function(el){el.textContent=b.version});
 document.querySelectorAll('[data-build-phase]').forEach(function(el){el.textContent=b.phaseLabel+' — '+b.phaseName});
 document.documentElement.dataset.build=b.versionNumber;
})();
