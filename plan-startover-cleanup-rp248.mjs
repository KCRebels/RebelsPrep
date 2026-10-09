// Build 248: Start Over belongs in the builder, not on a built/ready/live practice.
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function clean(){
  const view=activeView();
  const built=view==='plan'||view==='active'||!!document.querySelector('#activate-practice,#start-practice,#active-practice');
  if(!built)return;
  const global=document.querySelector('#rp-global-nav');
  if(global)global.style.setProperty('display','none','important');
  const start=document.querySelector('#rp-global-start');
  if(start)start.style.setProperty('display','none','important');
}
window.addEventListener('load',clean);
window.addEventListener('hashchange',()=>setTimeout(clean,0));
new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});
setInterval(clean,500);
setTimeout(clean,0);
