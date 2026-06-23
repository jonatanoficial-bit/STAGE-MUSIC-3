
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function assert(cond,msg){if(!cond){console.error('❌',msg);process.exit(1)}}
const qr=read('js/qr-scanner.js');
assert(qr.includes("document.readyState==='loading'"),'QR scanner precisa anexar evento imediatamente após DOMContentLoaded.');
assert(qr.includes("button.dataset.qrBound"),'QR scanner precisa evitar múltiplos binds.');
const convite=read('convite.html');
assert(!convite.includes('PASSO 1')&&!convite.includes('PASSO 2'),'Convite não deve exibir passos explicativos.');
assert(!convite.includes('Ainda não está na Play Store'),'Convite não deve carregar texto comercial longo no fluxo de entrada.');
assert(convite.includes('Ler QR'),'Convite precisa manter ação curta de QR.');
const live=read('modo-live.html');
assert(!live.includes('Entre por convite, crie uma Sala Live'),'Modo Live não deve exibir explicação longa no vazio.');
assert(!live.includes('js/i18n.js'),'Modo Live não deve carregar seletor de idiomas.');
const sala=read('sala-live.html');
assert(sala.includes('Ler QR'),'Sala Live precisa manter botão de QR.');
assert(!sala.includes('Central do Diretor: repertório, tom e banda em uma só tela'),'Sala Live não deve exibir título explicativo longo.');
const firebaseFiles=['js/firebase-config.js','js/firebase-runtime.js','js/firebase-live.js','js/cloud-sync.js','firestore.rules'];
for(const f of firebaseFiles)assert(fs.existsSync(f),`Firebase preservado: ${f}`);
console.log('✅ Fase 40: interface limpa e QR funcional auditados.');
