// Home entry points for permanent personal accounts + active practice shortcut.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;

function ensurePracticeStatusShortcut(){
 const sections=[...document.querySelectorAll('#app section.panel')];
 const sharedSection=sections.find(section=>[...section.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Shared Practice'));
 if(!sharedSection||!shared.allowed(user))return;
 let actions=sharedSection.querySelector('.actions');
 if(!actions){
  actions=document.createElement('div');
  actions.className='actions rp-practice-status-actions';
  sharedSection.appendChild(actions);
 }
 if(!sharedSection.querySelector('#practice-status-coach-signin')){
  const b=document.createElement('button');
  b.id='practice-status-coach-signin';
  b.type='button';
  b.textContent='Coach Sign In';
  b.className='rp-practice-status-coach';
  b.onclick=()=>location.assign('./?coach=1');
  actions.appendChild(b);
 }
}

function ensureHomeActions(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('rp-home-actions-286');
 const continueBtn=actions.querySelector('#build-selected-teams');
 if(continueBtn)continueBtn.classList.add('rp-home-continue-286');

 // Prefer the app's real Start Over control whenever one exists.
 const nativeCandidates=[...document.querySelectorAll('button,a')].filter(el=>el!==continueBtn&&el.textContent.trim()==='Start Over'&&!el.disabled);
 let start=nativeCandidates.find(el=>el.id==='start-over')||nativeCandidates[0]||null;
 let placeholder=actions.querySelector('#rp-home-start-over-placeholder');
 if(start){
  if(placeholder)placeholder.remove();
  if(start.parentElement!==actions)actions.appendChild(start);
  start.classList.add('rp-home-secondary-286');
 }else{
  if(!placeholder){
   placeholder=document.createElement('button');
   placeholder.id='rp-home-start-over-placeholder';
   placeholder.type='button';
   placeholder.textContent='Start Over';
   placeholder.disabled=true;
   placeholder.className='rp-home-secondary-286';
   actions.appendChild(placeholder);
  }
  start=placeholder;
 }

 // Remove every extra Start Over from the home action area so only one remains.
 [...actions.querySelectorAll('button,a')].filter(el=>el!==start&&el.textContent.trim()==='Start Over').forEach(el=>el.remove());

 let coach=actions.querySelector('#my-practice-button');
 if(shared.allowed(user)&&!coach){
  coach=document.createElement('button');
  coach.id='my-practice-button';
  coach.type='button';
  coach.textContent='Coach Sign In';
  coach.className='rp-home-secondary-286';
  coach.onclick=()=>location.assign('./?coach=1');
  actions.appendChild(coach);
 }
 if(coach)coach.classList.add('rp-home-secondary-286');

 let player=actions.querySelector('#player-signin-entry');
 if(!player){
  player=document.createElement('a');
  player.id='player-signin-entry';
  player.href='./?player=1';
  player.textContent='Player Sign In';
  player.className='rp-home-secondary-286';
  actions.appendChild(player);
 }
 player.classList.add('rp-home-secondary-286');

 // Clean up prior build artifacts and any duplicated sign-in controls.
 document.querySelectorAll('#personal-entry-actions').forEach(el=>el.remove());
 [...document.querySelectorAll('#my-practice-button')].slice(1).forEach(el=>el.remove());
 [...document.querySelectorAll('#player-signin-entry')].slice(1).forEach(el=>el.remove());
}

function mount(){ensureHomeActions();ensurePracticeStatusShortcut();}
let frame;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});
schedule();
