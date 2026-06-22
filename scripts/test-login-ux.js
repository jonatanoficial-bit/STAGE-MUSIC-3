const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'login-cifra.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/auth.css'),'utf8');
const errors=[];
for(const token of [
  'data-google-login',
  'Continuar com Google',
  'data-mode="online"',
  'data-mode="local"',
  'id="email-login-form"',
  'data-local-login',
  'account-privacy-note',
  'Suas cifras não ficam públicas automaticamente',
  'data-session-badge'
]) if(!html.includes(token)) errors.push('Login ausente: '+token);
for(const token of [
  'google-login-btn',
  'auth-mode-switch',
  'account-privacy-note',
  '@media(max-width:520px)',
  '.auth-brand-refined{\n    display:none;'
]) if(!css.includes(token)) errors.push('CSS de login ausente: '+token);
for(const unwanted of ['Firebase Auth + Firestore','Fase 11 •','Preencher demo','Como ativar o Firebase real']) if(html.includes(unwanted)) errors.push('Texto técnico/desnecessário ainda visível: '+unwanted);
if(errors.length){console.error('TESTE LOGIN UX REPROVADO\n'+errors.join('\n'));process.exit(1)}
console.log('LOGIN UX: APROVADO — Google prioritário, modo local preservado e privacidade clara');
