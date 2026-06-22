const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function ok(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}console.log('OK:',msg)}
const html=read('modo-live.html'), js=read('js/live-mode.js'), css=read('css/live.css'), sw=read('service-worker.js'), info=JSON.parse(read('BUILD-INFO.json'));
ok(info.phase>=36 && /^v4\.[3-9]\.0$/.test(info.version),'Build info Fase 36+');
ok(html.includes('live-reading-profile'),'Botão perfil de leitura existe');
ok(html.includes('live-autoscroll-mode'),'Botão rolagem inteligente existe');
ok(js.includes('readingProfile'),'JS controla perfil de leitura');
ok(js.includes('autoScrollMode'),'JS controla modo de rolagem');
ok(js.includes('smartScrollStep'),'Auto-scroll inteligente implementado');
ok(js.includes('renderLyrics')&&js.includes('lyric-cue'),'Letra limpa profissional implementada');
ok(css.includes('Fase 36')&&css.includes('live-reading-vocal'),'CSS de leitura vocal existe');
ok(css.includes('position:sticky')&&css.includes('live-song-head'),'Título fixo reforçado');
ok(sw.includes(info.versionNumber.replaceAll('.','-')),'Service Worker atualizado');
console.log('Teste Fase 36 concluído.');
