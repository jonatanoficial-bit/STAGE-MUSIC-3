const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const errors=[];
const liveHtml=read('modo-live.html');
const liveJs=read('js/live-mode.js');
const liveCss=read('css/live.css');
const roomCss=read('css/live-room.css');
const build=JSON.parse(read('BUILD-INFO.json'));
if(build.version!=='v3.6.0'||build.phase!==29) errors.push('Build info não atualizado para v3.6.0 / fase 29.');
if(/Abrir repertórios/.test(liveHtml)) errors.push('Modo Live ainda exibe botão grande Abrir repertórios.');
if(!/Aguardando apresentação/.test(liveHtml)) errors.push('Estado vazio do Modo Live não foi simplificado.');
for(const token of ['live-title','live-artist','live-key','live-next-title']) if(!liveJs.includes(token)) errors.push('Render vazio não zera '+token);
if(!liveJs.includes('Math.abs(dx)>130&&Math.abs(dx)>Math.abs(dy)*1.9')) errors.push('Proteção contra troca acidental por rolagem vertical ausente.');
if(!liveCss.includes('live-app.live-immersive .live-song-head')) errors.push('Título fixo no modo imersivo ausente.');
if(!roomCss.includes('room-invite-mode .room-control-card')) errors.push('Convite da Sala Live ainda pode mostrar criação de sala.');
const htmlFiles=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
for(const file of htmlFiles){
  const txt=read(file);
  if(/Fase \d+|Release Candidate|RELEASE CANDIDATE/.test(txt)) errors.push('Texto interno visível em '+file);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Fase 29 OK');
