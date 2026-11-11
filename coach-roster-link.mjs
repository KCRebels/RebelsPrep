// Development-only entry point. The roster manager checks signed-in coach permissions again.
import {accountContext,isCoach} from './account-model-rp276.mjs?v=rp276';
const app=document.getElementById('app');
let authorized=false,queued=false;
function install(){
 if(!authorized||!app)return;
 for(const stack of app.querySelectorAll('.coach-portal-home .coach-card-stack,.coach-portal-page .coach-card-stack')){
  if(stack.querySelector('[data-roster-link]'))continue;
  const link=document.createElement('a');
  link.className='coach-card';
  link.dataset.rosterLink='1';
  link.href='./roster-manager.html';
  link.innerHTML='<div class="eyebrow">TEAM ADMINISTRATION</div><h2>Manage Roster</h2><p>Add, edit or remove permanent players on your team.</p>';
  stack.appendChild(link);
 }
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;install();});}
(async()=>{try{const ctx=await accountContext();authorized=isCoach(ctx.account);}catch{authorized=false;}queue();if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});})();
