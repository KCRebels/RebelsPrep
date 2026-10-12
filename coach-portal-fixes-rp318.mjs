// Build 319: correct coach display name without creating a render loop.
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
 const greetingText='Hi, '+first;
 if(greeting&&greeting.textContent!==greetingText)greeting.textContent=greetingText;
 const practiceName=document.querySelector('.personal-coach-eyebrow');
 const practiceText=full.toUpperCase();
 if(practiceName&&full!=='Coach'&&practiceName.textContent!==practiceText)practiceName.textContent=practiceText;
}
(async()=>{
 try{const ctx=await accountContext();({first,full}=cleanName(ctx));}catch{}
 apply();
 let queued=false;
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply();});
 });
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
