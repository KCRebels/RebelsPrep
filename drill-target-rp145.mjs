import {drills} from './drills.mjs?v=recovery78';
const KEY='RebelsPrep:coach-pilot:1';
const TARGET=9;
const HYDRATE='RebelsPrep:drills-hydrated-148';
const stationIds=new Set(drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work').map(d=>d.id));
function draft(){try{const id=localStorage.getItem(KEY+':active-team');if(!id)return null;const key=KEY+':team:'+id;const state=JSON.parse(localStorage.getItem(key)||localStorage.getItem(KEY)||'{}');return {key,state};}catch{return null;}}
function selected(state){return (state.selectedDrills||[]).filter(id=>stationIds.has(id));}
function onDrills(){return !!document.querySelector('[data-select-drill],#selection-summary,#picker-instruction');}
function save(info){info.state.drillStationTarget=TARGET;info.state.plan=null;info.state.clock=null;if(info.state.steps)delete info.state.steps.drills;localStorage.setItem(info.key,JSON.stringify(info.state));}
function paint(){
 if(!onDrills())return;
 const info=draft();if(!info)return;const chosen=new Set(selected(info.state)),count=chosen.size;
 if(info.state.drillStationTarget!==TARGET)save(info);
 const instruction=document.querySelector('#picker-instruction');if(instruction)instruction.innerHTML='<strong>REQUIRED: Choose exactly 9 station drills.</strong>';
 const summary=document.querySelector('#selection-summary');if(summary){const names=[...chosen].map(id=>drills.find(d=>d.id===id)?.name).filter(Boolean);summary.innerHTML='<strong>'+count+' of 9 station drills selected</strong>'+(names.length?'<ol>'+names.map((n,i)=>'<li>'+(i+1)+'. '+n+'</li>').join('')+'</ol>':'<p>No drills selected yet</p>');}
 document.querySelectorAll('[data-select-drill]').forEach(button=>{const id=button.dataset.selectDrill,isChosen=chosen.has(id),locked=!isChosen&&count>=TARGET;button.disabled=locked;button.setAttribute('aria-pressed',String(isChosen));const row=button.closest('.drill-row');row?.classList.toggle('selected',isChosen);row?.classList.toggle('unavailable',locked);const mark=button.querySelector('.drill-row-mark');if(mark)mark.textContent=isChosen?'✓':'+';});
 const next=document.querySelector('[data-next="review"]');if(next)next.disabled=count!==TARGET;
}
document.addEventListener('click',e=>{const button=e.target.closest?.('[data-select-drill]');if(!button||!onDrills())return;e.preventDefault();e.stopImmediatePropagation();sessionStorage.removeItem(HYDRATE);const info=draft();if(!info)return;const id=button.dataset.selectDrill;if(!stationIds.has(id))return;const chosen=new Set(selected(info.state));if(chosen.has(id))chosen.delete(id);else if(chosen.size<TARGET)chosen.add(id);else return;const other=(info.state.selectedDrills||[]).filter(x=>!stationIds.has(x));info.state.selectedDrills=[...other,...chosen];save(info);paint();},true);
document.addEventListener('click',e=>{const next=e.target.closest?.('[data-next="review"]');if(!next||!onDrills())return;const info=draft();if(!info||selected(info.state).length!==TARGET){e.preventDefault();e.stopImmediatePropagation();paint();return;}if(sessionStorage.getItem(HYDRATE)!=='yes'){e.preventDefault();e.stopImmediatePropagation();sessionStorage.setItem(HYDRATE,'yes');save(info);location.hash='rp-drills';location.reload();}},true);
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paint();});}).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true});queueMicrotask(paint);
