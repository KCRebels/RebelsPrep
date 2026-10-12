/* Build 331: Ask the Librarian with softball-intent weighting, typo handling, and relevant drill ranking. */
import {drills} from './drills.mjs?v=rp277';
const app=document.getElementById('app');
let queued=false,lastQuery='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function normalize(s){return String(s||'').toLowerCase().replace(/[’']/g,'').replace(/change[- ]?ups?|changups?|change ups?/g,'changeup').replace(/off[- ]?speed/g,'offspeed').replace(/popping|popped|pops/g,'pop').replace(/pulling|pulled/g,'pull').replace(/dropping|dropped/g,'drop').replace(/lunging|lunged/g,'lunge').replace(/drifting|drifted/g,'drift').replace(/early|ahead/g,'early').replace(/late|behind/g,'late').replace(/[^a-z0-9]+/g,' ').trim();}
const stop=new Set(['i','im','ive','me','my','the','a','an','and','or','to','of','is','are','am','it','that','this','keep','keeps','when','what','with','on','at','for','player','hitter','hitting','swing','hit','cant','cannot','can','dont','do','doesnt','having','have','has','trouble','struggle','struggling']);
function terms(q){return normalize(q).split(/\s+/).filter(t=>t&&t.length>1&&!stop.has(t));}
function haystack(d){return normalize([d.name,d.category,d.primaryPurpose,d.secondaryFocus,d.howItWorks,d.coachingCues,d.success,d.bestUsedFor,d.equipment,d.notes].filter(Boolean).join(' '));}
const intents=[
 {test:/\b(changeup|offspeed|slow pitch|speed change)\b/,terms:['changeup','offspeed','timing','wait','early commitment','stay loaded','let the ball travel'],boostNames:['Front Toss / 1 Tee Change','Pitch Behind']},
 {test:/\b(pop|under the ball|fly ball)\b/,terms:['pop','under the ball','barrel','hands drop'],boostNames:['Ball on Shoulder','2Tee - Front/Back']},
 {test:/\b(outside|away)\b/,terms:['outside','away','opposite field','plate coverage'],boostNames:['2Tee - Inside/Outside','Plate Recognition']},
 {test:/\b(inside|jammed|pull hands)\b/,terms:['inside','quick hands','inside pitch'],boostNames:['2Tee - Inside/Outside']},
 {test:/\b(lunge|drift|front foot|too early|early)\b/,terms:['lunge','drift','front foot','early commitment','balance'],boostNames:['Pitch Behind','Skater Drill']},
 {test:/\b(late|behind|slow bat)\b/,terms:['late','timing','quick','decision'],boostNames:['Speed Side Toss']}
];
function searchDrills(q){
 const nq=normalize(q),base=terms(q),matched=intents.filter(x=>x.test.test(nq));
 const expanded=[...new Set([...base,...matched.flatMap(x=>x.terms)])];
 if(!expanded.length)return[];
 return drills.map(d=>{
  const h=haystack(d),name=normalize(d.name),best=normalize(d.bestUsedFor),purpose=normalize(d.primaryPurpose),secondary=normalize(d.secondaryFocus),cues=normalize(d.coachingCues);
  let score=0;
  for(const t of expanded){
   if(h.includes(t))score+=1;
   if(name.includes(t))score+=4;
   if(best.includes(t))score+=5;
   if(purpose.includes(t))score+=3;
   if(secondary.includes(t))score+=3;
   if(cues.includes(t))score+=2;
  }
  for(const intent of matched){
   const exact=intent.boostNames.indexOf(d.name);
   if(exact===0)score+=30;
   else if(exact>0)score+=20;
  }
  return{d,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.d.name).localeCompare(String(b.d.name))).slice(0,6).map(x=>x.d);
}
function renameCards(){app?.querySelectorAll('.coach-card h2').forEach(h=>{if(/^Ask the Library$/i.test(h.textContent.trim()))setText(h,'Ask the Librarian');});}
function detailHtml(d){return '<section class="coach-librarian-detail"><h3>'+esc(d.name)+'</h3>'+(d.primaryPurpose?'<p><b>Purpose:</b> '+esc(d.primaryPurpose)+'</p>':'')+(d.bestUsedFor?'<p><b>Best used for:</b> '+esc(d.bestUsedFor)+'</p>':'')+(d.howItWorks?'<p><b>How it works:</b> '+esc(d.howItWorks)+'</p>':'')+(d.coachingCues?'<p><b>Coaching cues:</b> '+esc(d.coachingCues)+'</p>':'')+(d.success?'<p><b>What good looks like:</b> '+esc(d.success)+'</p>':'')+(d.equipment?'<p><b>Equipment:</b> '+esc(d.equipment)+'</p>':'')+'<button type="button" class="coach-librarian-detail-back">← Back to Results</button></section>';}
function renderResults(page,q){const host=page.querySelector('.coach-librarian-results')||document.createElement('div');host.className='coach-librarian-results';host.innerHTML='';const found=searchDrills(q);if(!q.trim()){host.remove();return;}if(!found.length){host.innerHTML='<div class="coach-librarian-empty">I could not find a strong match for that yet. Try describing the pitch or problem another way.</div>';}else{host.innerHTML='<p class="coach-librarian-results-title">Recommended Drills</p>'+found.map((d,i)=>'<button type="button" class="coach-librarian-result" data-lib-index="'+i+'"><small>'+esc(d.category||'Hitting')+'</small><strong>'+esc(d.name)+'</strong><span>'+esc(d.bestUsedFor||d.primaryPurpose||d.coachingCues||'Open drill details.')+'</span></button>').join('');host.querySelectorAll('[data-lib-index]').forEach(btn=>btn.addEventListener('click',()=>{const d=found[Number(btn.dataset.libIndex)];host.innerHTML=detailHtml(d);host.querySelector('.coach-librarian-detail-back')?.addEventListener('click',()=>renderResults(page,lastQuery));}));}
 if(!host.isConnected)page.appendChild(host);
}
function patchAsk(){if(!app)return;renameCards();const head=app.querySelector('.coach-page-head');const title=head?.querySelector('h1');if(!head||!title||!/^Ask the (Library|Librarian)$/i.test(title.textContent.trim()))return;const page=head.closest('.coach-portal-page');if(!page)return;page.classList.add('coach-librarian-page');setText(title,'Ask the Librarian');const back=head.querySelector('.coach-back');if(back)setText(back,'← Back');const copy=head.querySelector('p');if(copy)setText(copy,'Describe what you want to work on and the Librarian will recommend drills from the RebelsPrep library.');let hero=page.querySelector('.coach-librarian-hero');if(!hero){hero=document.createElement('section');hero.className='coach-librarian-hero';hero.innerHTML='<span class="coach-librarian-kicker">DRILL FINDER</span><h2>What Do You Want to Work On?</h2><p>Describe what is happening in the swing or the pitch you are struggling to hit. The Librarian will recommend drills only from the RebelsPrep library.</p>';head.insertAdjacentElement('afterend',hero);}const source=page.querySelector('#coach-ask-search');if(!source)return;let ask=page.querySelector('.coach-librarian-ask');if(!ask){ask=document.createElement('section');ask.className='coach-librarian-ask';ask.innerHTML='<label for="coach-librarian-query">ASK THE LIBRARIAN</label><textarea class="coach-librarian-query" id="coach-librarian-query" placeholder="Example: I can’t hit a changeup."></textarea><button class="coach-librarian-find" type="button">Find My Drills</button>';source.insertAdjacentElement('afterend',ask);const textarea=ask.querySelector('#coach-librarian-query');textarea.value=lastQuery||source.value||'';const go=()=>{lastQuery=textarea.value.trim();renderResults(page,lastQuery);};ask.querySelector('.coach-librarian-find')?.addEventListener('click',go);textarea.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')go();});if(lastQuery)renderResults(page,lastQuery);} }
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;patchAsk();});}
if(app){new MutationObserver(schedule).observe(app,{childList:true,subtree:true});schedule();}
