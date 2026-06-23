(function(){
  'use strict';
  function normalize(value){
    const text=String(value||'').trim();
    try{
      const url=new URL(text,location.href);
      const code=url.searchParams.get('room')||url.searchParams.get('code')||text;
      return (window.StageMusicLiveSharing?.normalizeCode?.(code)||code).toUpperCase();
    }catch{
      return (window.StageMusicLiveSharing?.normalizeCode?.(text)||text).toUpperCase();
    }
  }
  function makePanel(label){
    let panel=document.getElementById('qr-scanner-panel');
    if(panel)return panel;
    panel=document.createElement('section');
    panel.id='qr-scanner-panel';
    panel.className='qr-scanner-panel';
    panel.hidden=true;
    panel.innerHTML=`<div class="qr-scanner-card"><header><div><strong>${label||'Ler QR da Sala Live'}</strong></div><button type="button" id="qr-scanner-close" aria-label="Fechar leitor">×</button></header><video id="qr-scanner-video" playsinline muted></video><p id="qr-scanner-status">Abrindo câmera...</p><button type="button" id="qr-scanner-fallback" class="btn btn-outline">Digitar código</button></div>`;
    document.body.appendChild(panel);
    return panel;
  }
  async function scan({inputId,buttonId,toast,label}={}){
    const input=document.getElementById(inputId),button=document.getElementById(buttonId);
    if(!input||!button||button.dataset.qrBound==='1')return;
    button.dataset.qrBound='1';
    const notify=toast||((msg)=>window.StageMusicToast?.(msg)||console.log(msg));
    let stream=null,timer=null,detector=null,busy=false;
    const stop=()=>{busy=false;clearInterval(timer);timer=null;try{stream?.getTracks?.().forEach(t=>t.stop())}catch{};stream=null;const panel=document.getElementById('qr-scanner-panel');if(panel)panel.hidden=true};
    const fill=(raw)=>{const code=normalize(raw);input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));stop();notify('QR lido.');if(buttonId==='invite-scan-qr')document.getElementById('invite-open-room')?.focus();else document.getElementById('join-room-btn')?.focus()};
    const open=async()=>{
      if(busy)return;busy=true;
      const panel=makePanel(label),video=document.getElementById('qr-scanner-video'),status=document.getElementById('qr-scanner-status');
      panel.hidden=false;status.textContent='Abrindo câmera...';
      document.getElementById('qr-scanner-close').onclick=stop;
      document.getElementById('qr-scanner-fallback').onclick=()=>{stop();input.focus();notify('Digite o código da sala.')};
      if(location.protocol!=='https:' && location.hostname!=='localhost'){
        status.textContent='A câmera só abre em site HTTPS. Use a página publicada ou digite o código.';busy=false;return;
      }
      if(!navigator.mediaDevices?.getUserMedia){status.textContent='Câmera não liberada neste navegador. Digite o código.';busy=false;return}
      if(!('BarcodeDetector' in window)){
        status.textContent='Este navegador não possui leitor QR interno. Use a câmera normal do celular para abrir o convite ou digite o código.';busy=false;return;
      }
      try{
        detector=new BarcodeDetector({formats:['qr_code']});
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
        video.srcObject=stream;await video.play();status.textContent='Aponte para o QR Code.';
        timer=setInterval(async()=>{
          if(!detector||!video.videoWidth)return;
          try{const codes=await detector.detect(video);const raw=codes?.[0]?.rawValue||'';if(raw)fill(raw)}
          catch(error){console.warn('QR scan:',error?.message||error)}
        },320);
      }catch(error){status.textContent='Não foi possível abrir a câmera. Autorize a câmera ou digite o código.';busy=false;console.warn('Câmera QR:',error?.message||error)}
    };
    button.addEventListener('click',open);
  }
  function attach(config){
    const run=()=>scan(config);
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
    else run();
  }
  window.StageMusicQRScanner={attach,normalize};
})();
