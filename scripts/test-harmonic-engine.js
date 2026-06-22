const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const H=require(path.join(root,'js/harmonic-engine.js'));

const keys=H.keyOptions();
assert(keys.major.includes('C#')&&keys.major.includes('Db')&&keys.major.includes('Bb'),'tons maiores incompletos');
assert(keys.minor.includes('C#m')&&keys.minor.includes('Ebm')&&keys.minor.includes('Bbm'),'tons menores incompletos');
assert.strictEqual(keys.major.length,17,'quantidade inesperada de tons maiores');
assert.strictEqual(keys.minor.length,17,'quantidade inesperada de tons menores');

for(const chord of ['F7M(9)','G4(6)','C#m7','Bb9','D/F#','E7(#9)','Abm'])assert(H.isChordToken(chord),`acorde não reconhecido: ${chord}`);
for(const word of ['Aos','Grande','Brasil','Deus'])assert(!H.isChordToken(word),`palavra confundida com acorde: ${word}`);

assert.strictEqual(H.transposeKey('Bbm',2,'preserve'),'Cm');
assert.strictEqual(H.transposeKey('C#m',1,'preserve'),'Dm');
assert.strictEqual(H.transposeKey('Bb',1,'preserve'),'B');
assert.strictEqual(H.transposeKey('B',1,'flat'),'C');

const original='[Refrão]\nF7M(9)        Am        G4(6)\nAos Teus pés, me rendo e encontro meu lugar';
const transposed=H.transposeText(original,1,'flat','Bb');
assert(transposed.includes('Gb7M(9)'),'F7M(9) não transposto');
assert(transposed.includes('Bbm'),'Am não transposto para Bbm');
assert(transposed.includes('Ab4(6)'),'G4(6) não transposto');
assert(transposed.includes('Aos Teus pés'),'letra foi alterada durante transposição');

const rendered=H.renderResponsive(original);
assert.strictEqual(rendered.sections.length,1,'seção não reconhecida');
assert(rendered.html.includes('chord-lyric-row'),'linha responsiva não criada');
assert(rendered.html.includes('chord-lyric-segment'),'segmentos acorde/letra ausentes');
assert(rendered.html.includes('Aos Teus pés,'),'primeiro trecho de letra ausente');
assert(rendered.html.includes('me rendo e'),'segundo trecho de letra ausente');
assert(rendered.html.includes('encontro meu lugar'),'terceiro trecho de letra ausente');

const editor=fs.readFileSync(path.join(root,'inserir-cifra.html'),'utf8');
for(const token of ['<option>C#</option>','<option>Db</option>','<option>C#m</option>','<option>Bbm</option>','Manter escrita original','js/harmonic-engine.js'])assert(editor.includes(token),`editor incompleto: ${token}`);
const live=fs.readFileSync(path.join(root,'modo-live.html'),'utf8');
assert(live.includes('<div id="live-content" class="live-content" hidden></div>'),'Live ainda usa pre antigo');
assert(live.includes('js/harmonic-engine.js'),'motor harmônico ausente no Live');
const css=fs.readFileSync(path.join(root,'css/live.css'),'utf8');
for(const token of ['chord-lyric-row','chord-lyric-segment','lyric-text','chord-only-row'])assert(css.includes(token),`CSS responsivo ausente: ${token}`);

console.log('FASE 25: MOTOR HARMÔNICO E CIFRA RESPONSIVA — APROVADO');
