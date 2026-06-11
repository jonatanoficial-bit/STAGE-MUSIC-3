const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const expected={
 'js/firebase-config.js':'8effda68d3949e31c3d963b333ba6710b2414b9973eb3ae1d9ec5d3c75e7ec87',
 'js/firebase-runtime.js':'eaa2b85df2f966a839eb2ca2258e63a031986f3cb7bf2d9a1803432a5cbd22ab',
 'js/firebase-live.js':'afc98a0bfc9b68e86b933763810fd9a9d3ee6d775f236c8f5da0920330727f4e',
 'js/cloud-sync.js':'651cc682699f4d8eaee3b31f76eab7e8f4d4a61a93907138532bff6e295e89ce',
 'firestore.rules':'51be3257872085af71cd04473eb2f6cc4da3888ab8dfe4acb141aba8c470c6dc'
};
let failed=false;
for(const [file,hash] of Object.entries(expected)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 if(actual!==hash){console.error(`FIREBASE ALTERADO: ${file}\n esperado ${hash}\n atual    ${actual}`);failed=true}
}
if(failed)process.exit(1);
console.log('FIREBASE INTEGRITY: APROVADA — arquivos preservados byte a byte');
