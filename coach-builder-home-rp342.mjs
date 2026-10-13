// Build 342: one coach dashboard; My Practice routes builders into the planner.
import {accountContext,services,watchAccount,isCoach} from './account-model-rp276.mjs?v=rp276';
import {builderAccess,builderHref} from './builder-access-rp342.mjs?v=rp342';

let email='';
let frame=0;
let accountStop=null;
const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(decorate);};

function currentAccess(){return builderAccess(email);}
function decorate(){
 const access=currentAccess();
 const tile=document.querySelector('.coach-card[data-coach-view="practice"]');
 if(tile){
  const eyebrow=tile.querySelector('.eyebrow');
  const copy=tile.querySelector('p');
  if(access.builder){
   tile.dataset.builderPractice='1';
   if(eyebrow&&eyebrow.textContent!=='PRACTICE BUILDER')eyebrow.textContent='PRACTICE BUILDER';
   const text=access.full?'Click here to build a practice for any Rebels team.':'Click here to build your practice.';
   if(copy&&copy.textContent!==text)copy.textContent=text;
  }else{
   delete tile.dataset.builderPractice;
   if(eyebrow&&eyebrow.textContent!=='PRACTICE')eyebrow.textContent='PRACTICE';
   const text='Click here to see your current active practice.';
   if(copy&&copy.textContent!==text)copy.textContent=text;
  }
 }
 const href=access.builder?builderHref(email):'';
 document.querySelectorAll('.coach-portal-actions a').forEach(link=>{
  if(/back to builder/i.test(link.textContent||'')&&href&&link.getAttribute('href')!==href)link.setAttribute('href',href);
 });
}

function builderClick(event){
 const target=event.target.closest?.('[data-coach-view="practice"]');
 if(!target)return;
 const access=currentAccess();
 if(!access.builder)return;
 const href=builderHref(email);
 if(!href)return;
 event.preventDefault();
 event.stopPropagation();
 event.stopImmediatePropagation();
 location.assign(href);
}

document.addEventListener('click',builderClick,true);
const app=document.getElementById('app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});

(async()=>{
 try{
  const ctx=await accountContext();
  email=String(ctx?.user?.email||'').toLowerCase();
  if(isCoach(ctx?.account))schedule();
  accountStop=await watchAccount(async account=>{
   if(!isCoach(account)){schedule();return;}
   try{const {auth}=await services();email=String(auth.currentUser?.email||email).toLowerCase();}catch{}
   schedule();
  },schedule);
 }catch{schedule();}
})();
window.addEventListener('pagehide',()=>accountStop?.());
schedule();
