// Build 344: one coach dashboard; My Practice opens the live coach assignment when active and the builder when inactive.
import {accountContext,services,watchAccount,isCoach} from './account-model-rp276.mjs?v=rp276';
import {builderAccess,builderHref} from './builder-access-rp342.mjs?v=rp344';

let email='';
let frame=0;
let accountStop=null;
let routedPractice=false;
const routePractice=new URLSearchParams(location.search).has('practice');
const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(decorate);};

function currentAccess(){return builderAccess(email);}
function hasActivePractice(){return document.body.classList.contains('rp-coach-has-active-practice');}
function ensureBuilderReturn(access){
 const page=document.querySelector('.coach-portal-page');
 const shell=page?.querySelector('.personal-coach-shell');
 let row=page?.querySelector('.rp-active-builder-actions');
 if(!shell||!access.builder){row?.remove();return;}
 if(!row){
  row=document.createElement('div');
  row.className='actions rp-active-builder-actions';
  const link=document.createElement('a');
  link.className='primary';
  link.textContent='Back to Builder';
  row.appendChild(link);
  page.appendChild(row);
 }
 const link=row.querySelector('a');
 const href=builderHref(email);
 if(link&&href&&link.getAttribute('href')!==href)link.setAttribute('href',href);
}
function decorate(){
 const access=currentAccess();
 const active=hasActivePractice();
 const tile=document.querySelector('.coach-card[data-coach-view="practice"]');
 if(tile){
  const eyebrow=tile.querySelector('.eyebrow');
  const copy=tile.querySelector('p');
  if(active){
   delete tile.dataset.builderPractice;
   if(eyebrow&&eyebrow.textContent!=='PRACTICE')eyebrow.textContent='PRACTICE';
   const text='See your active practice, current station, players and drill instructions.';
   if(copy&&copy.textContent!==text)copy.textContent=text;
  }else if(access.builder){
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
 ensureBuilderReturn(access);
 if(routePractice&&!routedPractice&&active&&tile){
  routedPractice=true;
  tile.click();
 }
}

function builderClick(event){
 const target=event.target.closest?.('[data-coach-view="practice"]');
 if(!target)return;
 if(hasActivePractice())return;
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
