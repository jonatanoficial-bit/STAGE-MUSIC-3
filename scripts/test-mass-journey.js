const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const errors=[];
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
for(const required of ['teste-massa.html','css/teste-massa.css','js/teste-massa.js','docs/AUDITORIA-FASE-32.md','docs/TESTES-FASE-32.md']){
  if(!fs.existsSync(path.join(root,required))) errors.push('Arquivo ausente: '+required);
}
const home=read('index.html');
for(const token of ['simple-journey-grid','Fui convidado','Sou diretor','Teste com a equipe','teste-massa.html']){
  if(!home.includes(token)) errors.push('Home sem jornada: '+token);
}
const test=read('teste-massa.html');
for(const token of ['data-test="room"','data-test="vocal"','data-test="key"','copy-test-report','js/teste-massa.js']){
  if(!test.includes(token)) errors.push('Teste em grupo incompleto: '+token);
}
const js=read('js/teste-massa.js');
for(const token of ['stage_music_mass_test_v1','navigator.clipboard.writeText','localStorage.setItem']){
  if(!js.includes(token)) errors.push('JS de teste incompleto: '+token);
}
const sw=read('service-worker.js');
for(const token of ['./teste-massa.html','./css/teste-massa.css','./js/teste-massa.js']){
  if(!sw.includes(token)) errors.push('Cache ausente: '+token);
}
if(/Fase 23|Release Candidate|RELEASE CANDIDATE/.test(home)) errors.push('Home ainda contém linguagem técnica antiga.');
if(errors.length){console.error('TESTE FASE 32 REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE FASE 32 APROVADO — jornada simples e teste em grupo');
