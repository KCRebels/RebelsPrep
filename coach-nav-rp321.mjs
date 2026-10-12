/* Build 321: coach bottom nav = Home / My Practice / Player Focus / Drills / More. */
const app=document.getElementById('app');
function syncActive(nav){
 const title=app?.querySelector('.coach-page-head h1')?.textContent?.trim()||'';
 const drills=nav.querySelector('[data-rp-drills="1"]');
 const more=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
 if(!drills||!more)return;
 if(title==='Drill Library'){
  more.removeAttribute('aria-current');
  drills.setAttribute('aria-current','page');
 }else{
  drills.removeAttribute('aria-current');
 }
}
function patchNav(){
 const nav=app?.querySelector('.coach-bottom-nav');
 if(!nav)return;
 if(!nav.querySelector('[data-rp-drills="1"]')){
  const more=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
  if(!more)return;
  const drills=document.createElement('button');
  drills.type='button';
  drills.dataset.rpDrills='1';
  drills.innerHTML='<span>Drills</span>';
  drills.addEventListener('click',()=>{
   const driver=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
   if(!driver)return;
   driver.dataset.coachView='library';
   driver.click();
  });
  nav.insertBefore(drills,more);
 }
 syncActive(nav);
}
if(app){
 const observer=new MutationObserver(()=>queueMicrotask(patchNav));
 observer.observe(app,{childList:true,subtree:true});
 patchNav();
}
