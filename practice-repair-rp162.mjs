// Build 168: iPhone-safe drill selection. Nine station drills are required; Review navigation preserves the saved selections.
const KEY='RebelsPrep:coach-pilot:1';
const TEAM_PREFIX=KEY+':team:';
const TARGET=9;
function activeKey(){const id=localStorage.getItem(KEY+':active-team');return id?TEAM_PREFIX+id:null;}
function readDraft(){try{const key=activeKey();if(!key)return null;const raw=localStorage.getItem(key)||localStorage.getItem(KEY);return raw?{key,draft:JSON.parse(raw)}:null;}catch{return null;}}
function writeDraft(info){try{info.draft.drillStationTarget=TARGET;localStorage.setItem(info.key,JSON.stringify(info.draft));return true;}catch{return false;}}
function ids(info){return Array.isArray(info?.draft?.selectedDrills)?info.draft.selectedDrills:[];}
function redraw(info){
 const selected=ids(info),count=selected.length;
 const instruction=document.querySelector('#picker-instruction');if(instruction)instruction.innerHTML='<strong>REQUIRED: Choose exactly '+TARGET+' station drills.</strong>';
 document.querySelectorAll('[data-select-drill]').forEach(b=>{const on=selected.includes(b.dataset.selectDrill);b.disabled=!on&&count>=TARGET;b.setAttribute('aria-pressed',String(on));const row=b.closest('.drill-row');row?.classList.toggle('selected',on);row?.classList.toggle('unavailable',!on&&count>=TARGET);const mark=b.querySelector('.drill-row-mark');if(mark)mark.textContent=on?'✓':'+';});
 const s=document.querySelector('#selection-summary');if(s){const names=selected.map(id=>document.querySelector('[data-select-drill="'+CSS.escape(id)+'"] .drill-row-label strong')?.textContent).filter(Boolean);s.innerHTML='<strong>'+count+' of '+TARGET+' station drills selected</strong>'+(names.length?'<ol>'+names.map((n,i)=>'<li>'+(i+1)+'. '+n+'</li>').join('')+'</ol>':'<p>No drills selected yet</p>');}
 const next=document.querySelector('.picker-screen [data-next="review"]');if(next)next.disabled=count!==TARGET;
}
function toggle(button){const info=readDraft();if(!info)return;const id=button.dataset.selectDrill,current=ids(info),on=current.includes(id);if(!on&&current.length>=TARGET)return;info.draft.selectedDrills=on?current.filter(x=>x!==id):[...current,id];info.draft.started=true;info.draft.plan=null;info.draft.clock=null;if(info.draft.steps)delete info.draft.steps.drills;if(writeDraft(info))redraw(info);}
function clear(){const info=readDraft();if(!info)return;info.draft.selectedDrills=[];info.draft.plan=null;info.draft.clock=null;if(info.draft.steps)delete info.draft.steps.drills;if(writeDraft(info))redraw(info);}
function prepareNext(){const info=readDraft();if(!info||ids(info).length!==TARGET)return false;info.draft.steps={...(info.draft.steps||{}),drills:true};info.draft.started=true;if(!writeDraft(info))return false;sessionStorage.setItem('rp168-review-after-reload','1');location.hash='rp-drills';location.reload();return true;}
document.addEventListener('click',e=>{
 const drill=e.target.closest?.('[data-select-drill]');if(drill&&document.querySelector('#drill-picker')){e.preventDefault();e.stopImmediatePropagation();toggle(drill);return;}
 const clearButton=e.target.closest?.('#clear-drills');if(clearButton&&document.querySelector('#drill-picker')){e.preventDefault();e.stopImmediatePropagation();clear();return;}
 const next=e.target.closest?.('[data-next="review"]');if(next&&document.querySelector('#drill-picker')){e.preventDefault();e.stopImmediatePropagation();prepareNext();}
},true);
function finishReviewRoute(){if(sessionStorage.getItem('rp168-review-after-reload')!=='1')return;sessionStorage.removeItem('rp168-review-after-reload');let tries=0;const go=()=>{const review=document.querySelector('.bottom-nav [data-view="review"]');if(review){review.click();return;}if(++tries<20)setTimeout(go,50);};go();}
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const info=readDraft();if(info&&document.querySelector('#drill-picker'))redraw(info);});}).observe(document.documentElement,{childList:true,subtree:true});
finishReviewRoute();
