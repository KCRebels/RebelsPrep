import {services,accountContext} from './account-model-rp276.mjs?v=rp276';
import {drills} from './drills.mjs?v=rp277';
import {rosterPlayers} from './team-rosters.mjs?v=teamaware101';

const app=document.getElementById('app');
let selectedIds=[];
let activePlayerId='';
let publishing=false;
let voiceRecognition=null;
let selectedTags=[];
const CATEGORIES=[
 ['Approach',['Poor pitch selection','Too passive / hesitant','Chasing','Not attacking hittable pitches','Guessing','Poor two-strike approach','Taking too many strikes','Expanding the zone early']],
 ['Timing',['Early','Late','Lunging / drifting forward','Off-balance','Not getting foot down','Rushing','Commitment too early','Not adjusting to off-speed']],
 ['Mechanics',['Flying open','Rolling over','Dropping hands','Casting','Pulling off the ball','Poor outside-pitch approach','Under the ball / excessive pop-ups','Down-up swing path','Poor extension','Losing posture','Collapsing back side','Long swing path']],
 ['Mental / Competitive',['Tentative','Pressing','Lack of confidence','Poor adjustment','Repeating same mistake','At-bat carried into next at-bat','Lost plan / approach']]
];
function observationPickerHTML(){return '<section class="coach-obs-categories"><div class="coach-obs-section-head"><h2>Observation Options</h2><span class="coach-obs-tag-count">'+selectedTags.length+' of 3 selected</span></div><p class="coach-obs-hint">Choose up to three observation options.</p>'+CATEGORIES.map(([category,options])=>'<details class="coach-obs-category" '+(selectedTags.some(t=>options.includes(t))?'open':'')+'><summary><strong>'+esc(category)+'</strong><span class="coach-obs-category-status">'+(options.filter(t=>selectedTags.includes(t)).length?options.filter(t=>selectedTags.includes(t)).length+' selected':'Choose')+'</span><span class="coach-obs-chevron" aria-hidden="true">⌄</span></summary><div class="coach-obs-options">'+options.map(t=>'<button type="button" class="coach-obs-option '+(selectedTags.includes(t)?'is-selected':'')+'" data-coach-obs-tag="'+esc(t)+'" aria-pressed="'+selectedTags.includes(t)+'">'+esc(t)+'</button>').join('')+'</div></details>').join('')+'</section>';}
function syncObservationPicker(){document.querySelectorAll('[data-coach-obs-tag]').forEach(b=>{const on=selectedTags.includes(b.dataset.coachObsTag);b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));b.disabled=!on&&selectedTags.length>=3;});const count=document.querySelector('.coach-obs-tag-count');if(count)count.textContent=selectedTags.length+' of 3 selected';document.querySelectorAll('.coach-obs-category').forEach(d=>{const all=[...d.querySelectorAll('[data-coach-obs-tag]')];const n=all.filter(b=>selectedTags.includes(b.dataset.coachObsTag)).length;const span=d.querySelector('.coach-obs-category-status');if(span)span.textContent=n?n+' selected':'Choose';});}


const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drillName=id=>drills.find(d=>d.id===id)?.name||id;

async function resolvePlayer(){
 const page=app?.querySelector('#hitting-observation-form')?.closest('.coach-portal-page');
 const playerName=page?.querySelector('.coach-obs-identity h1')?.textContent?.trim()||page?.querySelector('.coach-page-head p')?.textContent?.trim()||'';
 if(!playerName)return null;
 const ctx=await accountContext();
 const teamIds=ctx?.account?.teamIds||[];
 const candidates=rosterPlayers.filter(p=>teamIds.some(id=>(p.memberTeamIds||[]).includes(id)));
 return candidates.find(p=>p.name===playerName)||candidates.find(p=>p.name.toLowerCase()===playerName.toLowerCase())||null;
}

function selectedHTML(){
 return '<div class="coach-picked-drills">'+(selectedIds.length?selectedIds.map((id,i)=>'<article class="coach-picked-row"><span class="coach-picked-number">'+(i+1)+'</span><div><strong>'+esc(drillName(id))+'</strong><small>'+esc(drills.find(d=>d.id===id)?.bestUsedFor||drills.find(d=>d.id===id)?.primaryPurpose||'')+'</small></div></article>').join(''):'<p class="coach-obs-hint">No drills selected. Add drills yourself or get suggestions.</p>')+'</div>';
}

function optionHTML(d){
 const unavailable=selectedIds.includes(d.id)&&selectedIds.indexOf(d.id)!==replacingDrill;
 return '<button type="button" class="coach-drill-option'+(unavailable?' is-disabled':'')+'" data-choose-drill="'+esc(d.id)+'" '+(unavailable?'disabled':'')+'><strong>'+esc(d.name)+'</strong><span>'+esc(d.bestUsedFor||d.primaryPurpose||d.secondaryFocus||'')+'</span></button>';
}
function renderPickerRows(filter=''){
 const list=document.querySelector('.coach-drill-picker-list');
 if(!list)return;
 const q=filter.trim().toLowerCase();
 const items=drills.filter(d=>!q||[d.name,d.category,d.primaryPurpose,d.secondaryFocus,d.bestUsedFor,d.howItWorks,d.coachingCues].some(v=>String(v||'').toLowerCase().includes(q)));
 list.innerHTML=items.map(optionHTML).join('')||'<p class="coach-drill-picker-empty">No matching drills.</p>';
}
function chooseDrill(id){
 if(!id||!String(id).trim())return;
 const duplicate=selectedIds.findIndex((value,i)=>value===id&&i!==replacingDrill);
 if(duplicate!==-1)return;
 if(replacingDrill>=0&&replacingDrill<selectedIds.length)selectedIds[replacingDrill]=id;
 else if(selectedIds.length<3)selectedIds.push(id);
 else return;
 showDrillSearch(false);syncPickerUI();
}

function syncPickerUI(){
 const count=document.querySelector('.coach-pick-drills-count');if(count)count.textContent=selectedIds.length+' of 3 selected';
 const picked=document.querySelector('.coach-picked-drills');if(picked)picked.outerHTML=selectedHTML();
 refreshDrillManager();
}

function buildPicker(){
 return '<section class="coach-pick-drills">'+
  '<div class="coach-obs-section-head"><h2>Your Drill Plan</h2><span class="coach-pick-drills-count">'+selectedIds.length+' of 3 selected</span></div>'+
  selectedHTML()+
  '<div class="coach-drill-plan-actions"><button type="button" class="coach-pick-drills-button">Manage Drills</button><button type="button" class="coach-suggest-drills">Suggest Drills</button></div>'+
  '<p class="coach-obs-hint coach-suggest-requirement">Complete Coach Observation and select at least one option to enable Suggested Drills.</p>'+
  '<div class="coach-drill-picker" aria-hidden="true"><div class="coach-drill-modal-title"><h2>Manage Suggested Drills</h2><button type="button" class="coach-drill-picker-close">Close</button></div><p class="coach-obs-hint">Add, edit, or remove up to three drills. Suggestions are optional.</p><div class="coach-drill-manage-rows"></div><button class="coach-drill-picker-add" type="button">Add Drill</button><button class="coach-suggest-drills coach-drill-modal-suggest" type="button">Suggest Drills</button><div class="coach-drill-modal-footer"><button type="button" class="coach-drill-picker-done">Save Drills</button></div><div class="coach-drill-search-view" hidden><div class="coach-drill-modal-title"><div><div class="coach-drill-replace-label"></div><h2>Add or Edit Drill</h2></div><button type="button" class="coach-drill-search-back">Back</button></div><label class="coach-drill-custom-label" for="coach-drill-custom-name">Your drill name<input id="coach-drill-custom-name" class="coach-drill-custom-name" type="text" maxlength="100" placeholder="Enter your own drill"></label><button type="button" class="coach-drill-use-custom">Use Drill</button><input class="coach-drill-picker-search" type="search" placeholder="Search drills" autocomplete="off"><div class="coach-drill-picker-list"></div></div></div>'+
 '</section>';
}
let replacingDrill=-1;
function refreshDrillManager(){
 const list=document.querySelector('.coach-drill-manage-rows');
 if(!list)return;
 list.innerHTML=selectedIds.map((id,i)=>{const d=drills.find(x=>x.id===id);return '<article class="coach-drill-manage-row"><div class="coach-drill-row-intro"><span class="coach-picked-number">'+(i+1)+'</span><div><strong>'+esc(drillName(id))+'</strong><p>'+esc(d?.bestUsedFor||d?.primaryPurpose||'')+'</p></div></div><div class="coach-drill-row-actions"><button type="button" data-edit-drill="'+i+'">Edit / Replace</button><button type="button" data-remove-drill="'+esc(id)+'">Remove</button></div></article>';}).join('')||'<p class="coach-obs-hint">No drills selected yet.</p>';
 const add=document.querySelector('.coach-drill-picker-add');if(add)add.disabled=selectedIds.length>=3;
 const count=document.querySelector('.coach-pick-drills-count');if(count)count.textContent=selectedIds.length+' of 3 selected';
 const picked=document.querySelector('.coach-picked-drills');if(picked)picked.outerHTML=selectedHTML();
 const search=document.querySelector('.coach-drill-picker-search');renderPickerRows(search?.value||'');
 syncSuggestionState();
}
function openDrillManager(){
 const modal=document.querySelector('.coach-drill-picker');if(!modal)return;
 modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
 document.body.classList.add('coach-drill-modal-active');
 showDrillSearch(false);refreshDrillManager();
}
function closeDrillManager(){
 const modal=document.querySelector('.coach-drill-picker');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');
 document.body.classList.remove('coach-drill-modal-active');replacingDrill=-1;
}
function showDrillSearch(show,index=-1){
 const modal=document.querySelector('.coach-drill-picker');if(!modal)return;
 replacingDrill=show?index:-1;
 const view=modal.querySelector('.coach-drill-search-view');if(view)view.hidden=!show;
 modal.classList.toggle('show-search',show);
 if(show){const replacement=modal.querySelector('.coach-drill-replace-label');if(replacement)replacement.textContent=index>=0&&index<selectedIds.length?'REPLACE DRILL '+(index+1):'ADD DRILL';const custom=modal.querySelector('.coach-drill-custom-name');if(custom)custom.value=index>=0&&index<selectedIds.length&&!drills.some(d=>d.id===selectedIds[index])?selectedIds[index]:'';const input=modal.querySelector('.coach-drill-picker-search');if(input){input.value='';renderPickerRows('');}}
}
function hasCompletedObservations(){return !!document.querySelector('#focus-observation')?.value?.trim()&&selectedTags.length>0;}
function syncSuggestionState(){const ready=hasCompletedObservations();document.querySelectorAll('.coach-suggest-drills').forEach(b=>{b.disabled=!ready;b.setAttribute('aria-disabled',String(!ready));});const note=document.querySelector('.coach-suggest-requirement');if(note)note.textContent=ready?'Suggestions are ready based on your observation and selected options.':'Complete Coach Observation and select at least one option to enable Suggested Drills.';const publish=document.querySelector('#hitting-observation-form button[type="submit"]');if(publish)publish.disabled=!(ready&&selectedIds.length>0)||publishing;}
function setupDictation(){const button=document.querySelector('.coach-obs-dictate');if(!button)return;const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){button.title='Tap to open the keyboard, then use its microphone to dictate.';button.textContent='🎙 Dictate';button.addEventListener('click',()=>{const field=document.querySelector('#focus-observation');field?.focus();});return;}button.addEventListener('click',()=>{if(voiceRecognition){voiceRecognition.stop();return;}const field=document.querySelector('#focus-observation');if(!field)return;try{const rec=new Speech();rec.lang='en-US';rec.continuous=true;rec.interimResults=false;rec.onresult=event=>{const words=Array.from(event.results).slice(event.resultIndex).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ').trim();if(words){field.value+=(field.value.trim()?' ':'')+words;field.dispatchEvent(new Event('input',{bubbles:true}));}};rec.onerror=()=>{button.textContent='🎙 Dictate';button.setAttribute('aria-pressed','false');};rec.onend=()=>{voiceRecognition=null;button.textContent='🎙 Dictate';button.setAttribute('aria-pressed','false');};rec.start();voiceRecognition=rec;button.textContent='■ Stop';button.setAttribute('aria-pressed','true');}catch{button.textContent='🎙 Dictate';}});}
function suggestDrills(){
 if(!hasCompletedObservations()){syncSuggestionState();return;}
 const note=document.querySelector('#focus-observation')?.value||'';
 const query=[...selectedTags,note,document.querySelector('#focus-next')?.value||''].join(' ').toLowerCase();
 const words=[...new Set((query.match(/[a-z]{4,}/g)||[]).filter(x=>!['poor','with','what','their','from','this','that','have','player','hitting'].includes(x)))];
 if(!words.length){const box=document.querySelector('#focus-observation');box?.focus();return;}
 const scored=drills.map(d=>{const attrs=[[d.name,4],[d.bestUsedFor,5],[d.primaryPurpose,4],[d.secondaryFocus,3],[d.coachingCues,2],[d.howItWorks,1]];const score=words.reduce((n,w)=>n+attrs.reduce((a,[value,weight])=>a+(String(value||'').toLowerCase().includes(w)?weight:0),0),0);return{d,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.d.name.localeCompare(b.d.name)).slice(0,3);
 if(!scored.length){const hint=document.querySelector('.coach-drill-picker .coach-obs-hint');if(hint)hint.textContent='No matching suggestions found. Choose drills from the library instead.';return;}
 if(selectedIds.length&&!window.confirm('Replace the current drill plan with RebelsPrep suggestions?'))return;
 selectedIds=scored.map(x=>x.d.id);refreshDrillManager();syncPickerUI();
}


function patch(){
 const form=app?.querySelector('#hitting-observation-form');
 if(!form||form.dataset.rp332==='1')return;
 form.dataset.rp332='1';
 const page=form.closest('.coach-portal-page');
 page?.classList.add('coach-observation-page');
 const observationLabel=form.querySelector('#focus-observation')?.closest('label');
 if(observationLabel){observationLabel.classList.add('coach-obs-note');observationLabel.insertAdjacentHTML('beforebegin','<div class="coach-obs-section-head"><h2>Coach Observation</h2><button type="button" class="coach-obs-dictate" aria-pressed="false">🎙 Dictate</button></div>');const text=observationLabel.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.textContent='Describe what you observed';form.querySelector('#focus-observation')?.setAttribute('placeholder','Type or dictate your hitting observation…');observationLabel.insertAdjacentHTML('afterend',observationPickerHTML());}

 const oldSelect=form.querySelector('#focus-drill')?.closest('label');
 if(oldSelect)oldSelect.outerHTML=buildPicker();
 renderPickerRows('');
 setupDictation();
 syncSuggestionState();
 resolvePlayer().then(p=>{
  if(!p)return;
  if(activePlayerId&&activePlayerId!==p.id){selectedIds=[];selectedTags=[];}
  activePlayerId=p.id;
  syncObservationPicker();
  syncPickerUI();
  syncSuggestionState();
 }).catch(()=>{});
}

function goBackToTeam(){const nav=[...document.querySelectorAll('[data-coach-view="focus"]')].find(el=>el.closest('.coach-bottom-nav'));nav?.click();}

async function publish(form){
 if(publishing)return;
 publishing=true;
 const button=form.querySelector('button[type="submit"]');
 const oldText=button?.textContent||'Publish';
 if(button){button.disabled=true;button.textContent='Publishing…';}
 form.querySelector('.obs-error')?.remove();
 try{
  const observation=form.querySelector('#focus-observation')?.value?.trim()||'';
  const nextFocus=form.querySelector('#focus-next')?.value?.trim()||'';
  if(!observation||!selectedTags.length)throw Error('Complete Coach Observation and select at least one Observation Option before publishing.');
  if(!selectedIds.length)throw Error('Select at least one drill before publishing.');
  const player=activePlayerId?rosterPlayers.find(p=>p.id===activePlayerId):await resolvePlayer();
  if(!player)throw Error('Player not found.');
  const ctx=await accountContext();
  if(!ctx?.account?.coachId)throw Error('Coach account not found.');
  const {F,db,auth}=await services();
  await F.addDoc(F.collection(db,'rpFocusObservations'),{
   playerId:player.id,
   playerName:player.name,
   type:'hitting',
   observation:observation||selectedTags.join('; '),
   tags:[...selectedTags],
   nextFocus,
   drillIds:[...selectedIds],
   drillId:selectedIds[0]||'',
   coachId:ctx.account.coachId,
   coachName:ctx.account.displayName||ctx.user?.displayName||ctx.user?.email||'Coach',
   coachUid:auth.currentUser.uid,
   status:'published',
   publishedAt:F.serverTimestamp()
  });
  selectedIds=[];
  selectedTags=[];
  activePlayerId=player.id;
  goBackToTeam();
 }catch(e){
  const p=document.createElement('p');p.className='obs-error';p.textContent=e?.message||String(e);form.prepend(p);
 }finally{
  publishing=false;
  if(button&&button.isConnected){button.disabled=false;button.textContent=oldText;}
 }
}

document.addEventListener('click',e=>{
 const tag=e.target.closest?.('[data-coach-obs-tag]');
 if(tag){e.preventDefault();const value=tag.dataset.coachObsTag;if(selectedTags.includes(value))selectedTags=selectedTags.filter(x=>x!==value);else if(selectedTags.length<3)selectedTags.push(value);syncObservationPicker();syncSuggestionState();return;}
 if(e.target.closest?.('.coach-pick-drills-button')){e.preventDefault();openDrillManager();return;}
 if(e.target.closest?.('.coach-drill-picker-close,.coach-drill-picker-done')){e.preventDefault();closeDrillManager();return;}
 if(e.target.closest?.('.coach-drill-picker-add')){e.preventDefault();showDrillSearch(true,selectedIds.length);return;}
 const edit=e.target.closest?.('[data-edit-drill]');if(edit){e.preventDefault();showDrillSearch(true,Number(edit.dataset.editDrill));return;}
 if(e.target.closest?.('.coach-drill-search-back')){e.preventDefault();showDrillSearch(false);return;}
 const drillChoice=e.target.closest?.('[data-choose-drill]');if(drillChoice){e.preventDefault();if(!drillChoice.disabled)chooseDrill(drillChoice.dataset.chooseDrill);return;}
 if(e.target.closest?.('.coach-drill-use-custom')){e.preventDefault();const custom=document.querySelector('.coach-drill-custom-name');const name=custom?.value?.trim();if(name)chooseDrill(name);else custom?.focus();return;}
 const suggest=e.target.closest?.('.coach-suggest-drills');if(suggest){e.preventDefault();suggestDrills();return;}
 const remove=e.target.closest?.('[data-remove-drill]');if(remove){e.preventDefault();selectedIds=selectedIds.filter(id=>id!==remove.dataset.removeDrill);syncPickerUI();return;}
},true);



document.addEventListener('input',e=>{if(e.target.matches?.('.coach-drill-picker-search'))renderPickerRows(e.target.value);if(e.target.matches?.('#focus-observation'))syncSuggestionState();},true);


document.addEventListener('submit',e=>{
 const form=e.target.closest?.('#hitting-observation-form');
 if(!form)return;
 e.preventDefault();e.stopImmediatePropagation();publish(form);
},true);

if(app){new MutationObserver(()=>queueMicrotask(patch)).observe(app,{childList:true,subtree:true});patch();}
