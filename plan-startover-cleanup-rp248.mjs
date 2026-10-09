// Build 250: Start Over belongs in the builder only, never on a built/ready/live practice.
function activeView(){return document.querySelector('#app')?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function builtPractice(){
  const view=activeView();
  return view==='plan'||view==='active'||!!document.querySelector('#activate-practice,#start-practice,#active-practice,[data-practice-ready]');
}
function clean(){
  if(!builtPractice())return;
  document.querySelectorAll('#rp-global-nav,#rp-global-start,#rp-home-start-over,#start-over').forEach(el=>el.remove());
}
window.addEventListener('load',clean);
window.addEventListener('hashchange',()=>setTimeout(clean,0));
new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view','aria-current']});
setInterval(clean,150);
setTimeout(clean,0);
