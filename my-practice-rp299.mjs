// Build 367: stable My Practice helpers. Practice Status is owned only by practice-status-rp366.mjs.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
const coachPortalHome='./coach.html?v=367';
const coachPortalPractice='./coach.html?v=367&practice=1';

function syncAcceptDrills(){
 const button=document.querySelector('#accept-drills');
 const summary=document.querySelector('#selection-summary');
 if(!button||!summary)return;
 const match=summary.textContent.replace(/\s+/g,' ').trim().match(/(\d+)\s+of\s+(\d+)\s+station drills selected/i);
 const ready=!!match&&Number(match[1])===Number(match[2]);
 button.disabled=!ready;
 button.setAttribute('aria-disabled',String(!ready));
 button.classList.toggle('rp-accept-ready',ready);
 button.classList.toggle('rp-accept-waiting',!ready);
}
function ensureHomeActions(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('rp-home-actions-286');
 const continueBtn=actions.querySelector('#build-selected-teams');
 continueBtn?.classList.add('rp-home-continue-286');
 let coach=actions.querySelector('#my-practice-button');
 if(shared.allowed(user)&&!coach){
  coach=document.createElement('button');coach.id='my-practice-button';coach.type='button';coach.textContent='My Practice';coach.className='rp-home-secondary-286';coach.onclick=()=>location.assign(coachPortalPractice);actions.appendChild(coach);
 }
 let player=actions.querySelector('#player-signin-entry');
 if(!player){player=document.createElement('a');player.id='player-signin-entry';player.href='./?player=1';player.textContent='Player Sign In';player.className='rp-home-secondary-286';actions.appendChild(player);}
}
function ensureAssignmentViewTitle(){
 const panel=document.querySelector('#rp-assignment-actions');if(!panel)return;
 let title=panel.querySelector('.rp-assignment-view-title');
 if(!title){title=document.createElement('p');title.className='rp-section-label rp-assignment-view-title';title.textContent='VIEW PRACTICE BY';panel.prepend(title);}
}
function mount(){ensureHomeActions();syncAcceptDrills();ensureAssignmentViewTitle();}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{
 const home=e.target.closest?.('.bottom-nav [data-view="home"]');
 if(home){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();location.assign(coachPortalHome);return;}
 schedule();
},true);
schedule();
