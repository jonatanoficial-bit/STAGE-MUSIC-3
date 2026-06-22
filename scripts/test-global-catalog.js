const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const errors=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
for(const file of ['js/global-catalog.js','js/global-catalog-editor.js','css/global-catalog.css','docs/AUDITORIA-FASE-24.md','docs/TESTES-FASE-24.md','docs/CATALOGO-GLOBAL-ADMIN.md'])if(!exists(file))errors.push('Arquivo ausente: '+file);
const rules=read('firestore.rules');
for(const token of ["match /globalSongs/{songId}","allow read: if signedIn()","isGlobalCatalogAdmin()","jonatanoficial@gmail.com","request.resource.data.status == 'published'"])if(!rules.includes(token))errors.push('Regra do catálogo ausente: '+token);
const globalBlock=(rules.match(/match \/globalSongs\/\{songId\} \{([\s\S]*?)\n    \}/)||[])[1]||'';if(globalBlock.includes('allow create: if signedIn()')||globalBlock.includes('allow write: if signedIn()'))errors.push('Catálogo global permite escrita a qualquer usuário autenticado.');
const catalog=read('js/global-catalog.js');
for(const token of ['globalSongs','onSnapshot','publishSong','deleteSong','copyToPrivate','stage-music-global-catalog-updated','ADMIN_EMAIL'])if(!catalog.includes(token))errors.push('Módulo global incompleto: '+token);
const library=read('buscar-cifra.html');
for(const token of ['library-global','Catálogo global','library-refresh-global','js/global-catalog.js','css/global-catalog.css'])if(!library.includes(token))errors.push('Biblioteca global incompleta: '+token);
const search=read('js/search-local.js');
for(const token of ["source==='global'",'copy-private','Editar global','catalog.refresh','global-catalog-updated'])if(!search.includes(token))errors.push('Busca global incompleta: '+token);
const editor=read('inserir-cifra.html');
for(const token of ['global-admin-panel','publish-global-song','delete-global-song','js/global-catalog-editor.js'])if(!editor.includes(token))errors.push('Editor administrativo incompleto: '+token);
const setlists=read('js/setlists.js');
for(const token of ['StageMusicGlobalCatalog','pickerSongs','content:s.content','Cifra global adicionada'])if(!setlists.includes(token))errors.push('Integração do repertório incompleta: '+token);
const sw=read('service-worker.js');
for(const token of ['./js/global-catalog.js','./js/global-catalog-editor.js','./css/global-catalog.css'])if(!sw.includes(token))errors.push('Cache global ausente: '+token);
const preserved={
 'js/firebase-config.js':'8effda68d3949e31c3d963b333ba6710b2414b9973eb3ae1d9ec5d3c75e7ec87',
 'js/firebase-runtime.js':'eaa2b85df2f966a839eb2ca2258e63a031986f3cb7bf2d9a1803432a5cbd22ab',
 'js/firebase-live.js':'afc98a0bfc9b68e86b933763810fd9a9d3ee6d775f236c8f5da0920330727f4e',
 'js/cloud-sync.js':'651cc682699f4d8eaee3b31f76eab7e8f4d4a61a93907138532bff6e295e89ce'
};
for(const [file,expected] of Object.entries(preserved)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 if(actual!==expected)errors.push(`Conexão Firebase alterada: ${file}`);
}
if(errors.length){console.error('TESTE CATÁLOGO GLOBAL REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE CATÁLOGO GLOBAL APROVADO — leitura global, administração exclusiva, repertórios e cache verificados.');
