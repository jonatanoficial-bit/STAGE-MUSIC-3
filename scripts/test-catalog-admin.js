const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const errors=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['catalogo-admin.html','css/catalog-admin.css','js/catalog-admin.js','docs/AUDITORIA-FASE-28.md','docs/TESTES-FASE-28.md','docs/CENTRAL-ADMINISTRATIVA-FASE-28.md','docs/FIREBASE-INTEGRITY-FASE-28.sha256'])if(!fs.existsSync(path.join(root,file)))errors.push(`Ausente: ${file}`);
const page=read('catalogo-admin.html');
for(const token of ['catalog-import-text','import-to-queue','catalog-queue-list','publish-ready-queue','publish-current-next','catalog-duplicate-policy','js/catalog-admin.js'])if(!page.includes(token))errors.push(`Central administrativa sem ${token}`);
const admin=read('js/catalog-admin.js');
for(const token of ['adminCatalogQueue','parseDelimited','detectDelimiter','duplicateTarget','publishAllReady','stage_music_admin_editor_transfer','saveCloudItem','loadCloudQueue'])if(!admin.includes(token))errors.push(`Motor administrativo sem ${token}`);
const auth=read('js/auth.js');
for(const token of ['ensureAuthenticated','restorePromise','stage-music-auth-ready','browserLocalPersistence'])if(!auth.includes(token))errors.push(`Restauração de autenticação sem ${token}`);
const editor=read('js/global-catalog-editor.js');
for(const token of ['publish-global-next','new-global-song','stage-music-editor-cleared','resetForNext','adminTransfer'])if(!editor.includes(token))errors.push(`Editor global seguro sem ${token}`);
const catalog=read('js/global-catalog.js');
for(const token of ['createGlobalId','Math.random','findDuplicate','style:String'])if(!catalog.includes(token))errors.push(`Catálogo global sem ${token}`);
const editorHtml=read('inserir-cifra.html');
for(const token of ['catalogo-admin.html','publish-global-next','new-global-song','song-style'])if(!editorHtml.includes(token))errors.push(`Editor HTML sem ${token}`);
const sw=read('service-worker.js');
for(const token of ['./catalogo-admin.html','./css/catalog-admin.css','./js/catalog-admin.js','stage-music-v3-5-0'])if(!sw.includes(token))errors.push(`Cache da Fase 28 sem ${token}`);

const vm=require('vm');
const sandbox={window:{StageMusicGlobalCatalog:null},document:{addEventListener:()=>{}},localStorage:{getItem:()=>null,setItem:()=>{}},sessionStorage:{setItem:()=>{}},location:{href:''},console,CustomEvent:function(){}};
vm.createContext(sandbox);
vm.runInContext(admin,sandbox,{filename:'catalog-admin.js'});
const tools=sandbox.window.StageMusicCatalogAdminTools;
if(!tools)errors.push('Ferramentas de importação não foram expostas para teste.');
else{
  const tsv='Música\tArtista\tEstilo\tTags\tTom oficial\tBPM oficial\nSanto\tBanda Teste\tWorship\tAdoração, Ao vivo\tC\t72';
  const parsed=tools.importRows(tsv);
  if(parsed.length!==1||parsed[0].title!=='Santo'||parsed[0].artist!=='Banda Teste'||parsed[0].style!=='Worship'||parsed[0].key!=='C'||parsed[0].bpm!=='72')errors.push('Parser TSV não preservou as seis colunas.');
  const semi='Música;Artista;Estilo;Tags;Tom oficial;BPM oficial\nRocha;Grupo;Rock;Guitarra, Banda;E;120';
  const parsedSemi=tools.importRows(semi);
  if(parsedSemi.length!==1||parsedSemi[0].title!=='Rocha'||parsedSemi[0].bpm!=='120')errors.push('Parser por ponto e vírgula falhou.');
  const complete='Música\tArtista\tEstilo\tTags\tTom oficial\tBPM oficial\tConteúdo da cifra\nTeste\tArtista\tWorship\tAo vivo\tG\t70\t[Intro] C G';
  const parsedComplete=tools.importRows(complete);
  if(parsedComplete[0]?.status!=='ready'||!parsedComplete[0]?.content.includes('[Intro]'))errors.push('Importação completa não ficou pronta para publicação.');
}
if(errors.length){console.error('TESTE FASE 28 REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('TESTE FASE 28 APROVADO — fila em nuvem, importação, duplicidades, publicação segura e sessão restaurada.');
