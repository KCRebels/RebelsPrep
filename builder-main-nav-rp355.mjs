// Build 356: use the exact coach-home bottom navigation throughout the builder.
// Keep the native builder nav hidden in the DOM for internal routing only.
const app=document.getElementById('app');
const icons={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9.5h-6v-6h-5v6h-6z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
 practice:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5.8 7.6c2.1 1 3.8 2.7 4.8 4.8m7.6-4.8c-2.1 1-3.8 2.7-4.8 4.8m-7.6 4c2.1-1 3.8-2.7 4.8-4.8m7.6 4c-2.1-1-3.8-2.7-4.8-4.8" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>',
 focus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
 drills:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 8h7.6M8.2 12h7.6M8.2 16h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
function item(key,label,url){return '<button type="button" class="coach-nav-item" data-rp-builder-destination="'+url+'"><span class="coach-nav-icon">'+icons[key]+'</span><span class="coach-nav-label">'+label+'</span></button>';}
function ensureStyle(){
 if(document.getElementById('rp356-main-nav-style'))return;
 const style=document.createElement('style');
 style.id='rp356-main-nav-style';
 style.textContent=`
  #app>.bottom-nav,.bottom-nav[aria-label="Practice planner"]{display:none!important}
  #rp356-coach-bottom-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;max-width:none!important;margin:0!important;transform:none!important;z-index:10000!important}
  #app{padding-bottom:96px!important}
 `;
 document.head.appendChild(style);
}
function ensureNav(){
 let nav=document.getElementById('rp356-coach-bottom-nav');
 if(nav)return;
 document.getElementById('rp355-coach-bottom-nav')?.remove();
 nav=document.createElement('nav');
 nav.id='rp356-coach-bottom-nav';
 nav.className='coach-bottom-nav coach-bottom-nav-hotb';
 nav.setAttribute('aria-label','Coach portal');
 nav.innerHTML=
  item('home','Home','./coach.html?v=356')+
  item('practice','Practice','./coach.html?v=356&practice=1')+
  item('focus','Focus','./coach.html?v=356&view=focus')+
  item('drills','Drills','./coach.html?v=356&view=library')+
  item('more','More','./coach.html?v=356&view=more');
 nav.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-rp-builder-destination]');
  if(!button)return;
  location.assign(button.dataset.rpBuilderDestination);
 });
 document.body.appendChild(nav);
}
function mount(){ensureStyle();ensureNav();}
mount();
if(app)new MutationObserver(mount).observe(app,{childList:true,subtree:true});
