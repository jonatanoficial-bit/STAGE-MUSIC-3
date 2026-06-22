/*
  Configuração Web do Firebase para o projeto Stage Music.
  A segurança dos dados é controlada pelo Firebase Authentication e pelas regras do Firestore.
*/
window.STAGE_MUSIC_FIREBASE = {
  apiKey: "AIzaSyCrY_jawl40C_ZFpTUSFRgKJmUKzbKhZ4k",
  authDomain: "stage-music-96cc1.firebaseapp.com",
  projectId: "stage-music-96cc1",
  storageBucket: "stage-music-96cc1.firebasestorage.app",
  messagingSenderId: "1009564099611",
  appId: "1:1009564099611:web:cfbf51573da0751a0d44be",
  measurementId: "G-JL6SPQTL8J"
};

window.STAGE_MUSIC_AUTH_SETTINGS = {
  googleEnabled: true,
  allowLocalMode: true,
  persistLogin: true,
  firestoreOffline: true,
  liveRoomsOnline: true
};
