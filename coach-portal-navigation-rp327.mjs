/* Build 327: keep coach navigation inside the coach portal, show a real Back button,
   and mount the bottom nav at the viewport root so it reaches the physical bottom. */
const app=document.getElementById('app');
let handlingPop=false;

function pageTitle(){return app?.querySelector('.coach-page-head h1')?.textContent?.trim()||'';}
function onHome(){return !!app?.querySelector('.coach-portal-home');}

function mountBottomNav(){
  const live=app?.querySelector('.coach-bottom-nav');
  if(!live)return;
  const old=[...document.body.children].find(el=>el.classList?.contains('coach-bottom-nav'));
  if(old&&old!==live)old.remove();
  document.body.appendChild(live);
}

function patchBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(!back)return;
  back.style.removeProperty('display');
  back.textContent='← Back';
  back.setAttribute('aria-label','Back to previous coach portal screen');
}

function goPortalBack(){
  const back=app?.querySelector('.coach-page-head .coach-back');
  if(back){
    /* The portal's own back control is intentionally used rather than browser
       history. That keeps coaches inside coach.html instead of returning to Builder. */
    back.click();
    return true;
  }
  return false;
}

function patch(){mountBottomNav();patchBack();}

if(app){
  new MutationObserver(()=>queueMicrotask(patch)).observe(app,{childList:true,subtree:true});
  patch();
}

/* iOS edge-swipe is browser Back. Keep one same-document guard entry armed.
   On secondary coach screens, a swipe now performs the visible portal Back action.
   On Coach Home, it stays in the coach portal instead of exposing Practice Builder. */
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
