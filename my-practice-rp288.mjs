// Home/account helpers + active practice action layout + pitcher option order.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;

function ensurePracticeStatusShortcut(){
 const sections=[...document.querySelectorAll('#app section.panel')];
 const sharedSection=sections.find(section=>[...section.querySelectorAll('h2')].some(h=>['Shared Practice','Practice Status'].includes(h.textContent.trim())));
 if(!sharedSection||!shared.allowed(user))return;

 let coach=sharedSection.querySelector('#practice-status-coach-signin');
 if(!coach){
  coach=document.createElement('button');
  coach.id='practice-status-coach-signin';
  coach.type='button';
  coach.textContent='Coach Sign In';
  coach.className='rp-practice-status-coach';
  coach.onclick=()=>location.assign('./?coach=1');
 }

 const activate=sharedSection.querySelector('#activate-shared');
 let row=sharedSection.querySelector('.rp-practice-status-actions-288');
 if(!row){
  row=document.createElement('div');
  row.className='rp-practice-status-actions-288';
 }
 if(activate){
  activate.classList.add('rp-practice-status-activate-288');
  row.appendChild(activate);
 }
 row.appendChild(coach);

 // Place the row after the signed-in/status text and before any other content.
 const oldActions=[...sharedSection.querySelectorAll('.actions')].find(a=>a!==row&&a.contains(sharedSection.querySelector('#coach-logout')));
 if(oldActions && !oldActions.children.length) oldActions.remove();
 if(!row.parentElement) sharedSection.appendChild(row);
}

function reorderPitcherAdjustmentOptions(){
 const labels=[...document.querySelectorAll('#app label')];
 const live=labels.find(l=>l.textContent.replace(/\s+/g,' ').trim().includes('Available to pitch Live'));
 const warm=labels.find(l=>l.textContent.replace(/\s+/g,' ').trim().includes('Pitch warm-up required'));
 if(!live||!warm)return;
 const parent=live.parentElement;
 if(parent && warm.parentElement===parent && live.compareDocumentPosition(warm)&Node.DOCUMENT_POSITION_PRECEDING){
  parent.insertBefore(live,warm);
 }
}

function ensureHomeActions(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('rp-home-actions-286');
 const continueBtn=actions.querySelector('#build-selected-teams');
 if(continueBtn)continueBtn.classList.add('rp-home-continue-286');
 const nativeCandidates=[...document.querySelectorAll('button,a')].filter(el=>el!==continueBtn&&el.textContent.trim()==='Start Over'&&!el.disabled);
 let start=nativeCandidates.find(el=>el.id==='start-over')||nativeCandidates[0]||null;
 let placeholder=actions.querySelector('#rp-home-start-over-placeholder');
 if(start){
  if(placeholder)placeholder.remove();
  if(start.parentElement!==actions)actions.appendChild(start);
  start.classList.add('rp-home-secondary-286');
 }else if(!placeholder){
  placeholder=document.createElement('button');placeholder.id='rp-home-start-over-placeholder';placeholder.type='button';placeholder.textContent='Start Over';placeholder.disabled=true;placeholder.className='rp-home-secondary-286';actions.appendChild(placeholder);
 }
 let coach=actions.querySelector('#my-practice-button');
 if(shared.allowed(user)&&!coach){coach=document.createElement('button');coach.id='my-practice-button';coach.type='button';coach.textContent='Coach Sign In';coach.className='rp-home-secondary-286';coach.onclick=()=>location.assign('./?coach=1');actions.appendChild(coach);}
 let player=actions.querySelector('#player-signin-entry');
 if(!player){player=document.createElement('a');player.id='player-signin-entry';player.href='./?player=1';player.textContent='Player Sign In';player.className='rp-home-secondary-286';actions.appendChild(player);}
 document.querySelectorAll('#personal-entry-actions').forEach(el=>el.remove());
}

function mount(){ensureHomeActions();ensurePracticeStatusShortcut();reorderPitcherAdjustmentOptions();}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});
schedule();
