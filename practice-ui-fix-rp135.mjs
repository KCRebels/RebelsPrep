import * as shared from './shared-rp52.mjs?v=rp135';
import {teams} from './teams.mjs?v=rpbuild34';
import {coaches} from './roster.mjs?v=rp129';
import {combinedTeam} from './team-selection.mjs?v=rpbuild33';
import {playerSeedDocuments,teamSeedDocuments} from './account-roster.mjs?v=rpaccount55';

const KEY='RebelsPrep:coach-pilot:1';
const activeState=()=>{try{const id=localStorage.getItem(KEY+':active-team')||teams[0].id;return {id,state:JSON.parse(localStorage.getItem(KEY+':team:'+id)||localStorage.getItem(KEY)||'{}')};}catch{return null;}};
const stationSelected=state=>Array.isArray(state?.selectedDrills)?state.selectedDrills:[];

function unlockNineDrills(){
 const root=document.querySelector('.picker-screen');if(!root)return;
 const saved=activeState();if(!saved)return;
 const selected=stationSelected(saved.state).length,target=9;
 const instruction=document.querySelector('#picker-instruction strong');if(instruction)instruction.textContent='REQUIRED: Choose exactly 9 station drills.';
 const summary=document.querySelector('#selection-summary strong');if(summary)summary.textContent=selected+' of 9 station drills selected';
 document.querySelectorAll('[data-select-drill]').forEach(button=>{const chosen=button.getAttribute('aria-pressed')==='true';if(selected<target&&!chosen){button.disabled=false;button.closest('.drill-row')?.classList.remove('unavailable');}});
 const all=document.querySelector('#all-drills');if(all&&selected<target)all.disabled=false;
}

function handleDrillClick(e){
 const button=e.target.closest?.('[data-select-drill]');if(!button||!document.querySelector('.picker-screen'))return;
 const saved=activeState();if(!saved)return;
 const id=button.dataset.selectDrill,state=saved.state,selected=[...new Set(state.selectedDrills||[])],has=selected.includes(id);
 if(!has&&selected.length>=9)return;
 e.preventDefault();e.stopImmediatePropagation();
 state.selectedDrills=has?selected.filter(x=>x!==id):[...selected,id];state.plan=null;state.clock=null;state.steps=state.steps||{};delete state.steps.drills;
 localStorage.setItem(KEY+':team:'+saved.id,JSON.stringify(state));
 location.hash='#rp-drills';location.reload();
}

async function activateFromSaved(button){
 const saved=activeState();if(!saved?.state?.plan)return;
 const state=saved.state,teamIds=state.teamIds?.length?state.teamIds:[state.teamId],team=combinedTeam(teams,teamIds),players=[...team.players,...(state.guests||[])];
 button.disabled=true;button.textContent='Activating…';
 try{
  await shared.refreshCoachAuth();await shared.ensureCoachAccount(teamIds);await shared.seedAccountDirectory(playerSeedDocuments(),teamSeedDocuments());
  const people=[...players.map(p=>({...p,role:'player'})),...coaches.map(c=>({...c,role:'coach'}))];
  await shared.activate(state.plan,state.teamId,state.date,people,location.href,teamIds);location.reload();
 }catch(err){button.disabled=false;button.textContent='Activate Practice';let p=document.querySelector('#rp135-activate-error');if(!p){p=document.createElement('p');p.id='rp135-activate-error';p.className='notice error';button.parentElement.after(p);}p.textContent=err?.message||String(err);}
}

function restoreActivate(){
 const status=[...document.querySelectorAll('p.status')].find(p=>p.textContent.includes('Activate Practice to publish assignments.'));if(!status)return;
 if(document.querySelector('#activate-shared')||document.querySelector('#rp135-activate'))return;
 const saved=activeState();if(!saved?.state?.plan)return;
 const wrap=document.createElement('div');wrap.className='actions';const button=document.createElement('button');button.id='rp135-activate';button.className='primary';button.textContent='Activate Practice';button.onclick=()=>activateFromSaved(button);wrap.append(button);status.before(wrap);
}

function repair(){unlockNineDrills();restoreActivate();}
document.addEventListener('click',handleDrillClick,true);
new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true});
repair();
