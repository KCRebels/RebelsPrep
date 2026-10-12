/* Build 324: HotB-style coach bottom nav with icons, compact spacing, and active red state. */
const app=document.getElementById('app');
const icons={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9.5h-6v-6h-5v6h-6z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
 practice:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5.8 7.6c2.1 1 3.8 2.7 4.8 4.8m7.6-4.8c-2.1 1-3.8 2.7-4.8 4.8m-7.6 4c2.1-1 3.8-2.7 4.8-4.8m7.6 4c-2.1-1-3.8-2.7-4.8-4.8" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>',
 focus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
 drills:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 8h7.6M8.2 12h7.6M8.2 16h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
function label(button,key,text){button.classList.add('coach-nav-item');button.innerHTML='<span class="coach-nav-icon">'+icons[key]+'</span><span class="coach-nav-label">'+text+'</span>';}
function syncActive(nav){
 const title=app?.querySelector('.coach-page-head h1')?.textContent?.trim()||'';
 const drills=nav.querySelector('[data-rp-drills="1"]');
 const more=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
 if(!drills||!more)return;
 if(title==='Drill Library'){
  nav.querySelectorAll('[aria-current="page"]').forEach(b=>b.removeAttribute('aria-current'));
  drills.setAttribute('aria-current','page');
 }else if(['Submit a Drill','New Hitting Drill Request','Ask the Library','More'].includes(title)){
  nav.querySelectorAll('[aria-current="page"]').forEach(b=>b.removeAttribute('aria-current'));
  more.setAttribute('aria-current','page');
 }
}
function patchNav(){
 const nav=app?.querySelector('.coach-bottom-nav');
 if(!nav)return;
 nav.classList.add('coach-bottom-nav-hotb');
 const home=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='home');
 const practice=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='practice');
 const focus=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='focus');
 const more=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
 if(home&&!home.querySelector('.coach-nav-icon'))label(home,'home','Home');
 if(practice&&!practice.querySelector('.coach-nav-icon'))label(practice,'practice','Practice');
 if(focus&&!focus.querySelector('.coach-nav-icon'))label(focus,'focus','Focus');
 if(more&&!more.querySelector('.coach-nav-icon'))label(more,'more','More');
 let drills=nav.querySelector('[data-rp-drills="1"]');
 if(!drills&&more){
  drills=document.createElement('button');drills.type='button';drills.dataset.rpDrills='1';
  label(drills,'drills','Drills');
  drills.addEventListener('click',()=>{
   const driver=[...nav.querySelectorAll('button')].find(b=>b.dataset.coachView==='more');
   if(!driver)return;
   const old=driver.dataset.coachView;driver.dataset.coachView='library';driver.click();driver.dataset.coachView=old;
  });
  nav.insertBefore(drills,more);
 }else if(drills&&!drills.querySelector('.coach-nav-icon'))label(drills,'drills','Drills');
 syncActive(nav);
}
if(app){
 const observer=new MutationObserver(()=>queueMicrotask(patchNav));observer.observe(app,{childList:true,subtree:true});patchNav();
}
