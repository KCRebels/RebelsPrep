// Build 360: authorize builder entry and keep team-only builders inside their assigned team scope.
import {services} from './account-model-rp276.mjs?v=rp276';
import {builderAccess} from './builder-access-rp342.mjs?v=rp355';

let access={builder:false,full:false,teamIds:[]};
let autoDone=false;
let frame=0;

export async function authorizeBuilderEntry(){
 try{
  const {auth}=await services();
  await auth.authStateReady();
  const email=String(auth.currentUser?.email||'').trim().toLowerCase();
  access=builderAccess(email);
  if(!auth.currentUser||!access.builder){location.replace('./coach.html?v=360');return false;}
  return true;
 }catch{
  location.replace('./coach.html?v=360');
  return false;
 }
}

function filterTeamCards(){
 if(access.full)return;
 const allowed=new Set(access.teamIds);
 document.querySelectorAll('[data-team-check]').forEach(input=>{
  const card=input.closest('.team-card');
  if(card)card.hidden=!allowed.has(input.dataset.teamCheck);
 });
}

function directToRoster(){
 if(autoDone||access.full||access.teamIds.length!==1)return;
 const q=new URLSearchParams(location.search);
 if(!q.has('attendance'))return;
 const teamId=access.teamIds[0];
 const app=document.getElementById('app');
 const view=app?.dataset.practiceView||'';
 if(view==='home'){
  const input=document.querySelector('[data-team-check="'+CSS.escape(teamId)+'"]');
  if(!input)return;
  if(!input.checked){input.click();return;}
  const go=document.getElementById('build-selected-teams');
  if(go&&!go.disabled){go.click();return;}
 }
 if(view==='setup'){
  const hitting=document.querySelector('[data-practice-type="Hitting"]');
  if(hitting&&hitting.getAttribute('aria-pressed')!=='true'){hitting.click();return;}
  const attendance=document.querySelector('.bottom-nav [data-view="attendance"]');
  if(attendance){autoDone=true;attendance.click();}
 }
 if(view==='attendance')autoDone=true;
}

function enforce(){filterTeamCards();directToRoster();}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(enforce);}

export function installBuilderScope(){
 const app=document.getElementById('app');
 if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 document.addEventListener('click',schedule,true);
 schedule();
}
