// Build 162: device-safe repair for stale shared drafts on the iPhone Home Screen app.
// This deliberately owns only Start Over and drill-card selection. The core planner still owns validation/building.
const KEY='RebelsPrep:coach-pilot:1';
const TEAM_PREFIX=KEY+':team:';
const RESUME_PREFIX=KEY+':resume:';

function activeKey(){
 const id=localStorage.getItem(KEY+':active-team');
 return id?TEAM_PREFIX+id:null;
}
function readDraft(){
 try{
  const key=activeKey();
  if(!key)return null;
  const raw=localStorage.getItem(key)||localStorage.getItem(KEY);
  return raw?{key,draft:JSON.parse(raw)}:null;
 }catch{return null;}
}
function writeDraft(info){
 try{localStorage.setItem(info.key,JSON.stringify(info.draft));return true;}catch{return false;}
}
function drillLimit(){
 const text=(document.querySelector('#picker-instruction')?.textContent||'')+' '+(document.querySelector('#selection-summary')?.textContent||'');
 const m=text.match(/(?:exactly|of)\s+(\d+)/i);
 return m?Number(m[1]):null;
}
function selectedStationIds(draft){return Array.isArray(draft?.selectedDrills)?draft.selectedDrills:[];}
function repairDrillClick(button){
 const info=readDraft();if(!info)return false;
 const id=button.dataset.selectDrill;if(!id)return false;
 const selected=selectedStationIds(info.draft);
 const already=selected.includes(id);
 const limit=drillLimit();
 if(!already&&button.disabled)return true;
 if(!already&&Number.isFinite(limit)){
  const selectedButtons=[...document.querySelectorAll('[data-select-drill][aria-pressed="true"]')].length;
  if(selectedButtons>=limit)return true;
 }
 info.draft.selectedDrills=already?selected.filter(x=>x!==id):[...selected,id];
 info.draft.started=true;info.draft.plan=null;info.draft.clock=null;
 if(info.draft.steps)delete info.draft.steps.drills;
 if(!writeDraft(info))return true;
 // Reload exactly once for this intentional tap so the core in-memory state is rebuilt from the saved draft.
 location.hash='rp-drills';
 location.reload();
 return true;
}
function clearAllDrafts(){
 try{
  const teamKeys=[];
  for(let i=0;i<localStorage.length;i++){
   const k=localStorage.key(i);if(k?.startsWith(TEAM_PREFIX))teamKeys.push(k);
  }
  for(const k of teamKeys){
   try{
    const d=JSON.parse(localStorage.getItem(k)||'{}');
    d.started=false;d.practiceType='';d.steps={};d.included=[];d.coachIds=[];d.selectedDrills=[];d.drillStationTarget=null;d.adjustments={};d.guests=[];d.allowReplacements=false;d.plan=null;d.clock=null;
    localStorage.setItem(k,JSON.stringify(d));
   }catch{localStorage.removeItem(k);}
  }
  for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k?.startsWith(RESUME_PREFIX))localStorage.removeItem(k);}
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY+':active-team');
  sessionStorage.removeItem('rp157-drill-cleared');
  sessionStorage.removeItem('rp156-drill-repair');
 }catch{}
 location.hash='';location.reload();
}

document.addEventListener('click',event=>{
 const drill=event.target.closest?.('[data-select-drill]');
 if(drill){event.preventDefault();event.stopImmediatePropagation();repairDrillClick(drill);return;}
 const start=event.target.closest?.('#start-over,#rp-global-start');
 if(start){event.preventDefault();event.stopImmediatePropagation();if(confirm('Start over and clear this practice draft?'))clearAllDrafts();}
},true);
