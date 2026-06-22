const fs=require('fs');
const required=['produto.html','ajuda.html','privacidade.html','termos.html','css/i18n.css','js/i18n.js','docs/AUDITORIA-FASE-37.md','docs/TESTES-FASE-37.md','docs/FIREBASE-INTEGRITY-FASE-37.sha256'];
const errors=[];
for(const file of required){if(!fs.existsSync(file))errors.push(`Arquivo ausente: ${file}`)}
const build=JSON.parse(fs.readFileSync('BUILD-INFO.json','utf8'));
if(build.version!=='v4.4.0'||build.phase!==37)errors.push('Build info não corresponde à Fase 37.');
const sw=fs.readFileSync('service-worker.js','utf8');
for(const token of ['stage-music-v4-4-0','produto.html','ajuda.html','privacidade.html','termos.html','css/i18n.css','js/i18n.js'])if(!sw.includes(token))errors.push(`Service Worker sem ${token}`);
const i18n=fs.readFileSync('js/i18n.js','utf8');
for(const token of ['pt','en','es','stage_music_language_v1','language-switcher'])if(!i18n.includes(token))errors.push(`i18n incompleto: ${token}`);
for(const file of ['produto.html','ajuda.html','privacidade.html','termos.html']){
  const html=fs.readFileSync(file,'utf8');
  for(const token of ['data-lang="pt"','data-lang="en"','data-lang="es"','js/i18n.js','data-build-info'])if(!html.includes(token))errors.push(`${file} sem ${token}`);
}
const manifest=fs.readFileSync('manifest.json','utf8');
for(const token of ['Portuguese','English','Spanish','./ajuda.html','./produto.html'])if(!manifest.includes(token))errors.push(`Manifest sem ${token}`);
if(errors.length){console.error('TESTE FASE 37 REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE FASE 37 APROVADO — produto internacional PT/EN/ES');
