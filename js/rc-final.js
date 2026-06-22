(function(){
 const KEY='stage_music_rc_final_checks_v1';
 const checks=()=>Array.from(document.querySelectorAll('[data-rc-check]'));
 function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
 function save(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
 function update(){const boxes=checks();const done=boxes.filter(b=>b.checked).length;const score=document.querySelector('[data-rc-score]');const guide=document.querySelector('[data-rc-guidance]');if(score)score.textContent=`${done}/${boxes.length} itens validados`;if(guide){guide.textContent=done===boxes.length?'Homologação local concluída. Copie o relatório e envie o feedback da equipe.':'Marque os itens durante o ensaio ou teste em grupo.'}}
 function report(){const info=window.STAGE_MUSIC_BUILD||{};const lines=[`Stage Music ${info.version||''} — Fase ${info.phase||''}`,`Homologação final — ${new Date().toLocaleString('pt-BR')}`,''];checks().forEach(b=>lines.push(`${b.checked?'[OK]':'[  ]'} ${b.dataset.rcCheck}`));return lines.join('
')}
 document.addEventListener('DOMContentLoaded',()=>{const data=load();checks().forEach(b=>{b.checked=!!data[b.dataset.rcCheck];b.addEventListener('change',()=>{const next=load();next[b.dataset.rcCheck]=b.checked;save(next);update()})});update();document.querySelector('[data-copy-final-report]')?.addEventListener('click',async()=>{const text=report();try{await navigator.clipboard.writeText(text);alert('Relatório final copiado.')}catch{prompt('Copie o relatório final:',text)}})});
})();
