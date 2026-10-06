// Build 163: iPhone-safe drill selection bridge only. Start Over is owned by global-nav,
// which closes the published practice before clearing local state.
const KEY='RebelsPrep:coach-pilot:1';
const TEAM_PREFIX=KEY+':team:';
function activeKey(){const id=localStorage.getItem(KEY+':active-team');return id?TEAM_PREFIX+id:null;}
function readDraft(){try{const key=activeKey();if(!key)return null;const raw=localStorage.getItem(key)||localStorage.getItem(KEY);return raw?{key,draft:JSON.parse(raw)}:null;}catch{return null;}}
function writeDraft(info){try{localStorage.setItem(info.key,JSON.stringify(info.draft));return true;}catch{return false;}}
function limit(){const t=(document.querySelector('#picker-instruction')?.textContent||'')+' '+(document.querySelector('#selection-summary')?.textContent||'');const m=t.match(/(?:exactly|of)\s+(\d+)/i);return m?Number(m[1]):3;}
function ids(info){return Array.isArray(info?.draft?.selectedDrills)?info.draft.selectedDrills:[];}
function redraw(info){
 const selected=ids(info),max=limit();
 document.querySelectorAll('[data-select-drill]').forEach(b=>{const on=selected.includes(b.dataset.selectDrill);b.disabled=!on&&selected.length>=max;b.setAttribute('aria-pressed',String(on));const row=b.closest('.drill-row');row?.classList.toggle('selected',on);row?.classList.toggle('unavailable',!on&&selected.length>=max);const mark=b.querySelector('.drill-row-mark');if(mark)mark.textContent=on?'✓':'+';});
 const s=document.querySelector('#selection-summary');if(s){const names=selected.map(id=>document.querySelector('[data-select-drill="'+CSS.escape(id)+'"] .drill-row-label strong')?.textContent).filter(Boolean);s.innerHTML='<strong>'+selected.length+' of '+max+' station drills selected</strong>'+(names.length?'<ol>'+names.map((n,i)=>'<li>'+(i+1)+'. '+n+'</li>').join('')+'</ol>':'<p>No drills selected yet</p>');}
}
function toggle(button){const info=readDraft();if(!info)return;const id=button.dataset.selectDrill,current=ids(info),on=current.includes(id),max=limit();if(!on&&current.length>=max)return;info.draft.selectedDrills=on?current.filter(x=>x!==id):[...current,id];info.draft.started=true;info.draft.plan=null;info.draft.clock=null;if(info.draft.steps)delete info.draft.steps.drills;if(writeDraft(info))redraw(info);}
function clear(){const info=readDraft();if(!info)return;info.draft.selectedDrills=[];info.draft.plan=null;info.draft.clock=null;if(info.draft.steps)delete info.draft.steps.drills;if(writeDraft(info))redraw(info);}
function prepareNext(){const info=readDraft();if(!info)return false;const selected=ids(info);if(selected.length!==limit())return false;sessionStorage.setItem('rp163-review-after-reload','1');location.hash='';location.reload();return true;}
document.addEventListener('click',e=>{
 const drill=e.target.closest?.('[data-select-drill]');if(drill){e.preventDefault();e.stopImmediatePropagation();toggle(drill);return;}
 const clearButton=e.target.closest?.('#clear-drills');if(clearButton){e.preventDefault();e.stopImmediatePropagation();clear();return;}
 const next=e.target.closest?.('[data-next="review"]');if(next&&document.querySelector('#drill-picker')){e.preventDefault();e.stopImmediatePropagation();prepareNext();}
},true);
// After the one intentional reload, core state now contains the saved selections.
// Move to Review with the native bottom-nav button so validation/building remain core-owned.
if(sessionStorage.getItem('rp163-review-after-reload')==='1'){
 sessionStorage.removeItem('rp163-review-after-reload');
 addEventListener('DOMContentLoaded',()=>setTimeout(()=>document.querySelector('.bottom-nav [data-view="review"]')?.click(),250),{once:true});
}
