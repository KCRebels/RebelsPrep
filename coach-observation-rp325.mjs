import {services,accountContext} from './account-model-rp276.mjs?v=rp276';
import {drills} from './drills.mjs?v=rp277';
import {rosterPlayers} from './team-rosters.mjs?v=teamaware101';

const app=document.getElementById('app');
let selectedIds=[];
let activePlayerId='';
let publishing=false;

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
 const oldSelect=form.querySelector('#focus-drill')?.closest('label');
 if(oldSelect)oldSelect.outerHTML=buildPicker();
 renderPickerRows('');
 resolvePlayer().then(p=>{
  if(!p)return;
  if(activePlayerId&&activePlayerId!==p.id)selectedIds=[];
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
  if(!observation)throw Error('Add an observation before publishing.');
  const player=activePlayerId?rosterPlayers.find(p=>p.id===activePlayerId):await resolvePlayer();
  if(!player)throw Error('Player not found.');
  const ctx=await accountContext();
  if(!ctx?.account?.coachId)throw Error('Coach account not found.');
  const {F,db,auth}=await services();
  await F.addDoc(F.collection(db,'rpFocusObservations'),{
   playerId:player.id,
   playerName:player.name,
   type:'hitting',
   observation,
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
