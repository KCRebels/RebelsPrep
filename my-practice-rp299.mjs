// Build 341: stable home/account helpers + matching practice review labels without observer loops.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
const coachPortalUrl='./coach.html?v=341';
const sameElements=(parent,desired)=>{const current=[...parent.children];return current.length===desired.length&&current.every((el,i)=>el===desired[i]);};
function setChildren(parent,desired){if(!sameElements(parent,desired))parent.replaceChildren(...desired);}

function ensurePracticeStatusShortcut(){
 const sections=[...document.querySelectorAll('#app section.panel')];
 const sharedSection=sections.find(section=>[...section.querySelectorAll('h2')].some(h=>['Shared Practice','Practice Status'].includes(h.textContent.trim())));
 if(!sharedSection||!shared.allowed(user))return;
 let row=sharedSection.querySelector('.rp-practice-status-actions-292');
 if(!row){row=document.createElement('div');row.className='rp-practice-status-actions-292';}
 const activate=sharedSection.querySelector('#activate-shared');
 const signOut=sharedSection.querySelector('#coach-logout');
 let coach=sharedSection.querySelector('#practice-status-coach-signin');
 if(!coach){coach=document.createElement('button');coach.id='practice-status-coach-signin';coach.type='button';coach.onclick=()=>location.assign(coachPortalUrl);}
 if(coach.textContent!=='My Practice')coach.textContent='My Practice';
 let desired=[];
 if(activate){activate.classList.add('rp-status-primary-292');coach.classList.remove('rp-status-primary-292');coach.classList.add('rp-status-secondary-292');desired=[activate,coach];}
 else if(signOut){coach.classList.remove('rp-status-secondary-292');coach.classList.add('rp-status-primary-292');signOut.classList.add('rp-status-secondary-292');desired=[coach,signOut];}
 else{coach.classList.remove('rp-status-secondary-292');coach.classList.add('rp-status-primary-292');desired=[coach];}
 setChildren(row,desired);
 if(row.parentElement!==sharedSection)sharedSection.appendChild(row);
 [...sharedSection.querySelectorAll('.actions')].forEach(a=>{if(a!==row&&!a.children.length)a.remove();});
}
function syncAcceptDrills(){const button=document.querySelector('#accept-drills');const summary=document.querySelector('#selection-summary');if(!button||!summary)return;const match=summary.textContent.replace(/\s+/g,' ').trim().match(/(\d+)\s+of\s+(\d+)\s+station drills selected/i);const ready=!!match&&Number(match[1])===Number(match[2]);if(button.disabled===ready)button.disabled=!ready;const aria=String(!ready);if(button.getAttribute('aria-disabled')!==aria)button.setAttribute('aria-disabled',aria);button.classList.toggle('rp-accept-ready',ready);button.classList.toggle('rp-accept-waiting',!ready);}
function ensureHomeActions(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');if(!actions)return;
 actions.classList.add('rp-home-actions-286');
 const continueBtn=actions.querySelector('#build-selected-teams');if(continueBtn)continueBtn.classList.add('rp-home-continue-286');
 const realStarts=[...document.querySelectorAll('button,a')].filter(el=>el!==continueBtn&&el.id!=='rp-home-start-over-placeholder'&&el.textContent.trim()==='Start Over'&&!el.disabled);
 let start=realStarts.find(el=>el.id==='start-over')||realStarts[0]||null;for(const extra of realStarts){if(extra!==start)extra.remove();}
 let placeholder=actions.querySelector('#rp-home-start-over-placeholder');
 if(start){placeholder?.remove();start.classList.add('rp-home-secondary-286');}
 else if(!placeholder){placeholder=document.createElement('button');placeholder.id='rp-home-start-over-placeholder';placeholder.type='button';placeholder.textContent='Start Over';placeholder.disabled=true;placeholder.className='rp-home-secondary-286';}
 let coach=actions.querySelector('#my-practice-button');if(shared.allowed(user)&&!coach){coach=document.createElement('button');coach.id='my-practice-button';coach.type='button';coach.textContent='My Practice';coach.className='rp-home-secondary-286';coach.onclick=()=>location.assign(coachPortalUrl);}
 let player=actions.querySelector('#player-signin-entry');if(!player){player=document.createElement('a');player.id='player-signin-entry';player.href='./?player=1';player.textContent='Player Sign In';player.className='rp-home-secondary-286';}
 document.querySelectorAll('#personal-entry-actions').forEach(el=>el.remove());
 const desired=[continueBtn,coach,player,start||placeholder].filter(Boolean);setChildren(actions,desired);
}
function ensureAssignmentViewTitle(){const panel=document.querySelector('#rp-assignment-actions');if(!panel)return;let title=panel.querySelector('.rp-assignment-view-title');if(title&&title.tagName!=='P'){const p=document.createElement('p');p.className='rp-section-label rp-assignment-view-title';p.textContent='VIEW PRACTICE BY';title.replaceWith(p);return;}if(!title){title=document.createElement('p');title.className='rp-section-label rp-assignment-view-title';title.textContent='VIEW PRACTICE BY';panel.prepend(title);return;}if(!title.classList.contains('rp-section-label'))title.classList.add('rp-section-label');if(title.textContent!=='VIEW PRACTICE BY')title.textContent='VIEW PRACTICE BY';}
function mount(){ensureHomeActions();ensurePracticeStatusShortcut();syncAcceptDrills();ensureAssignmentViewTitle();}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',schedule,true);schedule();
