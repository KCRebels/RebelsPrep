// Build 365: stable My Practice helpers. Do not move or replace native Practice Status controls.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
const coachPortalHome='./coach.html?v=365';
const coachPortalPractice='./coach.html?v=365&practice=1';

function findSignOut(scope){
 const local=[...scope.querySelectorAll('button,a')].find(el=>/^sign\s*out$/i.test((el.textContent||'').trim()));
 if(local)return local;
 return [...document.querySelectorAll('#app button,#app a')].find(el=>/^sign\s*out$/i.test((el.textContent||'').trim())&&el.offsetParent!==null)||null;
}
function statusPanel(){
 const direct=document.querySelector('#activate-shared')?.closest('section.panel')
  ||document.querySelector('#practice-status-coach-signin')?.closest('section.panel')
  ||document.getElementById('rp363-practice-status');
 if(direct)return direct;
 return [...document.querySelectorAll('#app section.panel')].find(section=>[...section.querySelectorAll(':scope > h2')].some(h=>/^(Shared Practice|Practice Status)$/i.test((h.textContent||'').trim())))||null;
}
function ensurePracticeStatusTitle(section){
 let title=section.querySelector(':scope > .rp365-practice-status-title');
 if(!title){
  title=document.createElement('p');
  title.className='rp365-practice-status-title';
  section.prepend(title);
 }
 title.textContent='PRACTICE STATUS';
 Object.assign(title.style,{margin:'0 0 7px',padding:'0',color:'#b51f2e',fontSize:'14px',fontWeight:'900',letterSpacing:'.12em',textTransform:'uppercase',lineHeight:'1.2'});
 title.style.setProperty('display','block','important');
 title.style.setProperty('visibility','visible','important');
 title.style.setProperty('opacity','1','important');
 const heading=section.querySelector(':scope > h2');
 if(heading&&/^(Shared Practice|Practice Status)$/i.test((heading.textContent||'').trim()))heading.style.setProperty('display','none','important');
}
function ensurePracticeStatusShortcut(){
 const section=statusPanel();
 if(!section)return;
 ensurePracticeStatusTitle(section);
 const activate=section.querySelector('#activate-shared');
 let coach=section.querySelector('#practice-status-coach-signin');
 if(!coach){
  coach=document.createElement('button');
  coach.id='practice-status-coach-signin';
  coach.type='button';
  coach.textContent='My Practice';
  coach.className='rp-status-secondary-292';
  coach.onclick=()=>location.assign(coachPortalPractice);
  if(activate)activate.insertAdjacentElement('afterend',coach);
  else section.appendChild(coach);
 }
 // Never move or replace Activate Practice. Only make sure My Practice sits beside/after it.
 if(activate&&coach.previousElementSibling!==activate)activate.insertAdjacentElement('afterend',coach);
 const signOut=findSignOut(section);
 if(!activate&&signOut&&coach.nextElementSibling!==signOut)coach.insertAdjacentElement('afterend',signOut);
 ensurePracticeStatusTitle(section);
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
function mount(){ensureHomeActions();ensurePracticeStatusShortcut();syncAcceptDrills();ensureAssignmentViewTitle();}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{
 const home=e.target.closest?.('.bottom-nav [data-view="home"]');
 if(home){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();location.assign(coachPortalHome);return;}
 schedule();
},true);
schedule();
