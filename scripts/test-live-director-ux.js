const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const live=read('modo-live.html');
for(const token of ['live-director-alert','director-quick-rail','director-quick-key','director-quick-message','director-live-message','director-live-send-message']){
  assert.ok(live.includes(token),`Modo Live sem ${token}`);
}

const client=read('js/live-room-client.js');
for(const token of ['showDirectorAlert','sendDirectorMessage','commandType','messages','openDirectorDock','setTemporaryKey']){
  assert.ok(client.includes(token),`Cliente Live incompleto: ${token}`);
}

const roomPage=read('sala-live.html');
for(const token of ['director-message-card','director-message-history','Enviar para todos','room-invite-pending']){
  assert.ok(roomPage.includes(token),`Sala Live sem ${token}`);
}

const roomJs=read('js/live-room.js');
for(const token of ["commandType='message'",'r.messages=[','savePerformanceKey','targetKey']){
  assert.ok(roomJs.includes(token),`Sala Live JS incompleta: ${token}`);
}

const liveCss=read('css/live.css');
for(const token of ['.live-director-alert','.director-quick-rail','.director-dock-message'])assert.ok(liveCss.includes(token),`CSS Live sem ${token}`);
const roomCss=read('css/live-room.css');
for(const token of ['.room-invite-pending','.director-message-card','.director-message-history'])assert.ok(roomCss.includes(token),`CSS Sala sem ${token}`);

console.log('FASE 27 — CHAT, ALERTA E CONTROLES MÓVEIS DO DIRETOR: APROVADA');
