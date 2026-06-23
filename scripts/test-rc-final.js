const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const errors=[];
function has(file,token){const txt=fs.readFileSync(path.join(root,file),'utf8');if(!txt.includes(token))errors.push(`${file}: ausente ${token}`)}
for(const f of ['homologacao.html','css/rc-final.css','js/rc-final.js','docs/AUDITORIA-FASE-38.md','docs/TESTES-FASE-38.md','docs/RELEASE-CANDIDATE-FINAL-FASE-38.md','docs/FIREBASE-INTEGRITY-FASE-38.sha256']){if(!fs.existsSync(path.join(root,f)))errors.push(`Arquivo ausente: ${f}`)}
has('homologacao.html','data-copy-final-report');
has('homologacao.html','Play Store nem na App Store');
has('homologacao.html','Android, iPhone, tablet e computador');
has('homologacao.html','data-rc-check');
has('js/rc-final.js','stage_music_rc_final_checks_v1');
has('service-worker.js','stage-music-v4-');
has('service-worker.js','./homologacao.html');
has('manifest.json','Homologação final');
const info=JSON.parse(fs.readFileSync(path.join(root,'BUILD-INFO.json'),'utf8'));
if(info.phase<38||Number(info.versionNumber.split('.')[0])<4)errors.push('BUILD-INFO abaixo do RC final.');
if(errors.length){console.error('TESTE RC FINAL REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log(`TESTE RC FINAL APROVADO — Stage Music ${info.version} Fase ${info.phase}`);
