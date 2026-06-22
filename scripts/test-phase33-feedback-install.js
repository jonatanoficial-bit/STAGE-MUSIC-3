const fs=require('fs');
const required=['feedback.html','instalar.html','js/feedback.js','css/feedback.css','BUILD-INFO.json','service-worker.js','manifest.json'];
const errors=[];
for(const file of required){if(!fs.existsSync(file))errors.push(`Arquivo ausente: ${file}`)}
const build=JSON.parse(fs.readFileSync('BUILD-INFO.json','utf8'));
if(build.version!=='v4.0.0'||build.phase!==33)errors.push('Build info não corresponde à Fase 33.');
const sw=fs.readFileSync('service-worker.js','utf8');
for(const token of ['feedback.html','instalar.html','js/feedback.js','css/feedback.css'])if(!sw.includes(token))errors.push(`Service Worker não inclui ${token}`);
const feedback=fs.readFileSync('feedback.html','utf8');
for(const token of ['Enviar feedback','js/feedback.js','Conta Google'])if(!feedback.includes(token))errors.push(`Feedback sem token ${token}`);
const install=fs.readFileSync('instalar.html','utf8');
for(const token of ['Play Store','App Store','Android','iPhone'])if(!install.includes(token))errors.push(`Instalação sem token ${token}`);
if(errors.length){console.error('TESTE FASE 33 REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE FASE 33 APROVADO — feedback e instalação');
