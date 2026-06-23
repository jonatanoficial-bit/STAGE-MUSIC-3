const fs=require('fs');
const required=['js/qr-scanner.js','js/live-choice.js','css/live.css','css/live-room.css','css/invite.css','modo-live.html','sala-live.html','convite.html','docs/AUDITORIA-FASE-39.md','docs/TESTES-FASE-39.md'];
const errors=[];
for(const file of required){if(!fs.existsSync(file))errors.push(`Arquivo ausente: ${file}`)}
const info=JSON.parse(fs.readFileSync('BUILD-INFO.json','utf8'));
if(info.version!=='v4.6.0'||info.phase!==39||info.resilience!=='anti-break-v43')errors.push('BUILD-INFO não está na Fase 39 v4.6.0.');
const live=fs.readFileSync('modo-live.html','utf8');
for(const token of ['live-view-toggle','js/live-choice.js','Aguardando repertório ou Sala Live'])if(!live.includes(token))errors.push(`Modo Live sem ${token}`);
const liveCss=fs.readFileSync('css/live.css','utf8');
for(const token of ['.live-empty[hidden]','.live-view-choice','.live-app.live-immersive .live-scroll-tools','language-switcher'])if(!liveCss.includes(token)&&!fs.readFileSync('css/i18n.css','utf8').includes(token))errors.push(`CSS sem ${token}`);
const room=fs.readFileSync('sala-live.html','utf8');
for(const token of ['room-scan-qr','js/qr-scanner.js','Ler QR Code pela câmera'])if(!room.includes(token))errors.push(`Sala Live sem ${token}`);
const invite=fs.readFileSync('convite.html','utf8');
for(const token of ['invite-scan-qr','js/qr-scanner.js','js/live-sharing-core.js'])if(!invite.includes(token))errors.push(`Convite sem ${token}`);
const roomJs=fs.readFileSync('js/live-room.js','utf8');
for(const token of ['persistViewChoice','shouldAuto','Entrar e abrir letra','QRScanner'])if(!roomJs.includes(token))errors.push(`live-room.js sem ${token}`);
const choice=fs.readFileSync('js/live-choice.js','utf8');
for(const token of ['stage_music_reader_choice_','Quero letra','Quero cifra','setDisplayMode'])if(!choice.includes(token))errors.push(`live-choice.js sem ${token}`);
const share=fs.readFileSync('js/live-sharing-core.js','utf8');
if(!share.includes("new URL('convite.html'"))errors.push('QR/link ainda não aponta para convite.html.');
const i18n=fs.readFileSync('js/i18n.js','utf8');
if(!i18n.includes("getLang:()=> 'pt'")||!i18n.includes('app fixado em português'))errors.push('i18n não foi travado em português.');
const sw=fs.readFileSync('service-worker.js','utf8');
for(const token of ['stage-music-v4-6-0','./js/qr-scanner.js'])if(!sw.includes(token))errors.push(`Service Worker sem ${token}`);
if(errors.length){console.error('TESTE FASE 39 REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE FASE 39 APROVADO — convite QR, letra/cifra e Live sem área fantasma');
