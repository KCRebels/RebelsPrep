// Build 155: keep drill editing usable when an older published practice is still Ready to start.
// The core planner can intentionally lock a draft while a shared practice exists. When a new draft
// has already been started, this bridge lets Clear All reset stale drill choices and lets the coach
// choose the newly required count without reviving the old hard-coded target.
const KEY='RebelsPrep:coach-pilot:1';
function current(){try{const active=localStorage.getItem(KEY+':active-team');if(!active)return null;const key=KEY+':team:'+active;return {key,state:JSON.parse(localStorage.getItem(key)||localStorage.getItem(KEY)||'{}')};}catch{return null;}}
function save(info){info.state.plan=null;info.state.clock=null;if(info.state.steps)delete info.state.steps.drills;localStorage.setItem(info.key,JSON.stringify(info.state));}
function onPicker(){return !!document.querySelector('#drill-picker');}
function required(){const text=document.querySelector('#picker-instruction')?.textContent||document.querySelector('#selection-summary')?.textContent||'';const m=text.match(/(?:exactly|of)\s+(\d+)/i);return m?Number(m[1]):null;}
function reload(){location.hash='rp-drills';location.reload();}
document.addEventListener('click',e=>{
 const clear=e.target.closest?.('#clear-drills');if(!clear||!onPicker())return;
 const info=current();if(!info)return;
 e.preventDefault();e.stopImmediatePropagation();info.state.selectedDrills=[];info.state.drillStationTarget=required();save(info);reload();
},true);
// Only take over a drill-card click when the native planner is visibly stuck with a stale over-limit
// selection. Once Clear All succeeds, native selection remains the normal path.
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-select-drill]');if(!b||!onPicker())return;
 const info=current(),limit=required();if(!info||!limit)return;
 const stationSelected=[...document.querySelectorAll('[data-select-drill][aria-pressed="true"]')].length;
 if(stationSelected<=limit)return;
 e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.selectDrill;info.state.selectedDrills=(info.state.selectedDrills||[]).filter(x=>x!==id);save(info);reload();
},true);