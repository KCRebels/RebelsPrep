import {coaches} from './roster.mjs?v=rp103';

const KEY='RebelsPrep:coach-pilot:1';
let installedFor=null;

function selectedTeamIds(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const raw=localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY);
  if(raw){const d=JSON.parse(raw);if(Array.isArray(d.teamIds)&&d.teamIds.length)return d.teamIds;if(d.teamId)return [d.teamId];}
  return active.includes('+')?active.split('+'):[active];
 }catch{return ['kc-rebels-nationals'];}
}

function coachName(el){
 const text=(el.querySelector('span')?.textContent||el.textContent||'').trim();
 return coaches.find(c=>text.includes(c.name))?.name||text;
}

function enhance(){
 const heading=[...document.querySelectorAll('h1')].find(x=>x.textContent.includes('Attendance · Coaches'));
 if(!heading){installedFor=null;return;}
 const panel=heading.nextElementSibling;
 if(!panel||!panel.classList.contains('panel'))return;
 const people=panel.querySelector('.people');if(!people)return;
 const teamIds=selectedTeamIds();
 const sig=teamIds.slice().sort().join('|');
 if(installedFor===sig&&panel.querySelector('#coach-search'))return;
 installedFor=sig;
 let search=panel.querySelector('#coach-search');
 if(!search){
  const wrap=document.createElement('div');wrap.className='coach-search-wrap';wrap.style.margin='14px 0';
  wrap.innerHTML='<label style="display:block;font-weight:700">Find another Rebels coach<input id="coach-search" type="search" placeholder="Type a coach name…" autocomplete="off" style="box-sizing:border-box;width:100%;height:48px;margin-top:7px;font-size:16px;padding:0 12px"></label><p class="muted" id="coach-search-help" style="margin:6px 0 0">Your team’s coaches are shown below. Search to add a coach from another Rebels team.</p>';
  people.before(wrap);search=wrap.querySelector('#coach-search');
 }
 const rows=[...people.children];
 const draw=()=>{
  const q=search.value.trim().toLowerCase();
  let visible=0;
  for(const row of rows){
   const n=coachName(row);const c=coaches.find(x=>x.name===n);const home=Boolean(c?.teamIds?.some(id=>teamIds.includes(id)));const selected=Boolean(row.querySelector('input[type="checkbox"]')?.checked);
   const match=q&&n.toLowerCase().includes(q);
   row.hidden=q?!(match||selected):!(home||selected);
   if(!row.hidden)visible++;
   row.dataset.homeCoach=home?'true':'false';
  }
  const help=panel.querySelector('#coach-search-help');
  if(help)help.textContent=q?(visible?visible+' matching/selected coach'+(visible===1?'':'es')+'.':'No Rebels coaches match that search.'):'Your team’s coaches are shown below. Search to add a coach from another Rebels team.';
 };
 search.oninput=draw;draw();
}

new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
queueMicrotask(enhance);
