(function(){
  'use strict';
  const NOTES_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NOTES_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const CHORD_RE=/^([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add|M)?(\d*)?(?:[#b]\d+)?(?:\/([A-G](?:#|b)?))?$/;
  const SECTION_RE=/^\s*\[([^\]]+)\]\s*$/;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const noteIndex=n=>{let i=NOTES_SHARP.indexOf(n);if(i<0)i=NOTES_FLAT.indexOf(n);return i};
  const normalizeRoot=n=>{const i=noteIndex(n);return i<0?n:NOTES_SHARP[i]};
  const tokenize=line=>line.trim().split(/\s+/).map(x=>x.replace(/[|:()]/g,'')).filter(Boolean);
  const isChordToken=t=>CHORD_RE.test(t);
  const isChordLine=line=>{const t=tokenize(line);return t.length>0&&t.filter(isChordToken).length/Math.max(1,t.length)>=.6};
  const extractSections=text=>text.split(/\r?\n/).map((line,index)=>{const m=line.match(SECTION_RE);return m?{name:m[1].trim(),line:index}:null}).filter(Boolean);
  const extractChords=text=>text.split(/\r?\n/).flatMap(line=>isChordLine(line)?tokenize(line).filter(isChordToken):[]);
  const baseChord=chord=>{const m=String(chord).match(CHORD_RE);if(!m)return chord;const root=m[1],quality=m[2]||'',num=m[3]||'',bass=m[4];let simplified=root;if(/m|min/.test(quality)&&!/^maj/.test(quality))simplified+='m';if(bass)simplified+='/'+bass;return simplified};
  const simplifyText=text=>text.split(/\r?\n/).map(line=>isChordLine(line)?tokenize(line).map(baseChord).join('  '):line).join('\n');
  const transposeRoot=(root,steps,mode='sharp')=>{const i=noteIndex(root);if(i<0)return root;return (mode==='flat'?NOTES_FLAT:NOTES_SHARP)[(i+steps+120)%12]};
  const transposeChord=(chord,steps,mode='sharp')=>{const m=String(chord).match(CHORD_RE);if(!m)return chord;const [,root,quality='',num='',bass='']=m;return transposeRoot(root,steps,mode)+quality+num+(bass?'/'+transposeRoot(bass,steps,mode):'')};
  const transposeText=(text,steps,mode='sharp')=>text.split(/\r?\n/).map(line=>isChordLine(line)?tokenize(line).map(c=>transposeChord(c,steps,mode)).join('  '):line).join('\n');
  const inferKey=text=>{const chords=extractChords(text).map(c=>(c.match(/^([A-G](?:#|b)?)/)||[])[1]).filter(Boolean);if(!chords.length)return null;const score={};chords.forEach((root,i)=>{const n=normalizeRoot(root);score[n]=(score[n]||0)+1+(i===0?.8:0)});return Object.entries(score).sort((a,b)=>b[1]-a[1])[0]?.[0]||null};
  const estimateDuration=(text,bpm=72)=>{const sections=extractSections(text);const nonEmpty=text.split(/\r?\n/).filter(x=>x.trim()).length;const chordLines=text.split(/\r?\n/).filter(isChordLine).length;const lyricLines=Math.max(0,nonEmpty-sections.length-chordLines);const beats=Math.max(16,chordLines*8+lyricLines*8+sections.length*4);const minutes=beats/Math.max(40,Number(bpm)||72);return Math.max(1.5,Math.min(12,Math.round(minutes*10)/10))};
  const suggestCapo=(targetKey,preferredShapes=['C','G','D','A','E'])=>{const target=noteIndex(targetKey);if(target<0)return[];return preferredShapes.map(shape=>{const base=noteIndex(shape);return{shape,capo:(target-base+12)%12}}).filter(x=>x.capo<=7).sort((a,b)=>a.capo-b.capo)};
  const complexity=(chords)=>{let score=0;chords.forEach(c=>{if(/maj|min|dim|aug|sus|add|7|9|11|13|#|b|\//.test(c.replace(/^([A-G](?:#|b)?)/,'')))score+=1;if(/\//.test(c))score+=.5});return Math.round(score*10)/10};
  const structureWarnings=(text)=>{const sections=extractSections(text).map(s=>s.name.toLowerCase());const warnings=[];if(!sections.length)warnings.push('A cifra não possui seções identificadas.');if(!sections.some(x=>x.includes('refr')))warnings.push('Nenhum refrão identificado.');if(!sections.some(x=>x.includes('intro')))warnings.push('Considere marcar uma introdução.');if(!sections.some(x=>x.includes('final')||x.includes('outro')))warnings.push('Considere indicar o final da música.');if(text.trim().length<40)warnings.push('O conteúdo parece curto ou incompleto.');return warnings};
  const analyzeSong=({content='',key='',bpm=72})=>{const sections=extractSections(content);const chords=extractChords(content);const unique=[...new Set(chords)];const detectedKey=inferKey(content);const duration=estimateDuration(content,bpm);const capo=suggestCapo(key||detectedKey||'C');const warnings=structureWarnings(content);return{sections,chords,unique,detectedKey,duration,capo,complexity:complexity(unique),warnings};};
  const analyzeSetlist=(list)=>{const songs=Array.isArray(list?.songs)?list.songs:[];const suggestions=[];if(!songs.length)return{score:0,suggestions:['Adicione músicas para receber sugestões.'],duration:0,ready:0};const duration=songs.reduce((n,s)=>n+(Number(s.duration)||4),0);const ready=songs.filter(s=>s.rehearsed).length;const keys=songs.map(s=>normalizeRoot(s.key||'C'));for(let i=1;i<keys.length;i++){const a=noteIndex(keys[i-1]),b=noteIndex(keys[i]);if(a>=0&&b>=0){const d=Math.min((b-a+12)%12,(a-b+12)%12);if(d>=5)suggestions.push(`Transição forte entre ${songs[i-1].title} (${keys[i-1]}) e ${songs[i].title} (${keys[i]}). Considere revisar a ordem.`)}}if(ready<songs.length)suggestions.push(`${songs.length-ready} música(s) ainda não estão marcadas como prontas.`);if(duration>70)suggestions.push('O repertório ultrapassa 70 minutos. Avalie pausas ou cortes.');if(duration<15)suggestions.push('O repertório está curto para a maioria dos eventos.');const score=Math.max(0,Math.min(100,Math.round((ready/songs.length)*55+(Math.min(duration,60)/60)*25+(Math.max(0,5-suggestions.length)/5)*20)));if(!suggestions.length)suggestions.push('A ordem está equilibrada e todas as músicas estão prontas.');return{score,suggestions,duration,ready};};

  function renderSongAnalysis(result){
    const box=document.getElementById('smart-analysis-results');if(!box)return;
    box.innerHTML=`<div class="smart-summary-grid"><article><span>Tom provável</span><strong>${esc(result.detectedKey||'Não detectado')}</strong></article><article><span>Duração estimada</span><strong>${esc(result.duration)} min</strong></article><article><span>Acordes únicos</span><strong>${result.unique.length}</strong></article><article><span>Complexidade</span><strong>${result.complexity<=2?'Baixa':result.complexity<=5?'Média':'Alta'}</strong></article></div><div class="smart-detail-grid"><section><h4>Estrutura reconhecida</h4><div class="smart-chips">${result.sections.length?result.sections.map(s=>`<span>${esc(s.name)}</span>`).join(''):'<span>Sem seções</span>'}</div></section><section><h4>Sugestões de capo</h4><div class="smart-chips">${result.capo.length?result.capo.slice(0,4).map(x=>`<span>Forma ${x.shape}: capo ${x.capo}</span>`).join(''):'<span>Sem sugestão</span>'}</div></section><section class="smart-wide"><h4>Alertas e melhorias</h4><ul>${result.warnings.length?result.warnings.map(w=>`<li>${esc(w)}</li>`).join(''):'<li>Estrutura consistente para uso ao vivo.</li>'}</ul></section></div>`;
  }
  function initEditor(){
    const content=document.getElementById('song-content');if(!content)return;
    const key=document.getElementById('song-key'),bpm=document.getElementById('song-bpm'),capo=document.getElementById('song-capo');
    const analyze=()=>{const result=analyzeSong({content:content.value,key:key?.value,bpm:bpm?.value});renderSongAnalysis(result);return result};
    document.getElementById('smart-analyze')?.addEventListener('click',analyze);
    document.getElementById('smart-simplify')?.addEventListener('click',()=>{if(!content.value.trim())return;content.value=simplifyText(content.value);content.dispatchEvent(new Event('input',{bubbles:true}));analyze()});
    document.getElementById('smart-estimate')?.addEventListener('click',()=>{const r=analyze();const target=document.getElementById('smart-duration-value');if(target)target.textContent=`${r.duration} min`});
    document.getElementById('smart-apply-capo')?.addEventListener('click',()=>{const r=analyze();const suggestion=r.capo.find(x=>x.capo>0)||r.capo[0];if(!suggestion||!capo)return;capo.value=String(suggestion.capo);capo.dispatchEvent(new Event('change',{bubbles:true}));const shape=document.getElementById('smart-capo-shape');if(shape)shape.textContent=`Use formas de ${suggestion.shape}`});
    document.getElementById('smart-transpose-easy')?.addEventListener('click',()=>{const r=analyze();const easy=['C','G','D','A','E'].find(n=>r.capo.some(x=>x.shape===n&&x.capo===0))||'G';const current=noteIndex(key?.value||r.detectedKey||'C'),target=noteIndex(easy);if(current<0||target<0)return;const steps=(target-current+12)%12;const signed=steps>6?steps-12:steps;content.value=transposeText(content.value,signed);if(key)key.value=easy;content.dispatchEvent(new Event('input',{bubbles:true}));analyze()});
  }
  function getActiveSetlist(){
    const listButtons=[...document.querySelectorAll('.setlist-nav-item')];const active=listButtons.find(x=>x.classList.contains('active'));if(!active)return null;const id=active.dataset.id;try{const lists=JSON.parse(localStorage.getItem('stage_music_setlists_v1')||'[]');return Array.isArray(lists)?lists.find(x=>x.id===id)||null:null}catch{return null}
  }
  function initSetlists(){
    const btn=document.getElementById('setlist-smart-analyze');if(!btn)return;
    const render=()=>{const list=getActiveSetlist();const result=analyzeSetlist(list);const out=document.getElementById('setlist-smart-results');if(!out)return;out.innerHTML=`<div class="setlist-smart-score"><span>Prontidão do repertório</span><strong>${result.score}%</strong></div><ul>${result.suggestions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`};
    btn.addEventListener('click',render);
    document.getElementById('setlist-content')?.addEventListener('click',()=>setTimeout(render,50));
    document.getElementById('setlist-list')?.addEventListener('click',()=>setTimeout(render,50));
  }
  window.StageMusicIntelligence={analyzeSong,analyzeSetlist,simplifyText,transposeText,suggestCapo};
  document.addEventListener('DOMContentLoaded',()=>{initEditor();initSetlists()});
})();
