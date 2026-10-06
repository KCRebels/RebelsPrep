import * as shared from './shared-rp52.mjs?v=rp135';
import {teams} from './teams.mjs?v=rpbuild34';
import {coaches} from './roster.mjs?v=rp129';
import {combinedTeam} from './team-selection.mjs?v=rpbuild33';
import {playerSeedDocuments,teamSeedDocuments} from './account-roster.mjs?v=rpaccount55';

const KEY='RebelsPrep:coach-pilot:1',TARGET=9;
const activeState=()=>{try{const id=localStorage.getItem(KEY+':active-team')||teams[0].id;return {id,state:JSON.parse(localStorage.getItem(KEY+':team:'+id)||localStorage.getItem(KEY)||'{}')};}catch{return null;}};
const stationSelected=state=>Array.isArray(state?.selectedDrills)?state.selectedDrills:[];
const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text;};

function enforceNineDrills(){
 const saved=activeState();if(!saved)return;
 const selected=stationSelected(saved.state).length;
 const picker=document.querySelector('.picker-screen');
 if(picker){
  setText(document.querySelector('#picker-instruction strong'),'REQUIRED: Choose exactly 9 station drills.');
  setText(document.querySelector('#selection-summary strong'),selected+' of 9 station drills selected');
  document.querySelectorAll('[data-select-drill]').forEach(button=>{const chosen=button.getAttribute('aria-pressed')==='true';if(selected<TARGET&&!chosen){button.disabled=false;button.closest('.drill-row')?.classList.remove('unavailable');}});
  const all=document.querySelector('#all-drills');if(all&&selected<TARGET)all.disabled=false;
 }
 const choiceTitle=document.querySelector('#drill-choice-title');
 if(choiceTitle&&/Set Up \d+ Drill Stations?/.test(choiceTitle.textContent||''))setText(choiceTitle,'Set Up 9 Drill Stations');
}

// Build 136 intercepted every drill tap and reloaded the PWA. That caused the
// visible flicker and also let the older in-memory app state immediately undo
// the saved selection. Build 137 leaves drill taps entirely to the proven app
// click handler; this overlay only corrects the displayed nine-drill target.

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

let scheduled=false;
function repair(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enforceNineDrills();restoreActivate();});}
new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{enforceNineDrills();restoreActivate();},500);
repair();
