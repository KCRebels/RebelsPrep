// Build 156: repair stale drill selections when the required count drops (for example 9 of 3).
const KEY='RebelsPrep:coach-pilot:1';
function draftKeys(){const active=localStorage.getItem(KEY+':active-team');const keys=[];if(active)keys.push(KEY+':team:'+active);for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(KEY+':team:')&&!keys.includes(k))keys.push(k);}if(localStorage.getItem(KEY)&&!keys.includes(KEY))keys.push(KEY);return keys;}
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}}
function write(k,s){if(!s)return;s.selectedDrills=[];s.drillStationTarget=null;s.plan=null;s.clock=null;if(s.steps)delete s.steps.drills;localStorage.setItem(k,JSON.stringify(s));}
function required(){const text=(document.querySelector('#picker-instruction')?.textContent||'')+' '+(document.querySelector('#selection-summary')?.textContent||'');const m=text.match(/(?:exactly|of)\s+(\d+)/i);return m?Number(m[1]):null;}
function shownCount(){const t=document.querySelector('#selection-summary')?.textContent||'';const m=t.match(/(\d+)\s+of\s+\d+/i);return m?Number(m[1]):document.querySelectorAll('[data-select-drill][aria-pressed="true"]').length;}
function clearSaved(){const active=localStorage.getItem(KEY+':active-team'),activeKey=active?KEY+':team:'+active:null;let changed=false;for(const k of draftKeys()){const s=read(k);if(!s)continue;if(k===activeKey||k===KEY||(s.selectedDrills||[]).length){write(k,s);changed=true;}}return changed;}
function reloadDrills(){sessionStorage.setItem('rp156-drill-repair','1');location.hash='rp-drills';location.reload();}
function forceClear(){clearSaved();reloadDrills();}
// Clear All must always work, even if an older published practice makes the core draft guard read-only.
document.addEventListener('click',e=>{const b=e.target.closest?.('#clear-drills');if(!b)return;e.preventDefault();e.stopImmediatePropagation();forceClear();},true);
// Automatically repair impossible stale state such as "9 of 3". This avoids requiring a successful button tap first.
let repairing=false;function heal(){if(repairing||!document.querySelector('#drill-picker'))return;const limit=required(),count=shownCount();if(Number.isFinite(limit)&&count>limit){repairing=true;forceClear();}}
new MutationObserver(()=>queueMicrotask(heal)).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',heal);setTimeout(heal,250);setTimeout(heal,1000);