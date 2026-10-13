// Build 369: keep the working Practice Status buttons and remove duplicate headings only.
const app=document.getElementById('app');

function ensureStyle(){
 document.getElementById('rp366-practice-status-style')?.remove();
 document.getElementById('rp367-practice-status-style')?.remove();
 document.getElementById('rp368-practice-status-style')?.remove();
 if(document.getElementById('rp369-practice-status-style'))return;
 const style=document.createElement('style');
 style.id='rp369-practice-status-style';
 style.textContent=`
  #app #rp367-practice-status>.rp369-practice-status-heading{
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
  #app #rp367-practice-status>.rp-practice-status-actions-292{
   display:grid!important;
   grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
   gap:10px!important;
   width:100%!important;
   align-items:stretch!important;
   margin-top:16px!important;
  }
  #app #rp367-practice-status>.rp-practice-status-actions-292>button{
   width:100%!important;
   min-width:0!important;
   max-width:none!important;
   height:62px!important;
   min-height:62px!important;
   max-height:62px!important;
   margin:0!important;
   padding:0 10px!important;
   display:flex!important;
   align-items:center!important;
   justify-content:center!important;
   box-sizing:border-box!important;
   border-radius:12px!important;
   font-family:Arial,sans-serif!important;
   font-size:16px!important;
   line-height:1.1!important;
   font-weight:800!important;
   letter-spacing:0!important;
   text-align:center!important;
   white-space:normal!important;
  }
 `;
 document.head.appendChild(style);
}

function findPanel(){
 if(!app)return null;
 const direct=app.querySelector('#rp367-practice-status');
 if(direct)return direct;
 const control=app.querySelector('#activate-shared,#coach-logout,#coach-login,#practice-status-coach-signin');
 if(control)return control.closest('section.panel,.panel');
 return [...app.querySelectorAll('section.panel,.panel')].find(panel=>/^(Shared Practice|Practice Status)$/i.test((panel.querySelector(':scope > h2')?.textContent||'').trim()))||null;
}

function ensureSingleHeading(panel){
 // Remove every legacy/direct heading that can render a second Practice Status title.
 [...panel.children].forEach(el=>{
  const text=(el.textContent||'').replace(/\s+/g,' ').trim();
  const legacy=el.matches('h1,h2,h3,.rp368-practice-status-heading,.rp367-practice-status-title,.rp363-section-title,.rp365-practice-status-title,.rp-practice-status-title-fixed,.rp359-status-label,.rp-section-label');
  if(legacy&&/^(Shared Practice|Practice Status)$/i.test(text))el.remove();
 });
 let heading=panel.querySelector(':scope > .rp369-practice-status-heading');
 if(!heading){
  heading=document.createElement('p');
  heading.className='rp369-practice-status-heading';
  panel.prepend(heading);
 }
 heading.textContent='PRACTICE STATUS';
 // If anything duplicated our exact replacement, keep only the first one.
 [...panel.querySelectorAll(':scope > .rp369-practice-status-heading')].slice(1).forEach(el=>el.remove());
}

function ensureButtons(panel){
 const login=panel.querySelector('#coach-login');
 if(login)return;
 const activate=panel.querySelector('#activate-shared');
 const signOut=panel.querySelector('#coach-logout');
 let mine=panel.querySelector('#practice-status-coach-signin')||app.querySelector('#practice-status-coach-signin');
 if(!mine){
  mine=document.createElement('button');
  mine.id='practice-status-coach-signin';
  mine.type='button';
  mine.textContent='My Practice';
 }
 mine.onclick=()=>location.assign('./coach.html?v=369&practice=1');

 let row=panel.querySelector(':scope > .rp-practice-status-actions-292');
 if(!row){
  row=document.createElement('div');
  row.className='rp-practice-status-actions-292';
  panel.appendChild(row);
 }

 if(activate){
  activate.classList.add('rp-status-primary-292');
  mine.className='rp-status-secondary-292';
  if(activate.parentElement!==row)row.appendChild(activate);
  if(mine.parentElement!==row)row.appendChild(mine);
 }else{
  mine.className='rp-status-primary-292';
  if(mine.parentElement!==row)row.appendChild(mine);
  if(signOut&&signOut!==mine&&signOut.parentElement!==row)row.appendChild(signOut);
 }
}

function repair(){
 ensureStyle();
 const panel=findPanel();
 if(!panel)return;
 panel.id='rp367-practice-status';
 panel.classList.remove('rp366-practice-status');
 ensureSingleHeading(panel);
 ensureButtons(panel);
}

let frame=0;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(repair);}
ensureStyle();
schedule();
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('load',schedule);
