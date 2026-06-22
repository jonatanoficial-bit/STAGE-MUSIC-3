const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function ok(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}console.log('OK:',msg)}
ok(fs.existsSync(path.join(root,'js/live-stability.js')),'live-stability.js existe');
ok(fs.existsSync(path.join(root,'css/live-stability.css')),'live-stability.css existe');
ok(read('modo-live.html').includes('js/live-stability.js'),'Modo Live carrega estabilidade');
ok(read('sala-live.html').includes('js/live-stability.js'),'Sala Live carrega estabilidade');
ok(read('modo-live.html').includes('css/live-stability.css'),'Modo Live carrega CSS de estabilidade');
ok(read('sala-live.html').includes('css/live-stability.css'),'Sala Live carrega CSS de estabilidade');
ok(read('js/live-room-client.js').includes('safePutRoom'),'Central do Diretor usa escrita segura');
ok(read('js/live-room.js').includes('safePutRoom'),'Sala Live usa escrita segura');
ok(read('js/live-room-client.js').includes('isDuplicateAction'),'Central do Diretor bloqueia duplicidades');
ok(read('js/live-room.js').includes('isDuplicateAction'),'Sala Live bloqueia duplicidades');
ok(read('service-worker.js').includes('live-stability.js'),'Service Worker cacheia estabilidade');
const build=JSON.parse(read('BUILD-INFO.json'));
ok(build.phase>=35 && /^v4\.[2-9]\.0$/.test(build.version),'Build info atualizado');
console.log('Teste Fase 35 concluído.');
