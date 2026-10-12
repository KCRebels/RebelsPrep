// Build 298: normalize Home action controls after forward/back navigation; preserve Practice Status, drill Accept, and assignment title behavior.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;

function ensurePracticeStatusShortcut(){
 const sections=[...document.querySelectorAll('#app section.panel')];
 const sharedSection=sections.find(section=>[...section.querySelectorAll('h2')].some(h=>['Shared Practice','Practice Status'].includes(h.textContent.trim())));
 if(!sharedSection||!shared.allowed(user))return;

 let row=sharedSection.querySelector('.rp-practice-status-actions-292');
 if(!row){row=document.createElement('div');row.className='rp-practice-status-actions-292';}
 const activate=sharedSection.querySelector('#activate-shared');
 const signOut=sharedSection.querySelector('#coach-logout');
 let coach=sharedSection.querySelector('#practice-status-coach-signin');
 if(!coach){coach=document.createElement('button');coach.id='practice-status-coach-signin';coach.type='button';coach.onclick=()=>location.assign('./?coach=1');}
 coach.textContent='My Practice';
 row.replaceChildren();
 if(activate){activate.classList.add('rp-status-primary-292');coach.classList.remove('rp-status-primary-292');coach.classList.add('rp-status-secondary-292');row.append(activate,coach);}
 else if(signOut){coach.classList.remove('rp-status-secondary-292');coach.classList.add('rp-status-primary-292');signOut.classList.add('rp-status-secondary-292');row.append(coach,signOut);}
 else{coach.classList.remove('rp-status-secondary-292');coach.classList.add('rp-status-primary-292');row.append(coach);}
 if(row.parentElement!==sharedSection)sharedSection.appendChild(row);
 [...sharedSection.querySelectorAll('.actions')].forEach(a=>{if(a!==row&&!a.children.length)a.remove();});
}

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
 const continueBtn=onHome&&document.querySelector('#build-selected-teams');
 const actions=continueBtn?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('rp-home-actions-286');
 continueBtn.classList.add('rp-home-continue-286');

 // Find the one real Start Over action, then remove every duplicate left behind by a prior screen render.
 const startCandidates=[...document.querySelectorAll('button,a')].filter(el=>el!==continueBtn&&el.id!=='rp-home-start-over-placeholder'&&el.textContent.trim()==='Start Over');
 let start=startCandidates.find(el=>el.id==='start-over'&&!el.disabled)||startCandidates.find(el=>!el.disabled)||null;
 startCandidates.forEach(el=>{if(el!==start)el.remove();});

 let placeholder=document.getElementById('rp-home-start-over-placeholder');
 if(start){
  placeholder?.remove();
  start.classList.add('rp-home-secondary-286');
 }else{
  if(!placeholder){placeholder=document.createElement('button');placeholder.id='rp-home-start-over-placeholder';placeholder.type='button';placeholder.textContent='Start Over';placeholder.disabled=true;}
  placeholder.className='rp-home-secondary-286';
 }
 const startControl=start||placeholder;

 let coach=document.getElementById('my-practice-button');
 if(!coach){coach=document.createElement('button');coach.id='my-practice-button';coach.type='button';coach.onclick=()=>location.assign('./?coach=1');}
 coach.textContent=shared.allowed(user)?'My Practice':'Coach Sign In';
 coach.className='rp-home-secondary-286';

 let player=document.getElementById('player-signin-entry');
 if(!player){player=document.createElement('a');player.id='player-signin-entry';player.href='./?player=1';}
 player.textContent='Player Sign In';
 player.className='rp-home-secondary-286';

 // Exact Home layout every time Home is rendered: Continue, then the three secondary actions.
 actions.replaceChildren(continueBtn,coach,player,startControl);
 document.querySelectorAll('#personal-entry-actions').forEach(el=>el.remove());
}

function ensureAssignmentViewTitle(){
 const panel=document.querySelector('#rp-assignment-actions');
 if(!panel)return;
 let title=panel.querySelector('.rp-assignment-view-title');
 if(!title){title=document.createElement('p');title.className='rp-assignment-view-title';title.textContent='VIEW PRACTICE BY';panel.prepend(title);}
}

function mount(){ensureHomeActions();ensurePracticeStatusShortcut();syncAcceptDrills();ensureAssignmentViewTitle();}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','disabled']});
document.addEventListener('click',schedule,true);
schedule();
