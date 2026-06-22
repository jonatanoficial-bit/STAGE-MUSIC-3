const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const workspace=read('js/workspace-cloud.js');
for(const token of [
  "stage_music_setlists_v1",
  "stage_music_teams_v1",
  "stage_music_events_v1",
  "runtime.doc(runtime.db,'users',uid,def.cloud,item.id)",
  'deleteDoc',
  'restoreAll',
  'saveSetlists',
  'saveTeams',
  'saveEvents',
  'Salvo na conta Google'
]) assert.ok(workspace.includes(token),`Persistência incompleta: ${token}`);

const setlists=read('js/setlists.js');
assert.ok(setlists.includes('StageMusicWorkspaceCloud?.saveSetlists'),'Repertórios sem salvamento permanente.');
assert.ok(setlists.includes('deleteSetlist'),'Exclusão de repertório não remove da nuvem.');
assert.ok(setlists.includes('save({immediate:true})'),'Criação de repertório não é enviada imediatamente.');
assert.ok((setlists.match(/StageMusicWorkspaceCloud\?\.saveSetlists/g)||[]).length>=2,'Edições de campos do repertório não estão protegidas pela camada permanente.');

const teams=read('js/teams.js');
assert.ok(teams.includes('StageMusicWorkspaceCloud?.saveTeams'),'Equipes sem salvamento permanente.');
assert.ok(teams.includes('deleteTeam'),'Exclusão de equipe não remove da nuvem.');

const events=read('js/events.js');
assert.ok(events.includes('StageMusicWorkspaceCloud?.saveEvents'),'Eventos sem salvamento permanente.');
assert.ok(events.includes('deleteEvent'),'Exclusão de evento não remove da nuvem.');

for(const page of ['index.html','minhas-listas.html','equipes.html','eventos.html','sala-live.html','modo-live.html']){
  assert.ok(read(page).includes('js/workspace-cloud.js'),`${page} não carrega a proteção permanente.`);
}

console.log('FASE 27 — PERSISTÊNCIA DE REPERTÓRIOS, EQUIPES E EVENTOS: APROVADA');
