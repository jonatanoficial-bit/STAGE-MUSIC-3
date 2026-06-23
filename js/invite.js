(function(){
'use strict';
const PROFILE_KEY='stage_music_live_profile';
let selected={role:'vocal',instrument:'Vocal',view:'lyrics'};
const $=id=>document.getElementById(id);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const normalize=value=>window.StageMusicLiveSharing?.normalizeCode?.(value)||String(value||'').trim().toUpperCase();
const toast=message=>{const el=$('invite-toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2300)};
function choiceKey(code){return `stage_music_reader_choice_${normalize(code)}`}
function persistChoice(code,view){try{localStorage.setItem('stage_music_live_view_preference',view); if(code)localStorage.setItem(choiceKey(code),view)}catch{}}
function applyRole(button){
 document.querySelectorAll('.invite-role-card').forEach(item=>item.classList.toggle('active',item===button));
 selected={role:button.dataset.role||'vocal',instrument:button.dataset.instrument||'Vocal',view:button.dataset.view||'lyrics'};
 if($('invite-instrument'))$('invite-instrument').value=selected.instrument;
 const helper=$('invite-helper');
 if(helper)helper.textContent=selected.view==='lyrics'?'Você entrará em letra limpa para cantar.':selected.view==='director'?'Você será direcionado para criar ou controlar a Sala Live.':'Você entrará em cifra completa com acordes.';
}
function openRoom(){
 const code=normalize($('invite-room-code')?.value||''),name=String($('invite-display-name')?.value||'').trim(),instrument=$('invite-instrument')?.value||selected.instrument,view=selected.role==='diretor'?'director':(selected.view||'chords');
 if(!code&&selected.role!=='diretor')return toast('Digite ou leia o QR Code da Sala Live.');
 const profile={name:name||read(PROFILE_KEY,{}).name||'Convidado',instrument,viewMode:view,inviteRole:selected.role,updatedAt:new Date().toISOString()};
 write(PROFILE_KEY,profile);persistChoice(code,view);
 sessionStorage.setItem('stage_music_invite_profile',JSON.stringify({name:profile.name,instrument,viewMode:view,role:selected.role,code}));
 if(selected.role==='diretor'){location.href='sala-live.html?director=1';return}
 location.href=`sala-live.html?room=${encodeURIComponent(code)}&role=${encodeURIComponent(selected.role)}&instrument=${encodeURIComponent(instrument)}&view=${encodeURIComponent(view)}&auto=1`;
}
document.addEventListener('DOMContentLoaded',()=>{
 const params=new URLSearchParams(location.search),code=params.get('room')||params.get('code')||'';
 if(code&&$('invite-room-code'))$('invite-room-code').value=normalize(code);
 const stored=read(PROFILE_KEY,{});if(stored.name&&$('invite-display-name'))$('invite-display-name').value=stored.name;if(stored.instrument&&$('invite-instrument'))$('invite-instrument').value=stored.instrument;
 if(stored.viewMode==='chords'){const b=document.querySelector('[data-role="musico"]');if(b)applyRole(b)}else if(stored.viewMode==='lyrics'){const b=document.querySelector('[data-role="vocal"]');if(b)applyRole(b)}
 document.querySelectorAll('.invite-role-card').forEach(btn=>btn.addEventListener('click',()=>applyRole(btn)));
 $('invite-instrument')?.addEventListener('change',event=>{selected.instrument=event.target.value;if(/vocal|back|voz|cantor/i.test(selected.instrument)){selected.role='vocal';selected.view='lyrics'}else if(/direção|diretor/i.test(selected.instrument)){selected.role='diretor';selected.view='director'}else{selected.role=selected.role==='diretor'?'musico':selected.role;selected.view=selected.role==='vocal'?'lyrics':'chords'}});
 $('invite-room-code')?.addEventListener('input',event=>{const value=normalize(event.target.value);event.target.value=value});
 $('invite-open-room')?.addEventListener('click',openRoom);
 window.StageMusicQRScanner?.attach?.({buttonId:'invite-scan-qr',inputId:'invite-room-code',toast,label:'Aponte para o QR Code da Sala Live'});
});
})();
