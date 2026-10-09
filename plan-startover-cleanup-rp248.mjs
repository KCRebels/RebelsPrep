// Build 250: Start Over belongs in the builder only, never on a built/ready/live practice.
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function builtPractice(){
  const view=activeView();
  return view==='plan'||view==='active'||!!document.querySelector('#activate-practice,#start-practice,#active-practice,[data-practice-ready]');
}
function clean(){
  if(!builtPractice())return;
  document.querySelectorAll('#rp-global-nav,#rp-global-start,#rp-home-start-over').forEach(el=>{
    el.style.setProperty('display','none','important');
    el.setAttribute('aria-hidden','true');
  });
  // Defensive cleanup for a recreated/moved global Start Over button.
  document.querySelectorAll('button').forEach(button=>{
    if(button.textContent?.trim()==='Start Over'&&(button.id==='rp-global-start'||button.closest('#rp-global-nav'))){
      button.style.setProperty('display','none','important');
      button.setAttribute('aria-hidden','true');
    }
  });
}
window.addEventListener('load',clean);
window.addEventListener('hashchange',()=>setTimeout(clean,0));
new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','aria-current']});
setInterval(clean,150);
setTimeout(clean,0);
