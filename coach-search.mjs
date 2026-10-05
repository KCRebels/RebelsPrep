import {coaches} from './roster.mjs?v=rp106';

const KEY='RebelsPrep:coach-pilot:1';
function selectedTeamIds(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const raw=localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY);
  if(raw){const d=JSON.parse(raw);if(Array.isArray(d.teamIds)&&d.teamIds.length)return d.teamIds;if(d.teamId)return [d.teamId];}
  return active.includes('+')?active.split('+'):[active];
 }catch{return ['kc-rebels-nationals'];}
}
function coachForRow(row){const text=(row.textContent||'').trim();return coaches.find(c=>text.includes(c.name));}
function coachPanel(){return document.querySelector('#staffing-guidance')?.closest('section.panel')||null;}
function enhance(){
 const panel=coachPanel();if(!panel)return;
 const people=panel.querySelector('.people');if(!people)return;
 const teamIds=selectedTeamIds();
 let wrap=panel.querySelector('.coach-search-wrap');
 if(!wrap){
  wrap=document.createElement('div');wrap.className='coach-search-wrap';wrap.style.margin='14px 0';
  wrap.innerHTML='<label style="display:block;font-weight:700">Find another Rebels coach<input id="coach-search" type="search" placeholder="Type a coach name…" autocomplete="off" style="box-sizing:border-box;width:100%;height:48px;margin-top:7px;font-size:16px;padding:0 12px"></label><p class="muted" id="coach-search-help" style="margin:6px 0 0">Showing coaches assigned to this team. Search above to add a coach from another Rebels team.</p>';
  people.before(wrap);
 }
 const search=panel.querySelector('#coach-search');if(!search)return;
 const draw=()=>{
  const q=search.value.trim().toLowerCase();let visible=0;
  for(const row of [...people.children]){
   const c=coachForRow(row);const home=Boolean(c?.teamIds?.some(id=>teamIds.includes(id)));
   const match=Boolean(q&&c?.name.toLowerCase().includes(q));
   // Team coaches only by default. A search temporarily reveals organization matches.
   // Do not let legacy saved "Select All" coach choices force every coach to stay visible.
   const show=q?match:home;
   row.hidden=!show;row.style.setProperty('display',show?'flex':'none','important');
   if(show)visible++;
  }
  const help=panel.querySelector('#coach-search-help');
  if(help)help.textContent=q?(visible?visible+' matching coach'+(visible===1?'':'es')+'.':'No Rebels coaches match that search.'):'Showing coaches assigned to this team. Search above to add a coach from another Rebels team.';
 };
 if(search.dataset.bound!=='true'){search.dataset.bound='true';search.addEventListener('input',draw);}
 draw();
}
new MutationObserver(()=>requestAnimationFrame(enhance)).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true});
queueMicrotask(enhance);
