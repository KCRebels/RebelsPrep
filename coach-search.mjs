import {coaches} from './roster.mjs?v=rp118';

const KEY='RebelsPrep:coach-pilot:1';
function selectedTeamIds(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const raw=localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY);
  if(raw){const d=JSON.parse(raw);if(Array.isArray(d.teamIds)&&d.teamIds.length)return d.teamIds;if(d.teamId)return [d.teamId];}
  return active.includes('+')?active.split('+'):[active];
 }catch{return ['kc-rebels-nationals'];}
}
function activeDraft(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const storageKey=KEY+':team:'+active;
  const raw=localStorage.getItem(storageKey)||localStorage.getItem(KEY);
  return {active,storageKey,draft:raw?JSON.parse(raw):{teamId:active,teamIds:selectedTeamIds(),coachIds:[]}};
 }catch{return null;}
}
function saveCoachIds(ids){
 const info=activeDraft();if(!info)return false;
 info.draft.coachIds=[...new Set(ids)];info.draft.started=true;info.draft.plan=null;info.draft.clock=null;
 localStorage.setItem(info.storageKey,JSON.stringify(info.draft));localStorage.setItem(KEY+':active-team',info.active);return true;
}
function coachForRow(row){const text=(row.textContent||'').trim();return coaches.find(c=>text.includes(c.name));}
function coachPanel(){return document.querySelector('#staffing-guidance')?.closest('section.panel')||null;}
function teamCoaches(teamIds){return coaches.filter(c=>c.teamIds?.some(id=>teamIds.includes(id)));}
function selectedIds(){return activeDraft()?.draft?.coachIds||[];}
function setCheckboxes(people,ids){const chosen=new Set(ids);for(const el of people.querySelectorAll('input[data-coach]'))el.checked=chosen.has(el.dataset.include);}
function enhance(){
 const panel=coachPanel();if(!panel)return;
 const people=panel.querySelector('.people');if(!people)return;
 const teamIds=selectedTeamIds(),home=teamCoaches(teamIds),homeIds=new Set(home.map(c=>c.id));
 let wrap=panel.querySelector('.coach-search-wrap');
 if(!wrap){
  wrap=document.createElement('div');wrap.className='coach-search-wrap';wrap.style.margin='14px 0';
  wrap.innerHTML='<label style="display:block;font-weight:700">Find another Rebels coach<input id="coach-search" type="search" placeholder="Type a coach name…" autocomplete="off" style="box-sizing:border-box;width:100%;height:48px;margin-top:7px;font-size:16px;padding:0 12px"></label><p class="muted" id="coach-search-help" style="margin:6px 0 0"></p><div id="coach-selected-extras" style="margin-top:10px"></div>';
  people.before(wrap);
 }
 const search=panel.querySelector('#coach-search');if(!search)return;
 const count=panel.querySelector('h2 .count'),all=panel.querySelector('#all-coaches'),clear=panel.querySelector('#clear-coaches');
 const updateCount=()=>{if(count)count.textContent=selectedIds().length+' selected';};
 const updateExtras=()=>{
  const box=panel.querySelector('#coach-selected-extras');if(!box)return;
  const ids=new Set(selectedIds()),extras=coaches.filter(c=>ids.has(c.id)&&!homeIds.has(c.id));
  box.innerHTML=extras.length?'<p class="muted" style="margin:0 0 6px"><strong>Added from other teams:</strong> '+extras.map(c=>c.name).join(', ')+'</p>':'';
 };
 const draw=()=>{
  const q=search.value.trim().toLowerCase();let matches=0;const ids=new Set(selectedIds());
  for(const row of [...people.children]){
   const c=coachForRow(row),isHome=Boolean(c&&homeIds.has(c.id)),isSelected=Boolean(c&&ids.has(c.id)),match=Boolean(q&&c?.name.toLowerCase().includes(q));
   if(match&&!isHome)matches++;
   const show=isHome||isSelected||match;
   row.hidden=!show;row.style.setProperty('display',show?'flex':'none','important');
  }
  setCheckboxes(people,[...ids]);
  const help=panel.querySelector('#coach-search-help');
  if(help)help.textContent=q?(matches?matches+' matching outside-team coach'+(matches===1?'':'es')+' shown below with your team coaches.':'No additional Rebels coaches match that search. Your team coaches remain shown below.'):'Showing your team coaches plus any outside coaches you added. Search above to add another Rebels coach.';
  updateCount();updateExtras();
 };
 if(search.dataset.bound!=='true'){search.dataset.bound='true';search.addEventListener('input',draw);}
 if(people.dataset.coachBound!=='true'){
  people.dataset.coachBound='true';people.addEventListener('change',e=>{
   const el=e.target.closest('input[data-coach]');if(!el)return;
   e.preventDefault();e.stopImmediatePropagation();
   const ids=new Set(selectedIds());if(el.checked)ids.add(el.dataset.include);else ids.delete(el.dataset.include);
   if(saveCoachIds([...ids]))draw();
  },true);
 }
 if(all&&all.dataset.teamBound!=='true'){
  all.dataset.teamBound='true';all.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const current=selectedIds(),outside=current.filter(id=>!homeIds.has(id)),next=[...outside,...home.map(c=>c.id)];
   search.value='';if(saveCoachIds(next))draw();
  },true);
 }
 if(clear&&clear.dataset.teamBound!=='true'){
  clear.dataset.teamBound='true';clear.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();search.value='';if(saveCoachIds([]))draw();
  },true);
 }
 draw();
}
new MutationObserver(()=>requestAnimationFrame(enhance)).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true});
queueMicrotask(enhance);
