// Build 367: single authoritative owner for the built-practice Practice Status box.
// Do not move the box. Do not replace native Activate Practice or Sign Out controls.
const app=document.getElementById('app');

function ensureStyle(){
 if(document.getElementById('rp367-practice-status-style'))return;
 document.getElementById('rp366-practice-status-style')?.remove();
 const style=document.createElement('style');
 style.id='rp367-practice-status-style';
 style.textContent=`
  #app #rp367-practice-status>.rp367-practice-status-title{
   display:block!important;
   visibility:visible!important;
   opacity:1!important;
   margin:0 0 7px!important;
   padding:0!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
  #app #rp367-practice-status>h2{display:none!important}
  #app #rp367-practice-status .actions{align-items:center!important}
 `;
 document.head.appendChild(style);
}

function findPanel(){
 if(!app)return null;
 const byId=app.querySelector('#rp367-practice-status');
 if(byId)return byId;
 const control=app.querySelector('#activate-shared,#coach-logout,#coach-login,#practice-status-coach-signin');
 if(control)return control.closest('section.panel,.panel');
 return [...app.querySelectorAll('section.panel,.panel')].find(panel=>/^(Shared Practice|Practice Status)$/i.test((panel.querySelector(':scope > h2')?.textContent||'').trim()))||null;
}

function ensureTitle(panel){
 let title=panel.querySelector(':scope > .rp367-practice-status-title');
 if(!title){
  title=document.createElement('p');
  title.className='rp367-practice-status-title';
  panel.prepend(title);
 }
 title.textContent='PRACTICE STATUS';
 const heading=panel.querySelector(':scope > h2');
 if(heading)heading.style.setProperty('display','none','important');
}

function ensureMyPractice(panel){
 const activate=panel.querySelector('#activate-shared');
 const signOut=panel.querySelector('#coach-logout');
 const login=panel.querySelector('#coach-login');
 if(login)return;
 let mine=panel.querySelector('#practice-status-coach-signin');
 if(!mine){
  mine=document.createElement('button');
  mine.id='practice-status-coach-signin';
  mine.type='button';
  mine.textContent='My Practice';
 }
 mine.onclick=()=>location.assign('./coach.html?v=367&practice=1');

 let row=activate?.closest('.actions')||signOut?.closest('.actions')||panel.querySelector(':scope > .actions');
 if(!row){
  row=document.createElement('div');
  row.className='actions';
  panel.appendChild(row);
 }

 if(activate){
  mine.className='rp-status-secondary-292';
  if(mine.parentElement!==row||activate.nextElementSibling!==mine)activate.insertAdjacentElement('afterend',mine);
 }else{
  mine.className='rp-status-primary-292';
  if(signOut){
   if(mine.parentElement!==row||signOut.previousElementSibling!==mine)signOut.insertAdjacentElement('beforebegin',mine);
  }else if(mine.parentElement!==row){
   row.prepend(mine);
  }
 }
}

function repair(){
 ensureStyle();
 const panel=findPanel();
 if(!panel)return;
 panel.id='rp367-practice-status';
 panel.classList.remove('rp366-practice-status');
 panel.querySelectorAll(':scope > .rp363-section-title,:scope > .rp365-practice-status-title,:scope > .rp-practice-status-title-fixed,:scope > .rp359-status-label,:scope > .rp-section-label').forEach(el=>el.remove());
 ensureTitle(panel);
 ensureMyPractice(panel);
}

let frame=0;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(repair);}
ensureStyle();
schedule();
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('load',schedule);
