(function(){
'use strict';
const now=()=>new Date().toISOString();
const sanitizeRoom=(room)=>JSON.parse(JSON.stringify(room||{}));
async function readyUser(){
  if(!window.StageMusicFirebase?.configured?.())throw new Error('Firebase não configurado.');
  const user=await window.StageMusicFirebase.currentUser();
  if(!user)throw new Error('Entre com uma conta Firebase para usar a Sala Live online.');
  return user;
}
async function putRoom(room){
  const user=await readyUser(),rt=await window.StageMusicFirebase.init();
  const payload=sanitizeRoom(room);payload.ownerUid=payload.ownerUid||user.uid;payload.ownerEmail=payload.ownerEmail||user.email||'';payload.updatedAt=now();payload.firebaseUpdatedAt=rt.serverTimestamp();
  await rt.setDoc(rt.doc(rt.db,'liveRooms',payload.code),payload,{merge:true});
  return payload;
}
async function getRoom(code){
  const rt=await window.StageMusicFirebase.init();
  const snap=await rt.getDoc(rt.doc(rt.db,'liveRooms',String(code||'').toUpperCase()));
  return snap.exists()?snap.data():null;
}
function subscribe(code,onRoom,onError){
  let stop=()=>{};
  window.StageMusicFirebase.init().then(rt=>{
    stop=rt.onSnapshot(rt.doc(rt.db,'liveRooms',String(code||'').toUpperCase()),snap=>onRoom?.(snap.exists()?snap.data():null),error=>onError?.(error));
  }).catch(error=>onError?.(error));
  return()=>stop();
}
async function removeRoom(code){const user=await readyUser(),rt=await window.StageMusicFirebase.init(),ref=rt.doc(rt.db,'liveRooms',String(code||'').toUpperCase()),snap=await rt.getDoc(ref);if(!snap.exists())return;if(snap.data().ownerUid!==user.uid)throw new Error('Somente o criador pode remover esta sala.');await rt.deleteDoc(ref)}
window.StageMusicFirebaseLive={putRoom,getRoom,subscribe,removeRoom,isReady:()=>!!window.StageMusicFirebase?.configured?.()};
})();
