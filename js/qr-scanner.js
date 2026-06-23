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
    panel.innerHTML=`<div class="qr-scanner-card"><header><div><span class="eyebrow">LEITOR DE QR CODE</span><strong>${label||'Aponte para o QR da Sala Live'}</strong></div><button type="button" id="qr-scanner-close" aria-label="Fechar leitor">×</button></header><video id="qr-scanner-video" playsinline muted></video><p id="qr-scanner-status">Preparando câmera...</p><button type="button" id="qr-scanner-fallback" class="btn btn-outline">Minha câmera já abriu o link / vou digitar o código</button></div>`;
    document.body.appendChild(panel);
    return panel;
  }
  async function scan({inputId,buttonId,toast,label}={}){
    const input=document.getElementById(inputId),button=document.getElementById(buttonId);
    if(!input||!button)return;
    const notify=toast||((msg)=>window.StageMusicToast?.(msg)||console.log(msg));
    let stream=null,timer=null,detector=null;
    const stop=()=>{clearInterval(timer);timer=null;try{stream?.getTracks?.().forEach(t=>t.stop())}catch{};stream=null;const panel=document.getElementById('qr-scanner-panel');if(panel)panel.hidden=true};
    const open=async()=>{
      const panel=makePanel(label),video=document.getElementById('qr-scanner-video'),status=document.getElementById('qr-scanner-status');
      panel.hidden=false;status.textContent='Solicitando câmera...';
      document.getElementById('qr-scanner-close').onclick=stop;
      document.getElementById('qr-scanner-fallback').onclick=()=>{stop();input.focus();notify('Digite o código ou use a câmera do celular para abrir o link do QR.')};
      if(!('mediaDevices' in navigator)||!navigator.mediaDevices.getUserMedia){status.textContent='Este navegador não liberou câmera aqui. Digite o código ou use a câmera normal do celular.';return}
      if(!('BarcodeDetector' in window)){status.textContent='Leitor nativo indisponível neste navegador. Use a câmera normal do celular ou digite o código.';return}
      try{
        detector=new BarcodeDetector({formats:['qr_code']});
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
        video.srcObject=stream;await video.play();status.textContent='Aponte para o QR Code da Sala Live.';
        timer=setInterval(async()=>{
          if(!detector||!video.videoWidth)return;
          try{
            const codes=await detector.detect(video);
            const raw=codes?.[0]?.rawValue||'';
            if(raw){const code=normalize(raw);input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));stop();notify('QR lido. Código preenchido.');}
          }catch(error){console.warn('QR scan:',error?.message||error)}
        },420);
      }catch(error){status.textContent='Não foi possível abrir a câmera. Autorize a câmera ou digite o código.';console.warn('Câmera QR:',error?.message||error)}
    };
    button.addEventListener('click',open);
  }
  function attach(config){document.addEventListener('DOMContentLoaded',()=>scan(config));}
  window.StageMusicQRScanner={attach,normalize};
})();
