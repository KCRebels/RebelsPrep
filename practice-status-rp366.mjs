// Build 366: one narrow owner for the built-practice Practice Status box.
// Do not move the box and do not move/replace Activate Practice.
const app=document.getElementById('app');

function ensureStyle(){
 if(document.getElementById('rp366-practice-status-style'))return;
 const style=document.createElement('style');
 style.id='rp366-practice-status-style';
 style.textContent=`
  #app .rp366-practice-status::before{
   content:'PRACTICE STATUS';
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
  #app .rp366-practice-status>.rp363-section-title,
  #app .rp366-practice-status>.rp365-practice-status-title,
  #app .rp366-practice-status>.rp-practice-status-title-fixed,
  #app .rp366-practice-status>.rp359-status-label,
  #app .rp366-practice-status>.rp-section-label,
  #app .rp366-practice-status>h2{display:none!important}
 `;
 document.head.appendChild(style);
}

function repair(){
 ensureStyle();
 const activate=app?.querySelector('#activate-shared');
 if(!activate)return;
 const panel=activate.closest('section.panel,.panel')||activate.parentElement;
 if(!panel)return;
 panel.classList.add('rp366-practice-status');

 let mine=panel.querySelector('#practice-status-coach-signin')||app.querySelector('#practice-status-coach-signin');
 if(!mine){
  mine=document.createElement('button');
  mine.id='practice-status-coach-signin';
  mine.type='button';
  mine.textContent='My Practice';
  mine.className='rp-status-secondary-292';
 }
 mine.onclick=()=>location.assign('./coach.html?v=366&practice=1');

 // Keep My Practice in the exact same control row as Activate Practice.
 // Never re-parent or replace Activate Practice itself.
 const row=activate.parentElement;
 if(row&&mine.parentElement!==row)activate.insertAdjacentElement('afterend',mine);
 else if(row&&activate.nextElementSibling!==mine)activate.insertAdjacentElement('afterend',mine);
}

let frame=0;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(repair);}
ensureStyle();
schedule();
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('load',schedule);
