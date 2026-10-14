import {selectionKey} from './team-selection.mjs?v=recovery78';

const KEY='RebelsPrep:coach-pilot:1';
const MARKER='rp373-team-continue';
let recovering=false;

function checkedTeams(){
 return [...document.querySelectorAll('[data-team-check]:checked')].map(el=>el.dataset.teamCheck).filter(Boolean);
}

function storeSelection(ids){
 const id=selectionKey(ids);
 const teamKey=KEY+':team:'+id;
 let saved={};
 try{saved=JSON.parse(localStorage.getItem(teamKey)||'{}')||{};}catch{}
 saved={...saved,teamId:id,teamIds:[...ids],started:true};
 localStorage.setItem(teamKey,JSON.stringify(saved));
 localStorage.setItem(KEY+':active-team',id);
 sessionStorage.setItem(MARKER,JSON.stringify({id,ids:[...ids],at:Date.now()}));
 return id;
}

function recoverIntoSetup(){
 let marker=null;
 try{marker=JSON.parse(sessionStorage.getItem(MARKER)||'null');}catch{}
 if(!marker?.id)return false;
 const app=document.getElementById('app');
 const view=app?.dataset?.practiceView||'';
 if(view==='setup'){
  sessionStorage.removeItem(MARKER);
  recovering=false;
  return true;
 }
 if(view!=='home')return false;
 const setup=document.querySelector('.bottom-nav [data-view="setup"]');
 if(!setup)return false;
 recovering=true;
 sessionStorage.removeItem(MARKER);
 setup.click();
 return true;
}

function interceptContinue(event){
 const button=event.target?.closest?.('#build-selected-teams');
 if(!button||button.disabled||recovering)return;
 const ids=checkedTeams();
 if(!ids.length)return;
 event.preventDefault();
 event.stopPropagation();
 event.stopImmediatePropagation();
 try{
  storeSelection(ids);
  recovering=true;
  const url=new URL(location.href);
  url.searchParams.set('_teamfix','373-'+Date.now());
  location.replace(url.toString());
 }catch(err){
  recovering=false;
  console.error('RebelsPrep team handoff recovery failed',err);
 }
}

document.addEventListener('click',interceptContinue,true);
const app=document.getElementById('app');
if(app)new MutationObserver(()=>recoverIntoSetup()).observe(app,{childList:true,subtree:true});
requestAnimationFrame(()=>recoverIntoSetup());
