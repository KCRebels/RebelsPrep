// Build 159: persistent Back + Start Over. Start Over closes any published Ready/active practice, then clears all local resume state.
import * as shared from './shared-rp52.mjs?v=rpauth52';
const KEY='RebelsPrep:coach-pilot:1';
function clearLocal(){
 try{
  for(let i=localStorage.length-1;i>=0;i--){
   const k=localStorage.key(i);
   if(k===KEY||k===KEY+':active-team'||k?.startsWith(KEY+':resume:')||k?.startsWith(KEY+':team:'))localStorage.removeItem(k);
  }
  sessionStorage.removeItem('rp156-drill-repair');sessionStorage.removeItem('rp157-drill-cleared');
 }catch{}
}
async function closePublished(){
 const active=localStorage.getItem(KEY+':active-team');if(!active||!shared.configured)return;
 try{
  const directory=await shared.registry(active);
  if(directory?.clockToken){
   const done=await new Promise(async(resolve,reject)=>{let stop;try{stop=await shared.watchClock(directory.clockToken,(value)=>{const c=value?.clock;if(c?.done){stop?.();resolve(true);}else resolve(false);},reject);}catch(e){reject(e);}});
   if(!done)await shared.control(directory.clockToken,'done');
  }
 }catch(e){
  // If there is no readable published practice, local reset can still proceed. A real active
  // practice will be reconnected by the core app and remain protected rather than silently lost.
  console.warn('Start Over shared cleanup:',e);
 }
}
async function startOver(){
 if(!confirm('Start over and clear this practice draft?'))return;
 const button=document.querySelector('#rp-global-start');if(button){button.disabled=true;button.textContent='Starting Over…';}
 await closePublished();clearLocal();location.hash='';location.reload();
}
function back(){const portal=document.querySelector('#exit-my-practice');if(portal){portal.click();return;}const special=document.querySelector('#back-drills-attendance,#back-attendance-players');if(special){special.click();return;}const current=document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view;const previous={setup:'home',attendance:'setup',drills:'attendance',review:'drills',plan:'review',history:'home'}[current];if(previous){document.querySelector('.bottom-nav [data-view="'+previous+'"]')?.click();return;}if(history.length>1)history.back();else location.hash='';}
function bar(){let el=document.querySelector('#rp-global-nav');if(el)return el;el=document.createElement('div');el.id='rp-global-nav';el.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px;position:relative;z-index:9999';el.innerHTML='<button type="button" id="rp-global-back" style="font-weight:700;padding:10px 12px">← Back</button><button type="button" id="rp-global-start" style="font-weight:700;padding:10px 12px">Start Over</button>';el.querySelector('#rp-global-back').onclick=back;el.querySelector('#rp-global-start').onclick=startOver;return el;}
function mount(){const app=document.querySelector('#app');if(!app)return;const el=bar();if(el.parentElement!==app||app.firstElementChild!==el)app.prepend(el);el.hidden=false;el.style.display='grid';}
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>requestAnimationFrame(mount));setInterval(mount,500);mount();