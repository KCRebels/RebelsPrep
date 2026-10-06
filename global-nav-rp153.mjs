// Build 158: persistent Back + Start Over controls; Start Over fully clears the prior draft/resume state.
const KEY='RebelsPrep:coach-pilot:1';
function nativeStart(){return [...document.querySelectorAll('#start-over')].find(b=>b.offsetParent!==null);}
function clearDraft(){
 try{
  const active=localStorage.getItem(KEY+':active-team');
  const ids=new Set();
  if(active){
   const k=KEY+':team:'+active;
   const old=JSON.parse(localStorage.getItem(k)||'{}');
   for(const id of old.teamIds||[old.teamId||active])if(id)ids.add(id);
   localStorage.removeItem(k);
  }
  for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k?.startsWith(KEY+':resume:'))localStorage.removeItem(k);}
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY+':active-team');
  sessionStorage.removeItem('rp156-drill-repair');
 }catch{}
 location.hash='';location.reload();
}
function startOver(){const native=nativeStart();if(native){native.click();return;}if(!confirm('Start over and clear this practice draft?'))return;clearDraft();}
function back(){const portal=document.querySelector('#exit-my-practice');if(portal){portal.click();return;}const special=document.querySelector('#back-drills-attendance,#back-attendance-players');if(special){special.click();return;}const current=document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view;const previous={setup:'home',attendance:'setup',drills:'attendance',review:'drills',plan:'review',history:'home'}[current];if(previous){document.querySelector('.bottom-nav [data-view="'+previous+'"]')?.click();return;}if(history.length>1)history.back();else location.hash='';}
function bar(){let el=document.querySelector('#rp-global-nav');if(el)return el;el=document.createElement('div');el.id='rp-global-nav';el.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px;position:relative;z-index:9999';el.innerHTML='<button type="button" id="rp-global-back" style="font-weight:700;padding:10px 12px">← Back</button><button type="button" id="rp-global-start" style="font-weight:700;padding:10px 12px">Start Over</button>';el.querySelector('#rp-global-back').onclick=back;el.querySelector('#rp-global-start').onclick=startOver;return el;}
function mount(){const app=document.querySelector('#app');if(!app)return;const el=bar();if(el.parentElement!==app||app.firstElementChild!==el)app.prepend(el);el.hidden=false;el.style.display='grid';}
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>requestAnimationFrame(mount));
setInterval(mount,500);
mount();