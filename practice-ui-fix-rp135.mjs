import * as shared from './shared-rp52.mjs?v=rp135';
import {teams} from './teams.mjs?v=rpbuild34';
import {coaches} from './roster.mjs?v=rp129';
import {drills} from './drills.mjs?v=recovery78';
import {combinedTeam} from './team-selection.mjs?v=rpbuild33';
import {playerSeedDocuments,teamSeedDocuments} from './account-roster.mjs?v=rpaccount55';

const KEY='RebelsPrep:coach-pilot:1',TARGET=9;
const activeState=()=>{try{const id=localStorage.getItem(KEY+':active-team')||teams[0].id;return {id,state:JSON.parse(localStorage.getItem(KEY+':team:'+id)||localStorage.getItem(KEY)||'{}')};}catch{return null;}};
const saveState=(id,state)=>{localStorage.setItem(KEY+':team:'+id,JSON.stringify(state));localStorage.setItem(KEY+':active-team',id);};
const stationIds=()=>new Set(drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work').map(d=>d.id));
const selectedStationIds=state=>{const ids=stationIds();return (state.selectedDrills||[]).filter(id=>ids.has(id));};

function paintPicker(){
 const saved=activeState();if(!saved||!document.querySelector('.picker-screen'))return;
 const selected=new Set(selectedStationIds(saved.state)),count=selected.size;
 const instruction=document.querySelector('#picker-instruction strong');if(instruction)instruction.textContent='REQUIRED: Choose exactly 9 station drills.';
 const summary=document.querySelector('#selection-summary');if(summary){const names=[...selected].map(id=>drills.find(d=>d.id===id)?.name).filter(Boolean);summary.innerHTML='<strong>'+count+' of 9 station drills selected</strong>'+(names.length?'<ol>'+names.map((name,i)=>'<li>'+(i+1)+'. '+name.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</li>').join('')+'</ol>':'<p>No drills selected yet</p>');}
 document.querySelectorAll('[data-select-drill]').forEach(button=>{const id=button.dataset.selectDrill,chosen=selected.has(id),row=button.closest('.drill-row');button.disabled=!chosen&&count>=TARGET;button.setAttribute('aria-pressed',String(chosen));button.setAttribute('aria-label',(chosen?'Deselect ':'Select ')+(drills.find(d=>d.id===id)?.name||''));const mark=button.querySelector('.drill-row-mark');if(mark)mark.textContent=chosen?'✓':'+';row?.classList.toggle('selected',chosen);row?.classList.toggle('unavailable',!chosen&&count>=TARGET);});
 const all=document.querySelector('#all-drills');if(all)all.disabled=count>=TARGET;
}

// The legacy app still has a three-drill lock inside its click handler. For
// this build, own picker taps in capture phase so the visible nine-drill target
// and the saved draft use the same state. No reloads, timers, or redraw loops.
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-select-drill]');if(!button||!document.querySelector('.picker-screen'))return;
 event.preventDefault();event.stopImmediatePropagation();
 const saved=activeState();if(!saved)return;const id=button.dataset.selectDrill,ids=stationIds();if(!ids.has(id))return;
 const current=new Set(selectedStationIds(saved.state));if(current.has(id))current.delete(id);else if(current.size<TARGET)current.add(id);else return;
 const nonStation=(saved.state.selectedDrills||[]).filter(x=>!ids.has(x));saved.state.selectedDrills=[...nonStation,...current];saved.state.plan=null;saved.state.clock=null;if(saved.state.steps)delete saved.state.steps.drills;saveState(saved.id,saved.state);paintPicker();
},true);

// Before leaving the picker, reload once only to hydrate the app module from
// the nine saved choices, then automatically continue. The user never loses
// the selected drills and normal app validation/building resumes from there.
document.addEventListener('click',event=>{
 const next=event.target.closest?.('[data-next="review"]');if(!next||!document.querySelector('.picker-screen'))return;
 const saved=activeState();if(!saved)return;const count=selectedStationIds(saved.state).length;if(count!==TARGET){event.preventDefault();event.stopImmediatePropagation();paintPicker();return;}
 if(sessionStorage.getItem('rp139-hydrated')!=='1'){event.preventDefault();event.stopImmediatePropagation();sessionStorage.setItem('rp139-hydrated','1');sessionStorage.setItem('rp139-go-review','1');location.reload();}else sessionStorage.removeItem('rp139-hydrated');
},true);

function continueAfterHydrate(){if(sessionStorage.getItem('rp139-go-review')!=='1')return;const next=document.querySelector('.picker-screen [data-next="review"]');if(!next)return;sessionStorage.removeItem('rp139-go-review');setTimeout(()=>next.click(),50);}

async function activateFromSaved(button){
 const saved=activeState();if(!saved?.state?.plan)return;const state=saved.state,teamIds=state.teamIds?.length?state.teamIds:[state.teamId],team=combinedTeam(teams,teamIds),players=[...team.players,...(state.guests||[])];button.disabled=true;button.textContent='Activating…';
 try{await shared.refreshCoachAuth();await shared.ensureCoachAccount(teamIds);await shared.seedAccountDirectory(playerSeedDocuments(),teamSeedDocuments());const people=[...players.map(p=>({...p,role:'player'})),...coaches.map(c=>({...c,role:'coach'}))];await shared.activate(state.plan,state.teamId,state.date,people,location.href,teamIds);location.reload();}catch(err){button.disabled=false;button.textContent='Activate Practice';let p=document.querySelector('#rp135-activate-error');if(!p){p=document.createElement('p');p.id='rp135-activate-error';p.className='notice error';button.parentElement.after(p);}p.textContent=err?.message||String(err);}
}
function restoreActivate(){const status=[...document.querySelectorAll('p.status')].find(p=>p.textContent.includes('Activate Practice to publish assignments.'));if(!status||document.querySelector('#activate-shared')||document.querySelector('#rp135-activate'))return;const saved=activeState();if(!saved?.state?.plan)return;const wrap=document.createElement('div');wrap.className='actions';const button=document.createElement('button');button.id='rp135-activate';button.className='primary';button.textContent='Activate Practice';button.onclick=()=>activateFromSaved(button);wrap.append(button);status.before(wrap);}

const observer=new MutationObserver(()=>{paintPicker();restoreActivate();continueAfterHydrate();});observer.observe(document.documentElement,{childList:true,subtree:true});paintPicker();restoreActivate();continueAfterHydrate();
