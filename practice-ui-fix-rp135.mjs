import * as shared from './shared-rp52.mjs?v=rp135';
import {teams} from './teams.mjs?v=rpbuild34';
import {coaches} from './roster.mjs?v=rp129';
import {combinedTeam} from './team-selection.mjs?v=rpbuild33';
import {playerSeedDocuments,teamSeedDocuments} from './account-roster.mjs?v=rpaccount55';

const KEY='RebelsPrep:coach-pilot:1';
const activeState=()=>{try{const id=localStorage.getItem(KEY+':active-team')||teams[0].id;return {id,state:JSON.parse(localStorage.getItem(KEY+':team:'+id)||localStorage.getItem(KEY)||'{}')};}catch{return null;}};

// Build 138 deliberately does not touch drill selection. The planner already
// owns the drill target, disabled state, selection state and redraw. The Build
// 136/137 overlay was fighting that state on every mutation/timer tick, which
// caused the iPhone picker to flicker and become unstable after a few taps.

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
function repair(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;restoreActivate();});}
new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true});
setInterval(restoreActivate,1000);
repair();
