/* Build 329: keep coach nav inside #app so portal bindings stay alive.
   Visible Back controls + iOS edge-swipe guard without reparenting navigation.
   IMPORTANT: only mutate Back text when it actually changes; the prior unconditional
   textContent assignment retriggered the MutationObserver forever on secondary pages. */
const app=document.getElementById('app');
let handlingPop=false;
let patchQueued=false;

function onHome(){return !!app?.querySelector('.coach-portal-home');}

function patchBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(!back)return;
  if(back.textContent!=='← Back')back.textContent='← Back';
  if(back.getAttribute('aria-label')!=='Back to previous coach portal screen'){
    back.setAttribute('aria-label','Back to previous coach portal screen');
  }
}

function goPortalBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(back){back.click();return true;}
  return false;
}

function patch(){patchQueued=false;patchBack();}
function schedulePatch(){
  if(patchQueued)return;
  patchQueued=true;
  requestAnimationFrame(patch);
}
if(app){
  new MutationObserver(schedulePatch).observe(app,{childList:true,subtree:true});
  schedulePatch();
}

/* Keep a same-document guard entry so an iPhone edge swipe stays inside Coach Portal.
   Secondary screens use the portal's own Back button; Coach Home remains on Coach Home. */
try{
  const state={...(history.state||{}),rpCoachPortal:true,rpCoachGuard:0};
  history.replaceState(state,'',location.href);
  history.pushState({...state,rpCoachGuard:1},'',location.href);
  addEventListener('popstate',()=>{
    if(handlingPop)return;
    handlingPop=true;
    const wasSecondary=!onHome();
    history.pushState({...state,rpCoachGuard:1},'',location.href);
    if(wasSecondary)requestAnimationFrame(goPortalBack);
    setTimeout(()=>{handlingPop=false;},100);
  });
}catch(_){ }
