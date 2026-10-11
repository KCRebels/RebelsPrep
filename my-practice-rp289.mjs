// Build 289: stable home/account helpers, active practice actions, dialog order, and nav-safe mounting.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;

function ensurePracticeStatusShortcut(){
 const sections=[...document.querySelectorAll('#app section.panel')];
 const sharedSection=sections.find(section=>[...section.querySelectorAll('h2')].some(h=>['Shared Practice','Practice Status'].includes(h.textContent.trim())));
 if(!sharedSection||!shared.allowed(user))return;

 let row=sharedSection.querySelector('.rp-practice-status-actions-289');
 if(!row){
  row=document.createElement('div');
  row.className='rp-practice-status-actions-289';
 }

 const activate=sharedSection.querySelector('#activate-shared');
 if(activate){
  activate.classList.add('rp-practice-status-activate-289');
  if(activate.parentElement!==row)row.appendChild(activate);
 }

 let coach=sharedSection.querySelector('#practice-status-coach-signin');
 if(!coach){
  coach=document.createElement('button');
  coach.id='practice-status-coach-signin';
  coach.type='button';
  coach.textContent='Coach Sign In';
  coach.className='rp-practice-status-coach-289';
  coach.onclick=()=>location.assign('./?coach=1');
 }
 if(coach.parentElement!==row)row.appendChild(coach);

 if(row.parentElement!==sharedSection)sharedSection.appendChild(row);

 // Remove empty action wrappers left behind after moving Activate Practice.
 [...sharedSection.querySelectorAll('.actions')].forEach(a=>{if(a!==row&&!a.children.length)a.remove();});
}

function reorderPitcherAdjustmentOptions(){
 const dialog=document.querySelector('#dialog');
 if(!dialog)return;
 const labels=[...dialog.querySelectorAll('label')];
 const live=labels.find(l=>l.textContent.replace(/\s+/g,' ').trim().includes('Available to pitch Live'));
 const warm=labels.find(l=>l.textContent.replace(/\s+/g,' ').trim().includes('Pitch warm-up required'));
 if(!live||!warm||live.parentElement!==warm.parentElement)return;
 const parent=live.parentElement;
 const children=[...parent.children];
 if(children.indexOf(live)>children.indexOf(warm))parent.insertBefore(live,warm);
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
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
schedule();
