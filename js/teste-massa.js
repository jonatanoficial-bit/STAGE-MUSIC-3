(function(){
  const KEY='stage_music_mass_test_v1';
  const $=id=>document.getElementById(id);
  const checks=()=>Array.from(document.querySelectorAll('[data-test]'));
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
  function write(data){localStorage.setItem(KEY,JSON.stringify(data))}
  function report(data){
    const total=checks().length;
    const done=checks().filter(x=>x.checked).length;
    const missing=checks().filter(x=>!x.checked).map(x=>x.closest('.test-item')?.querySelector('strong')?.textContent||x.dataset.test);
    return `Stage Music — relatório de teste em grupo\nVersão: ${window.StageMusicBuild?.version||'não identificada'}\nData: ${new Date().toLocaleString('pt-BR')}\nProgresso: ${done}/${total} (${Math.round((done/Math.max(total,1))*100)}%)\nStatus: ${done===total?'Aprovado no roteiro':'Ainda em teste'}\n\nPendências:\n${missing.length?missing.map(x=>'• '+x).join('\n'):'• Nenhuma pendência marcada'}\n\nObservações da equipe:\n- Modelo do celular/tablet:\n- Internet usada:\n- O que funcionou bem:\n- O que ficou confuso:\n- Problema encontrado:`;
  }
  function render(){
    const total=checks().length,done=checks().filter(x=>x.checked).length,percent=Math.round((done/Math.max(total,1))*100);
    if($('test-total'))$('test-total').textContent=total;
    if($('test-done'))$('test-done').textContent=done;
    if($('test-percent'))$('test-percent').textContent=percent+'%';
    if($('test-status'))$('test-status').textContent=done===total?'Aprovado':done?'Em teste':'Iniciar';
    if($('test-report'))$('test-report').textContent=report(read());
  }
  function init(){
    const data=read();
    checks().forEach(input=>{input.checked=!!data[input.dataset.test];input.addEventListener('change',()=>{const next=read();next[input.dataset.test]=input.checked;next.updatedAt=new Date().toISOString();write(next);render();});});
    $('copy-test-report')?.addEventListener('click',async()=>{const text=report(read());try{await navigator.clipboard.writeText(text);$('copy-test-report').textContent='Relatório copiado';setTimeout(()=>$('copy-test-report').textContent='Copiar relatório',1600)}catch{alert(text)}});
    $('reset-test')?.addEventListener('click',()=>{if(confirm('Limpar o checklist deste aparelho?')){localStorage.removeItem(KEY);checks().forEach(x=>x.checked=false);render();}});
    render();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
