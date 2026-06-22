(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StageMusicHarmonic=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const NOTES_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NOTES_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const ENHARMONIC={Cb:11,'B#':0,Fb:4,'E#':5};
  const KEY_OPTIONS={
    major:['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'],
    minor:['Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm']
  };
  const SECTION_RE=/^\s*\[([^\]]+)\]\s*$/;
  const NAMED_SECTION_RE=/^(intro|verso(?:\s*\d+)?|primeira parte|segunda parte|pré-refrão|pre-refrao|refrão|refrao|ponte|solo|tab\s*-?\s*solo|interlúdio|interludio|ministração|ministracao|espontâneo|espontaneo|final|outro)\s*:?$/i;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const cleanToken=value=>String(value??'').trim().replace(/^[|:;,]+|[|:;,]+$/g,'');
  const parseKey=value=>{
    const match=String(value??'').trim().match(/^([A-G](?:#|b)?)(m)?$/);
    return match?{root:match[1],minor:!!match[2],value:match[1]+(match[2]||'')}:null;
  };
  const noteIndex=value=>{
    const root=parseKey(value)?.root||String(value??'').trim();
    if(Object.prototype.hasOwnProperty.call(ENHARMONIC,root))return ENHARMONIC[root];
    let index=NOTES_SHARP.indexOf(root);
    if(index<0)index=NOTES_FLAT.indexOf(root);
    return index;
  };
  const notationFor=(mode,sourceRoot='',contextKey='')=>{
    if(mode==='flat'||mode==='sharp')return mode;
    if(String(sourceRoot).includes('b'))return'flat';
    if(String(sourceRoot).includes('#'))return'sharp';
    const context=parseKey(contextKey);
    if(context?.root.includes('b'))return'flat';
    if(context?.root.includes('#'))return'sharp';
    return'sharp';
  };
  const noteAt=(index,mode='sharp')=>(mode==='flat'?NOTES_FLAT:NOTES_SHARP)[(Number(index)+120)%12];
  const transposeRoot=(root,steps,mode='preserve',contextKey='')=>{
    const index=noteIndex(root);
    if(index<0)return root;
    return noteAt(index+Number(steps||0),notationFor(mode,root,contextKey));
  };
  const transposeKey=(key,steps,mode='preserve')=>{
    const parsed=parseKey(key);
    if(!parsed)return key;
    return transposeRoot(parsed.root,steps,mode,key)+(parsed.minor?'m':'');
  };
  const validSuffix=suffix=>{
    if(!suffix)return true;
    if(!/^[0-9A-Za-z#b()+\-°øΔ]*$/.test(suffix))return false;
    const residual=suffix
      .replace(/maj|min|dim|aug|sus|add|alt|omit|no/gi,'')
      .replace(/[mM]/g,'')
      .replace(/[0-9#b()+\-°øΔ]/g,'');
    return residual.length===0;
  };
  const parseChordToken=value=>{
    const raw=String(value??'');
    const token=cleanToken(raw);
    const match=token.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);
    if(!match)return null;
    const root=match[1],suffix=match[2]||'',bass=match[3]||'';
    if(!validSuffix(suffix))return null;
    return{raw,token,root,suffix,bass,minor:/^m(?!aj)/i.test(suffix)||/^min/i.test(suffix)};
  };
  const isChordToken=value=>!!parseChordToken(value);
  const tokenMatches=line=>{
    const source=String(line??'').replace(/\t/g,'    ');
    const matches=[];
    const regex=/\S+/g;
    let match;
    while((match=regex.exec(source))){
      const chord=parseChordToken(match[0]);
      if(chord)matches.push({...chord,start:match.index,end:match.index+match[0].length});
    }
    return matches;
  };
  const isChordLine=line=>{
    const clean=String(line??'').trim();
    if(!clean||SECTION_RE.test(clean)||NAMED_SECTION_RE.test(clean))return false;
    const tokens=clean.split(/\s+/).filter(Boolean);
    if(!tokens.length)return false;
    const chordCount=tokens.filter(isChordToken).length;
    return chordCount>0&&chordCount/Math.max(1,tokens.length)>=0.6;
  };
  const transposeChord=(value,steps,mode='preserve',contextKey='')=>{
    const raw=String(value??'');
    const chord=parseChordToken(raw);
    if(!chord)return raw;
    const prefix=(raw.match(/^[|:;,]+/)||[''])[0];
    const suffixDecoration=(raw.match(/[|:;,]+$/)||[''])[0];
    const rootOut=transposeRoot(chord.root,steps,mode,contextKey);
    const bassOut=chord.bass?'/'+transposeRoot(chord.bass,steps,mode,contextKey):'';
    return prefix+rootOut+chord.suffix+bassOut+suffixDecoration;
  };
  const transposeLine=(line,steps,mode='preserve',contextKey='')=>String(line??'').replace(/\S+/g,token=>transposeChord(token,steps,mode,contextKey));
  const transposeText=(text,steps,mode='preserve',contextKey='')=>String(text??'').split(/\r?\n/).map(line=>isChordLine(line)?transposeLine(line,steps,mode,contextKey):line).join('\n');
  const extractChords=text=>String(text??'').split(/\r?\n/).flatMap(line=>isChordLine(line)?tokenMatches(line).map(item=>item.token):[]);
  const detectKey=text=>{
    const chords=extractChords(text).map(parseChordToken).filter(Boolean);
    if(!chords.length)return null;
    const scores=new Map();
    chords.forEach((chord,index)=>{
      const key=chord.root+(chord.minor?'m':'');
      const score=(scores.get(key)||0)+1+(index===0?1.25:0)+(index===chords.length-1?.35:0);
      scores.set(key,score);
    });
    return [...scores.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  };
  const simplifyChord=value=>{
    const chord=parseChordToken(value);
    if(!chord)return value;
    return chord.root+(chord.minor?'m':'')+(chord.bass?'/'+chord.bass:'');
  };
  const simplifyText=text=>String(text??'').split(/\r?\n/).map(line=>isChordLine(line)?String(line).replace(/\S+/g,token=>{
    const prefix=(token.match(/^[|:;,]+/)||[''])[0];
    const ending=(token.match(/[|:;,]+$/)||[''])[0];
    return parseChordToken(token)?prefix+simplifyChord(token)+ending:token;
  }):line).join('\n');
  const sectionName=line=>{
    const clean=String(line??'').trim();
    const bracket=clean.match(SECTION_RE);
    if(bracket)return bracket[1].trim();
    if(NAMED_SECTION_RE.test(clean))return clean.replace(/:$/,'').trim();
    return null;
  };
  const buildResponsivePair=(chordLine,lyricLine)=>{
    const chords=tokenMatches(chordLine);
    if(!chords.length)return null;
    const lyric=String(lyricLine??'').replace(/\t/g,'    ');
    const pieces=[];
    const firstStart=Math.max(0,chords[0].start);
    if(firstStart>0&&lyric.slice(0,firstStart).trim()){
      const prefix=lyric.slice(0,firstStart).trim();
      pieces.push(`<span class="chord-lyric-segment lyric-prefix" style="--segment-chars:${Math.max(4,prefix.length)}"><span class="chord chord-placeholder" aria-hidden="true">&nbsp;</span><span class="lyric-text">${esc(prefix)}</span></span>`);
    }
    chords.forEach((chord,index)=>{
      const start=Math.min(chord.start,lyric.length);
      const next=index+1<chords.length?Math.min(chords[index+1].start,lyric.length):lyric.length;
      const rawLyric=lyric.slice(start,Math.max(start,next));
      const text=rawLyric.trim();
      const basis=Math.max(4,Math.min(42,Math.max(rawLyric.length,chord.token.length+1)));
      pieces.push(`<span class="chord-lyric-segment" style="--segment-chars:${basis}" data-source-start="${chord.start}"><span class="chord">${esc(chord.token)}</span><span class="lyric-text">${text?esc(text):'&nbsp;'}</span></span>`);
    });
    return `<div class="chord-lyric-row">${pieces.join('')}</div>`;
  };
  const renderResponsive=text=>{
    const lines=String(text||'Cifra não disponível.').replace(/\r/g,'').split('\n');
    const sections=[];
    const output=[];
    let sectionCounter=0;
    for(let index=0;index<lines.length;index++){
      const line=lines[index];
      const section=sectionName(line);
      if(section){
        const id=`live-section-${sectionCounter++}`;
        sections.push({name:section,id});
        output.push(`<div class="section" id="${id}">${esc(section)}</div>`);
        continue;
      }
      if(isChordLine(line)){
        const next=lines[index+1];
        const canPair=typeof next==='string'&&next.trim()&&!sectionName(next)&&!isChordLine(next);
        if(canPair){
          const pair=buildResponsivePair(line,next);
          if(pair){output.push(pair);index++;continue;}
        }
        const chordHtml=tokenMatches(line).map(item=>`<span class="chord chord-token">${esc(item.token)}</span>`).join('');
        output.push(`<div class="chord-only-row">${chordHtml||esc(line)}</div>`);
        continue;
      }
      if(!line.trim()){output.push('<div class="live-spacer" aria-hidden="true"></div>');continue;}
      output.push(`<div class="lyric-only-row">${esc(line.trim())}</div>`);
    }
    return{html:output.join(''),sections};
  };
  const keyOptions=()=>({major:[...KEY_OPTIONS.major],minor:[...KEY_OPTIONS.minor]});

  return{
    NOTES_SHARP,NOTES_FLAT,KEY_OPTIONS,esc,parseKey,noteIndex,notationFor,noteAt,
    transposeRoot,transposeKey,parseChordToken,isChordToken,tokenMatches,isChordLine,
    transposeChord,transposeText,extractChords,detectKey,simplifyChord,simplifyText,
    sectionName,buildResponsivePair,renderResponsive,keyOptions
  };
});
