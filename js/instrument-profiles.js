(function(){'use strict';
const KEY='stage_music_instrument_profiles_v1',ACTIVE='stage_music_active_instrument';
const profiles={
 director:{name:'Direção musical',icon:'🎼',help:'Orientações gerais, dinâmica, entradas e decisões do arranjo.',quick:['Banda entra','Baixar dinâmica','Repetir refrão','Final seco']},
 vocal:{name:'Vocal',icon:'🎤',help:'Letra, entradas, divisão de vozes, respirações e tonalidade.',quick:['Voz principal','Backing vocal','Uníssono','Segunda voz']},
 keyboard:{name:'Teclado',icon:'🎹',help:'Timbres, camadas, transposição, patches e introduções.',quick:['Piano','Pad','Órgão','Piano + strings']},
 guitar:{name:'Guitarra',icon:'🎸',help:'Riffs, pedais, presets, afinação e posições.',quick:['Clean','Drive','Delay','Solo']},
 acoustic:{name:'Violão',icon:'🪕',help:'Capotraste, levada, dedilhado e dinâmica.',quick:['Dedilhado','Levada aberta','Palm mute','Capo']},
 bass:{name:'Baixo',icon:'🎸',help:'Linhas, entradas, notas de passagem e afinação.',quick:['Tônica','Linha marcada','Oitavas','Parar no final']},
 drums:{name:'Bateria',icon:'🥁',help:'Levada, clique, viradas, compassos e convenções.',quick:['Click','Meia dinâmica','Virada','Final junto']},
 winds:{name:'Sopros',icon:'🎷',help:'Frases, ataques, articulações e divisões de naipe.',quick:['Ataque curto','Sustain','Uníssono','Resposta']}
};
const $=id=>document.getElementById(id);let active='director',currentSong=null;
const store={get(k,f){try{return window.StageMusicSafeStorage?.get(k,f)??JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}},set(k,v){try{return window.StageMusicSafeStorage?.set(k,v)??(localStorage.setItem(k,JSON.stringify(v)),true)}catch{return false}}};
function all(){const x=store.get(KEY,{});return x&&typeof x==='object'?x:{}}
function songKey(){return String(currentSong?.songId||currentSong?.id||currentSong?.title||'unknown')}
function record(){return all()[songKey()]?.[active]||{note:'',visible:true}}
function save(){if(!currentSong)return;const data=all(),key=songKey();data[key]=data[key]||{};data[key][active]={note:$('instrument-note').value.trim(),visible:$('instrument-note-visible').checked,updatedAt:new Date().toISOString()};store.set(KEY,data);store.set(ACTIVE,active);renderBanner();window.dispatchEvent(new CustomEvent('stage:instrument-profile-changed',{detail:{profile:active}}));window.StageMusicToast?.('Nota do instrumento salva');$('instrument-profile-dialog').close()}
function select(id){if(!profiles[id])return;active=id;store.set(ACTIVE,active);document.querySelectorAll('[data-instrument]').forEach(b=>b.classList.toggle('active',b.dataset.instrument===active));const p=profiles[active],r=record();$('instrument-icon').textContent=p.icon;$('instrument-name').textContent=p.name;$('instrument-help').textContent=p.help;$('instrument-note').value=r.note||'';$('instrument-note-visible').checked=r.visible!==false;$('instrument-quick').innerHTML='';p.quick.forEach(q=>{const b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=()=>{$('instrument-note').value=($('instrument-note').value.trim()+' '+q).trim()};$('instrument-quick').appendChild(b)});renderBanner()}
function renderGrid(){const g=$('instrument-grid');g.innerHTML='';Object.entries(profiles).forEach(([id,p])=>{const b=document.createElement('button');b.type='button';b.dataset.instrument=id;b.innerHTML=`<span>${p.icon}</span><strong>${p.name}</strong>`;b.onclick=()=>select(id);g.appendChild(b)})}
function renderBanner(){const b=$('instrument-note-banner');if(!b||!currentSong)return;const p=profiles[active],r=record();const show=!!r.note&&r.visible!==false;b.hidden=!show;$('instrument-note-icon').textContent=p.icon;$('instrument-note-profile').textContent=p.name.toUpperCase();$('instrument-note-text').textContent=r.note||''}
function syncSong(e){currentSong=e?.detail?.song||window.StageMusicLiveCurrentSong||null;renderBanner()}
document.addEventListener('DOMContentLoaded',()=>{if(!document.body.matches('[data-page="modo-live"]'))return;active=store.get(ACTIVE,'director');if(!profiles[active])active='director';renderGrid();$('instrument-profile-open').onclick=()=>{currentSong=window.StageMusicLiveCurrentSong||currentSong;select(active);$('instrument-profile-dialog').showModal()};$('instrument-save').onclick=save;window.addEventListener('stage:live-song-changed',syncSong);setTimeout(()=>{currentSong=window.StageMusicLiveCurrentSong||currentSong;select(active)},100)});
window.StageMusicInstrumentProfiles={profiles,getActive:()=>active,refresh:renderBanner};})();