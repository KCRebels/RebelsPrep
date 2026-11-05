import {services,accountContext} from './account-model-rp276.mjs?v=rp276';
import {drills} from './drills.mjs?v=rp277';
import {rosterPlayers} from './team-rosters.mjs?v=teamaware101';

const app=document.getElementById('app');
let selectedIds=[];
let activePlayerId='';
let publishing=false;
let selectedTags=[];
const CATEGORIES=[
 ['Approach',['Poor pitch selection','Too passive / hesitant','Chasing','Not attacking hittable pitches','Guessing','Poor two-strike approach','Taking too many strikes','Expanding the zone early']],
 ['Timing',['Early','Late','Lunging / drifting forward','Off-balance','Not getting foot down','Rushing','Commitment too early','Not adjusting to off-speed']],
 ['Mechanics',['Flying open','Rolling over','Dropping hands','Casting','Pulling off the ball','Poor outside-pitch approach','Under the ball / excessive pop-ups','Down-up swing path','Poor extension','Losing posture','Collapsing back side','Long swing path']],
 ['Mental / Competitive',['Tentative','Pressing','Lack of confidence','Poor adjustment','Repeating same mistake','At-bat carried into next at-bat','Lost plan / approach']]
];
function observationPickerHTML(){return '<section class="coach-obs-categories"><div class="coach-obs-section-head"><h2>What Did You Observe?</h2><span class="coach-obs-tag-count">'+selectedTags.length+' of 3 selected</span></div><p class="coach-obs-hint">Select up to three observations, then add any additional notes below.</p>'+CATEGORIES.map(([category,options])=>'<details class="coach-obs-category" '+(selectedTags.some(t=>options.includes(t))?'open':'')+'><summary>'+esc(category)+'<span>'+options.filter(t=>selectedTags.includes(t)).length+' selected</span></summary><div class="coach-obs-options">'+options.map(t=>'<button type="button" class="coach-obs-option '+(selectedTags.includes(t)?'is-selected':'')+'" data-coach-obs-tag="'+esc(t)+'" aria-pressed="'+selectedTags.includes(t)+'">'+esc(t)+'</button>').join('')+'</div></details>').join('')+'</section>';}
function syncObservationPicker(){document.querySelectorAll('[data-coach-obs-tag]').forEach(b=>{const on=selectedTags.includes(b.dataset.coachObsTag);b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));b.disabled=!on&&selectedTags.length>=3;});const count=document.querySelector('.coach-obs-tag-count');if(count)count.textContent=selectedTags.length+' of 3 selected';document.querySelectorAll('.coach-obs-category').forEach(d=>{const all=[...d.querySelectorAll('[data-coach-obs-tag]')];const n=all.filter(b=>selectedTags.includes(b.dataset.coachObsTag)).length;const span=d.querySelector('summary span');if(span)span.textContent=n+' selected';});}


const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drillName=id=>drills.find(d=>d.id===id)?.name||id;

async function resolvePlayer(){
 const page=app?.querySelector('#hitting-observation-form')?.closest('.coach-portal-page');
 const playerName=page?.querySelector('.coach-page-head p')?.textContent?.trim()||'';
 if(!playerName)return null;
 const ctx=await accountContext();
 const teamIds=ctx?.account?.teamIds||[];
 const candidates=rosterPlayers.filter(p=>teamIds.some(id=>(p.memberTeamIds||[]).includes(id)));
 return candidates.find(p=>p.name===playerName)||candidates.find(p=>p.name.toLowerCase()===playerName.toLowerCase())||null;
}

function selectedHTML(){
 if(!selectedIds.length)return '<div class="coach-picked-drills" data-empty="1"></div>';
 return '<div class="coach-picked-drills">'+selectedIds.map(id=>'<span class="coach-picked-chip">'+esc(drillName(id))+'<button type="button" data-remove-drill="'+esc(id)+'" aria-label="Remove '+esc(drillName(id))+'">×</button></span>').join('')+'</div>';
}

function optionHTML(d){
 const checked=selectedIds.includes(d.id);
 const disabled=!checked&&selectedIds.length>=3;
 return '<label class="coach-drill-option '+(checked?'is-selected ':'')+(disabled?'is-disabled':'')+'" data-drill-row="'+esc(d.id)+'"><input type="checkbox" value="'+esc(d.id)+'" '+(checked?'checked':'')+' '+(disabled?'disabled':'')+'><span>'+esc(d.name)+'</span></label>';
}

function renderPickerRows(filter=''){
 const list=document.querySelector('.coach-drill-picker-list');
 if(!list)return;
 const q=filter.trim().toLowerCase();
 const items=[...drills].sort((a,b)=>a.name.localeCompare(b.name)).filter(d=>!q||[d.name,d.category,d.primaryPurpose,d.secondaryFocus,d.bestUsedFor].some(v=>String(v||'').toLowerCase().includes(q)));
 list.innerHTML=items.map(optionHTML).join('')||'<p class="coach-drill-picker-empty">No matching drills.</p>';
}

function syncPickerUI(){
 const count=document.querySelector('.coach-pick-drills-count');
 if(count)count.textContent=selectedIds.length+' of 3 selected';
 const picked=document.querySelector('.coach-picked-drills');
 if(picked)picked.outerHTML=selectedHTML();
 const search=document.querySelector('.coach-drill-picker-search');
 renderPickerRows(search?.value||'');
}

function buildPicker(){
 return '<section class="coach-pick-drills">'+
  '<button type="button" class="coach-pick-drills-button"><span>Pick Drills</span><span class="coach-pick-drills-count">'+selectedIds.length+' of 3 selected</span></button>'+
  selectedHTML()+
  '<div class="coach-drill-picker" aria-hidden="true">'+
   '<input class="coach-drill-picker-search" type="search" placeholder="Search drills" autocomplete="off">'+
   '<div class="coach-drill-picker-list"></div>'+
   '<button type="button" class="coach-drill-picker-done">Done</button>'+
  '</div>'+ 
 '</section>';
}

function patch(){
 const form=app?.querySelector('#hitting-observation-form');
 if(!form||form.dataset.rp332==='1')return;
 form.dataset.rp332='1';
 const page=form.closest('.coach-portal-page');
 page?.classList.add('coach-observation-page');
 const observationLabel=form.querySelector('#focus-observation')?.closest('label');
 if(observationLabel){observationLabel.insertAdjacentHTML('beforebegin',observationPickerHTML());const text=observationLabel.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.textContent='Additional Notes (optional)';form.querySelector('#focus-observation')?.setAttribute('placeholder','Add anything else you noticed during the swing…');}
 const focusLabel=form.querySelector('#focus-next')?.closest('label');if(focusLabel){const text=focusLabel.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.textContent='Player Focus / Next Steps (optional)';}
 const oldSelect=form.querySelector('#focus-drill')?.closest('label');
 if(oldSelect)oldSelect.outerHTML=buildPicker();
 renderPickerRows('');
 resolvePlayer().then(p=>{
  if(!p)return;
  if(activePlayerId&&activePlayerId!==p.id){selectedIds=[];selectedTags=[];}
  activePlayerId=p.id;
  syncPickerUI();
 }).catch(()=>{});
}

function goBackToPlayer(playerId){
 const focus=[...document.querySelectorAll('[data-coach-view="focus"]')][0];
 if(!focus)return;
 focus.click();
 setTimeout(()=>{
  const player=document.querySelector('[data-focus-player="'+CSS.escape(playerId)+'"]');
  if(player)player.click();
 },60);
}

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
  if(!observation&&!selectedTags.length)throw Error('Select an observation or add a note before publishing.');
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
  goBackToPlayer(player.id);
 }catch(e){
  const p=document.createElement('p');p.className='obs-error';p.textContent=e?.message||String(e);form.prepend(p);
 }finally{
  publishing=false;
  if(button&&button.isConnected){button.disabled=false;button.textContent=oldText;}
 }
}

document.addEventListener('click',e=>{
 const tag=e.target.closest?.('[data-coach-obs-tag]');
 if(tag){e.preventDefault();const value=tag.dataset.coachObsTag;if(selectedTags.includes(value))selectedTags=selectedTags.filter(x=>x!==value);else if(selectedTags.length<3)selectedTags.push(value);syncObservationPicker();return;}
 const pick=e.target.closest?.('.coach-pick-drills-button');
 if(pick){
  e.preventDefault();e.stopPropagation();
  const panel=document.querySelector('.coach-drill-picker');
  const open=!panel?.classList.contains('is-open');
  panel?.classList.toggle('is-open',open);
  panel?.setAttribute('aria-hidden',open?'false':'true');
  if(open)setTimeout(()=>document.querySelector('.coach-drill-picker-search')?.focus(),0);
  return;
 }
 const done=e.target.closest?.('.coach-drill-picker-done');
 if(done){const panel=document.querySelector('.coach-drill-picker');panel?.classList.remove('is-open');panel?.setAttribute('aria-hidden','true');return;}
 const remove=e.target.closest?.('[data-remove-drill]');
 if(remove){selectedIds=selectedIds.filter(id=>id!==remove.dataset.removeDrill);syncPickerUI();return;}
},true);

document.addEventListener('input',e=>{if(e.target.matches?.('.coach-drill-picker-search'))renderPickerRows(e.target.value);},true);

document.addEventListener('change',e=>{
 const box=e.target.closest?.('.coach-drill-option input');
 if(!box)return;
 const id=box.value;
 if(box.checked){if(selectedIds.length>=3){box.checked=false;return;}if(!selectedIds.includes(id))selectedIds.push(id);}else selectedIds=selectedIds.filter(x=>x!==id);
 syncPickerUI();
},true);

document.addEventListener('submit',e=>{
 const form=e.target.closest?.('#hitting-observation-form');
 if(!form)return;
 e.preventDefault();e.stopImmediatePropagation();publish(form);
},true);

if(app){new MutationObserver(()=>queueMicrotask(patch)).observe(app,{childList:true,subtree:true});patch();}
