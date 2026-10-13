// Build 347: correct builder Back label and keep exactly one working Start Over control on Teams.
const app=document.getElementById('app');
const KEY='RebelsPrep:coach-pilot:1';
let frame=0;
let resumed=false;

function activeView(){
 return app?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';
}
function clearDraftStorage(){
 try{
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
   const k=localStorage.key(i);
   if(k&&(k===KEY||k===KEY+':active-team'||k.startsWith(KEY+':resume:')||k.startsWith(KEY+':team:')))keys.push(k);
  }
  keys.forEach(k=>localStorage.removeItem(k));
  ['rp156-drill-repair','rp157-drill-cleared','rp163-review-after-reload','rp170-review-after-reload','rp171-review-after-reload','rp199-pending-drills'].forEach(k=>sessionStorage.removeItem(k));
 }catch{}
}
function ensureStyle(){
 if(document.getElementById('rp347-builder-nav-style'))return;
 const style=document.createElement('style');
 style.id='rp347-builder-nav-style';
 style.textContent=`
  #rp-home-start-wrap,#rp-home-start-over-placeholder{display:none!important}
  #rp-global-nav{display:none!important}
 `;
 document.head.appendChild(style);
}
function fixBackLabel(){
 const back=document.getElementById('rp-context-back');
 if(back&&/back to home/i.test(back.textContent||''))back.textContent='← Back to Teams';
}
function hasSavedDraft(){
 return !!document.querySelector('[data-resume-team]');
}
function fixTeamsStartOver(){
 const old=document.getElementById('rp347-home-start-over');
 if(activeView()!=='home'||!hasSavedDraft()){old?.remove();return;}
 const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 let start=old;
 if(!start){
  start=document.createElement('button');
  start.type='button';
  start.id='rp347-home-start-over';
  start.textContent='Start Over';
  start.className='rp-home-secondary-286';
  start.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   if(!confirm('Start over and clear this practice draft?'))return;
   clearDraftStorage();
   location.replace('./?build=1&fresh='+Date.now());
  },true);
 }
 if(start.parentElement!==actions)actions.appendChild(start);
 document.querySelectorAll('#rp-home-start-wrap,#rp-global-nav,#rp-home-start-over-placeholder').forEach(el=>el.remove());
}
function handleResume(e){
 const button=e.target.closest?.('[data-resume-team]');
 if(!button)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const teamId=button.dataset.resumeTeam;
 if(!teamId)return;
 let draftId=teamId;
 try{draftId=localStorage.getItem(KEY+':resume:'+teamId)||teamId;localStorage.setItem(KEY+':active-team',draftId);}catch{}
 location.assign('./?build=1&resumeTeam='+encodeURIComponent(teamId)+'&r='+Date.now());
}
function resumeAfterReload(){
 if(resumed)return;
 const q=new URLSearchParams(location.search),teamId=q.get('resumeTeam');
 if(!teamId)return;
 const setup=document.querySelector('.bottom-nav [data-view="setup"]');
 if(!setup)return;
 resumed=true;
 setup.click();
 q.delete('resumeTeam');q.delete('r');
 const next='./?'+q.toString();
 try{history.replaceState(history.state,'',next);}catch{}
}
function mount(){
 ensureStyle();
 fixBackLabel();
 fixTeamsStartOver();
 resumeAfterReload();
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}

if(app){
 document.addEventListener('click',handleResume,true);
 new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',schedule,true);
 setInterval(schedule,500);
 schedule();
}
