// Build 318: correct coach display name and lightly normalize the portal after render.
import {accountContext} from './account-model-rp276.mjs?v=rp276';
import {coachIdentity} from './coach-identity-rp276.mjs?v=rp276';

let first='Coach',full='Coach';
function cleanName(ctx){
 const rosterCoach=coachIdentity(ctx?.user?.email||'');
 const candidate=rosterCoach?.name||ctx?.account?.displayName||ctx?.user?.displayName||'';
 if(candidate&&candidate.includes('@'))return {first:'Coach',full:'Coach'};
 const trimmed=String(candidate||'Coach').trim();
 return {first:trimmed.split(/\s+/)[0]||'Coach',full:trimmed||'Coach'};
}
function apply(){
 const greeting=document.querySelector('.coach-greeting h1');
 if(greeting)greeting.textContent='Hi, '+first;
 const practiceName=document.querySelector('.personal-coach-eyebrow');
 if(practiceName&&full!=='Coach')practiceName.textContent=full.toUpperCase();
}
(async()=>{
 try{const ctx=await accountContext();({first,full}=cleanName(ctx));}catch{}
 apply();
 const observer=new MutationObserver(apply);
 observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
