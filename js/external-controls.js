(function(){
'use strict';
const KEY='stage_music_external_controls_v1';
const DEFAULTS={
  enabled:true,
  preventDefault:true,
  mappings:{
    nextSong:['ArrowRight','PageDown'],
    previousSong:['ArrowLeft','PageUp'],
    nextSection:['ArrowDown'],
    previousSection:['ArrowUp'],
    toggleScroll:['Space'],
    fullscreen:['KeyF'],
    repeatSection:['KeyR'],
    fontUp:['Equal','NumpadAdd'],
    fontDown:['Minus','NumpadSubtract']
  },
  midi:{enabled:false,channel:'all',mappings:{
    nextSong:64,previousSong:65,nextSection:66,previousSection:67,toggleScroll:68,repeatSection:69
  }}
};
const ACTIONS={
  nextSong:{label:'Próxima música',button:'live-next-btn'},
  previousSong:{label:'Música anterior',button:'live-prev-btn'},
  nextSection:{label:'Próxima seção',button:'section-next'},
  previousSection:{label:'Seção anterior',button:'section-prev'},
  toggleScroll:{label:'Iniciar / pausar rolagem',button:'live-scroll-toggle'},
  fullscreen:{label:'Tela cheia',button:'live-fullscreen'},
  repeatSection:{label:'Repetir seção',button:'section-repeat'},
  fontUp:{label:'Aumentar fonte',button:'live-font-up'},
  fontDown:{label:'Diminuir fonte',button:'live-font-down'}
};
const safeParse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
const clone=v=>JSON.parse(JSON.stringify(v));
const storage={get(){try{return Object.assign(clone(DEFAULTS),safeParse(localStorage.getItem(KEY),{}))}catch{return clone(DEFAULTS)}},set(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch{return false}}};
let settings=storage.get(),learning=null,midiAccess=null,lastSignal='Nenhum sinal recebido';
const $=id=>document.getElementById(id);
const toast=msg=>window.StageMusicToast?.(msg);
const keyName=code=>({Space:'Espaço',ArrowRight:'→',ArrowLeft:'←',ArrowUp:'↑',ArrowDown:'↓',PageDown:'Page Down',PageUp:'Page Up',Equal:'+',Minus:'−',NumpadAdd:'Numpad +',NumpadSubtract:'Numpad −',KeyF:'F',KeyR:'R'}[code]||code.replace(/^Key/,'').replace(/^Digit/,''));
function execute(action,source='controle externo'){
  const def=ACTIONS[action];if(!def)return false;
  const button=$(def.button);if(!button||button.disabled)return false;
  button.click();lastSignal=`${def.label} • ${source} • ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;renderStatus();flash(action);return true;
}
function flash(action){const row=document.querySelector(`[data-control-action="${action}"]`);if(!row)return;row.classList.add('signal-active');clearTimeout(row.__flash);row.__flash=setTimeout(()=>row.classList.remove('signal-active'),380)}
function actionForCode(code){return Object.keys(settings.mappings||{}).find(action=>(settings.mappings[action]||[]).includes(code))||null}
function onKeydown(event){
  if(!settings.enabled)return;
  if(event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(learning){
    event.preventDefault();settings.mappings[learning]=[event.code];storage.set(settings);learning=null;render();toast('Atalho atualizado');return;
  }
  const action=actionForCode(event.code);if(!action)return;
  if(settings.preventDefault)event.preventDefault();
  event.stopImmediatePropagation();execute(action,`tecla ${keyName(event.code)}`);
}
function renderMappings(){
  const box=$('control-mapping-list');if(!box)return;
  box.innerHTML=Object.entries(ACTIONS).map(([action,def])=>`<article class="control-map-row" data-control-action="${action}"><div><strong>${def.label}</strong><small>${(settings.mappings[action]||[]).map(keyName).join(' ou ')||'Sem atalho'}</small></div><button type="button" data-learn-action="${action}">${learning===action?'Pressione uma tecla...':'Remapear'}</button></article>`).join('');
}
function renderStatus(){
  if($('controller-enabled'))$('controller-enabled').checked=!!settings.enabled;
  if($('controller-prevent'))$('controller-prevent').checked=!!settings.preventDefault;
  if($('midi-enabled'))$('midi-enabled').checked=!!settings.midi?.enabled;
  if($('controller-last-signal'))$('controller-last-signal').textContent=lastSignal;
  if($('midi-status'))$('midi-status').textContent=midiAccess?`${midiAccess.inputs.size} entrada(s) MIDI conectada(s)`:(navigator.requestMIDIAccess?'MIDI disponível, ainda não conectado':'Web MIDI não suportado neste navegador');
}
function render(){renderMappings();renderStatus()}
function reset(){settings=clone(DEFAULTS);storage.set(settings);learning=null;render();toast('Mapeamento padrão restaurado')}
async function enableMidi(){
  if(!navigator.requestMIDIAccess){toast('Web MIDI não está disponível neste navegador');return}
  try{
    midiAccess=await navigator.requestMIDIAccess({sysex:false});
    settings.midi.enabled=true;storage.set(settings);
    const bind=()=>midiAccess.inputs.forEach(input=>input.onmidimessage=onMidiMessage);
    bind();midiAccess.onstatechange=()=>{bind();renderStatus()};renderStatus();toast('MIDI conectado');
  }catch(error){settings.midi.enabled=false;storage.set(settings);renderStatus();toast('Permissão MIDI não concedida')}
}
function onMidiMessage(event){
  if(!settings.enabled||!settings.midi?.enabled)return;
  const [status,data1,data2]=event.data;const type=status&0xF0;const channel=(status&0x0F)+1;
  if(settings.midi.channel!=='all'&&Number(settings.midi.channel)!==channel)return;
  if(!((type===0x90&&data2>0)||type===0xB0))return;
  const action=Object.keys(settings.midi.mappings||{}).find(a=>Number(settings.midi.mappings[a])===Number(data1));
  if(action)execute(action,`MIDI ${data1}`);
  else{lastSignal=`MIDI ${data1} recebido sem ação`;renderStatus()}
}
function bindDialog(){
  const dialog=$('external-controls-dialog');
  $('external-controls-open')?.addEventListener('click',()=>{render();dialog?.showModal()});
  $('controller-enabled')?.addEventListener('change',e=>{settings.enabled=e.target.checked;storage.set(settings);renderStatus()});
  $('controller-prevent')?.addEventListener('change',e=>{settings.preventDefault=e.target.checked;storage.set(settings)});
  $('midi-enabled')?.addEventListener('change',e=>{if(e.target.checked)enableMidi();else{settings.midi.enabled=false;storage.set(settings);renderStatus()}});
  $('controller-reset')?.addEventListener('click',reset);
  $('controller-test-next')?.addEventListener('click',()=>execute('nextSection','teste'));
  $('control-mapping-list')?.addEventListener('click',e=>{const b=e.target.closest('[data-learn-action]');if(!b)return;learning=b.dataset.learnAction;renderMappings();toast('Pressione a tecla ou botão do pedal')});
  dialog?.addEventListener('close',()=>{learning=null;renderMappings()});
}
document.addEventListener('DOMContentLoaded',()=>{if(!document.body.matches('[data-page="modo-live"]'))return;bindDialog();render();document.addEventListener('keydown',onKeydown,{capture:true});if(settings.midi?.enabled)enableMidi()});
window.StageMusicExternalControls={execute,getSettings:()=>clone(settings),reset};
})();
