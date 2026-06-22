const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const H=require(path.join(root,'js','harmonic-engine.js'));

const transposed=H.transposeText('[Verso]\nC   G   Am   F\nTu és fiel',2,'sharp','D');
assert.ok(transposed.includes('D   A   Bm   G'),'A cifra deve ser transposta de C para D.');
const medley=H.transposeText('A   E/G#   F#m   D\nTu és o único motivo',7,'sharp','E');
assert.ok(medley.includes('E   B/D#   C#m   A'),'A cifra deve ser transposta de A para E com baixo invertido.');
assert.strictEqual(H.transposeKey('Dm',2,'flat'),'Em','Tonalidades menores devem manter o modo.');

const roomPage=read('sala-live.html');
for(const token of ['director-performance-key','director-apply-key','director-save-key','director-reset-key','director-open-live','director-advanced-toggle']){
  assert.ok(roomPage.includes(token),`Sala Live sem ${token}`);
}
assert.ok(!roomPage.includes('+1 semitom'),'A interface não deve depender de +1 semitom.');
assert.ok(!roomPage.includes('−1 semitom'),'A interface não deve depender de −1 semitom.');

const roomJs=read('js/live-room.js');
for(const token of ['targetKey','savePerformanceKey','savedPerformanceKey','effectivePerformanceKey','KEY_OPTIONS']){
  assert.ok(roomJs.includes(token),`Central do Diretor incompleta: ${token}`);
}

const client=read('js/live-room-client.js');
for(const token of ['saveDirectorKey','applyDirectorKey','stage:live-local-navigation','StageMusicLiveMode','director-live-key']){
  assert.ok(client.includes(token),`Modo Live do diretor incompleto: ${token}`);
}

const live=read('js/live-mode.js');
for(const token of ['displayedContent','setTemporaryKey','updateSavedKey','transposeText','stage:live-local-navigation']){
  assert.ok(live.includes(token),`Transposição ao vivo incompleta: ${token}`);
}

const setlists=read('js/setlists.js');
for(const token of ['Tom desta apresentação','reset-key','create-room-from-setlist','originalKey']){
  assert.ok(setlists.includes(token),`Repertório por apresentação incompleto: ${token}`);
}

const mobile=read('js/mobile-audit.js');
assert.ok(mobile.includes("'sala-live.html','◎','Sala'"),'Sala Live deve aparecer no menu mobile.');

console.log('FASE 26 — CENTRAL DO DIRETOR: APROVADA');
