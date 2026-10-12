/* Build 328: keep coach nav inside #app so the portal's own bindings and HotB icon patch stay alive.
   Add visible Back controls and guard iOS edge-swipe without reparenting live navigation. */
const app=document.getElementById('app');
let handlingPop=false;

function onHome(){return !!app?.querySelector('.coach-portal-home');}

function patchBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(!back)return;
  back.textContent='← Back';
  back.setAttribute('aria-label','Back to previous coach portal screen');
}

function goPortalBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(back){back.click();return true;}
  return false;
}

function patch(){patchBack();}
if(app){
  new MutationObserver(()=>queueMicrotask(patch)).observe(app,{childList:true,subtree:true});
  patch();
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
    if(wasSecondary)queueMicrotask(goPortalBack);
    setTimeout(()=>{handlingPop=false;},80);
  });
}catch(_){ }
