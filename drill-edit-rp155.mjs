// Build 157: one-time stale drill repair without a reload loop.
const KEY='RebelsPrep:coach-pilot:1';
function activeInfo(){try{const active=localStorage.getItem(KEY+':active-team');if(!active)return null;const key=KEY+':team:'+active;const state=JSON.parse(localStorage.getItem(key)||localStorage.getItem(KEY)||'null');return state?{key,state}:null;}catch{return null;}}
function required(){const text=(document.querySelector('#picker-instruction')?.textContent||'')+' '+(document.querySelector('#selection-summary')?.textContent||'');const m=text.match(/(?:exactly|of)\s+(\d+)/i);return m?Number(m[1]):null;}
function shownCount(){const t=document.querySelector('#selection-summary')?.textContent||'';const m=t.match(/(\d+)\s+of\s+\d+/i);return m?Number(m[1]):document.querySelectorAll('[data-select-drill][aria-pressed="true"]').length;}
function clearDraft(){const info=activeInfo();if(!info)return false;info.state.selectedDrills=[];info.state.plan=null;info.state.clock=null;if(info.state.steps)delete info.state.steps.drills;localStorage.setItem(info.key,JSON.stringify(info.state));return true;}
function reloadOnce(){sessionStorage.setItem('rp157-drill-cleared','1');location.hash='rp-drills';location.reload();}
// Clear All always clears the active draft. One reload is enough for the core app to hydrate the cleared state.
document.addEventListener('click',e=>{const b=e.target.closest?.('#clear-drills');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(clearDraft())reloadOnce();},true);
// Heal legacy over-target selections once per page load cycle. Never reload again after the repaired state returns.
let healing=false;function heal(){if(healing||!document.querySelector('#drill-picker'))return;const limit=required(),count=shownCount();if(!Number.isFinite(limit)||count<=limit){sessionStorage.removeItem('rp157-drill-cleared');return;}if(sessionStorage.getItem('rp157-drill-cleared')==='1')return;healing=true;if(clearDraft())reloadOnce();}
new MutationObserver(()=>queueMicrotask(heal)).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',heal);setTimeout(heal,250);setTimeout(heal,1000);