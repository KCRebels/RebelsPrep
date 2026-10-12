// Build 335: keep admin utilities on Coach Home without touching portal click handlers.
import {accountContext} from './account-model-rp276.mjs?v=rp276';
const app=document.getElementById('app');
let queued=false;
function norm(v){return String(v||'').trim().toLowerCase();}
function markAdminControls(){
 const actions=app?.querySelector('.coach-portal-home > .coach-portal-actions');
 if(!actions)return;
 actions.classList.add('rp-admin-home-actions');
 const signout=actions.querySelector('#coach-account-signout');
 if(signout)signout.classList.add('rp-admin-signout');
 for(const link of actions.querySelectorAll('a')){
  const text=norm(link.textContent);
  if(text.includes('back to builder'))link.classList.add('rp-admin-builder');
  if(text.includes('player')&&text.includes('coach')&&text.includes('account'))link.classList.add('rp-admin-accounts');
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;markAdminControls();});}
(async()=>{
 let ctx=null;
 try{ctx=await accountContext();}catch{}
 const account=ctx?.account||{};
 const display=norm(account.displayName||ctx?.user?.displayName||'');
 const admin=account.accountAdmin===true||display==='dan lickel';
 document.body.classList.toggle('rp-coach-admin',admin);
 document.body.classList.toggle('rp-coach-standard',!admin);
 schedule();
 if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
})();
