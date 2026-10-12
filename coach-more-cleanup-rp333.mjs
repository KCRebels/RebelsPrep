// Build 333: keep More coach-focused; admin-only account management and quiet sign-out utility.
import {accountContext,isOrgCoach} from './account-model-rp276.mjs?v=rp276';
const app=document.getElementById('app');
let ctx=null,queued=false;
function norm(v){return String(v||'').trim().toLowerCase();}
function canManageAccounts(){
 const account=ctx?.account||{};
 const display=norm(account.displayName||ctx?.user?.displayName||'');
 // Dan is the current account administrator. Future designated admins can be enabled
 // by setting accountAdmin=true on their RebelsPrep account record.
 return account.accountAdmin===true||display==='dan lickel';
}
function patch(){
 const actions=app?.querySelector('.coach-portal-page .coach-portal-actions');
 if(!actions)return;
 actions.classList.add('coach-more-utilities');
 const signout=actions.querySelector('#coach-account-signout');
 if(signout){signout.classList.add('coach-signout-utility');signout.textContent='Sign Out';}
 const links=[...actions.querySelectorAll('a')];
 const builder=links.find(a=>/back to builder/i.test(a.textContent||''));
 if(builder){builder.classList.add('coach-builder-utility');if(!isOrgCoach(ctx?.account))builder.remove();}
 const accounts=links.find(a=>/player and coach accounts/i.test(a.textContent||''));
 if(accounts){
  if(canManageAccounts())accounts.classList.add('coach-admin-utility');
  else accounts.remove();
 }
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;patch();});}
(async()=>{try{ctx=await accountContext();}catch{}schedule();if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});})();
