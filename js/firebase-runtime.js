(function(){
'use strict';
let runtimePromise=null;
const configured=()=>{const c=window.STAGE_MUSIC_FIREBASE||{};return !!(c.apiKey&&c.authDomain&&c.projectId&&c.appId)};
async function init(){
  if(runtimePromise)return runtimePromise;
  if(!configured())throw new Error('Firebase não configurado em js/firebase-config.js.');
  runtimePromise=(async()=>{
    const [{initializeApp,getApps},{getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged},{getFirestore,enableIndexedDbPersistence,collection,doc,getDoc,getDocs,setDoc,deleteDoc,onSnapshot,serverTimestamp,query,where,limit}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
    ]);
    const app=getApps()[0]||initializeApp(window.STAGE_MUSIC_FIREBASE);
    const auth=getAuth(app);
    try{await setPersistence(auth,browserLocalPersistence)}catch(error){console.warn('Persistência do Firebase Auth não ativada:',error?.message||error)}
    const db=getFirestore(app);
    try{await enableIndexedDbPersistence(db)}catch(error){if(!['failed-precondition','unimplemented'].includes(error?.code))console.warn('Persistência offline do Firestore:',error?.message||error)}
    return{app,auth,db,collection,doc,getDoc,getDocs,setDoc,deleteDoc,onSnapshot,serverTimestamp,query,where,limit,onAuthStateChanged};
  })();
  return runtimePromise;
}
async function currentUser(){const rt=await init();if(rt.auth.currentUser)return rt.auth.currentUser;return new Promise(resolve=>{const stop=rt.onAuthStateChanged(rt.auth,user=>{stop();resolve(user||null)})})}
window.StageMusicFirebase={configured,init,currentUser};
})();
