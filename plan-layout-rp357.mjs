// Build 362: authoritative built-practice layout. This module alone owns the visible
// PRACTICE OVERVIEW / PRACTICE STATUS labels and keeps Practice Status directly
// under the overview box.
const app=document.getElementById('app');
let frame=0;

function ensureStyle(){
 if(document.getElementById('rp362-plan-layout-style'))return;
 document.getElementById('rp357-plan-layout-style')?.remove();
 const style=document.createElement('style');
 style.id='rp362-plan-layout-style';
 style.textContent=`
  #app .practice-hero::before,
  #app #rp362-practice-status::before{
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
  #app .practice-hero::before{content:'PRACTICE OVERVIEW';margin-bottom:10px!important}
  #app #rp362-practice-status::before{content:'PRACTICE STATUS'}
  #app #rp362-practice-status>.rp-practice-status-title-fixed,
  #app #rp362-practice-status>.rp-section-label,
  #app #rp362-practice-status>h2{display:none!important}
  #app[data-practice-view="plan"] .rp-section-label,
  #app[data-practice-view="review"] .rp-section-label,
  #app[data-practice-view="plan"] .drill-category,
  #app[data-practice-view="review"] .drill-category{
   margin:0 0 7px!important;
   color:#b51f2e!important;
   font-size:14px!important;
   font-weight:900!important;
   letter-spacing:.12em!important;
   text-transform:uppercase!important;
   line-height:1.2!important;
  }
 `;
 document.head.appendChild(style);
}

function statusPanel(){
 const controls=app?.querySelector('#activate-shared,#coach-logout,#practice-status-coach-signin');
 if(controls)return controls.closest('section.panel');
 return [...(app?.querySelectorAll('section.panel')||[])].find(panel=>{
  const h=panel.querySelector(':scope > h2');
  return /^(Shared Practice|Practice Status)$/i.test((h?.textContent||'').trim());
 })||null;
}

function mount(){
 ensureStyle();
 const hero=app?.querySelector('.practice-hero');
 if(!hero)return;
 const panel=statusPanel();
 if(!panel)return;
 panel.id='rp362-practice-status';
 // The title is rendered with ::before so no other observer can delete it.
 panel.querySelectorAll(':scope > .rp-practice-status-title-fixed,:scope > .rp-section-label').forEach(el=>el.remove());
 const heading=panel.querySelector(':scope > h2');
 if(heading)heading.style.setProperty('display','none','important');
 // Keep Practice Status immediately after the big overview/timer box.
 if(hero.nextElementSibling!==panel)hero.after(panel);
}

function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
ensureStyle();
schedule();
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view']});
window.addEventListener('pageshow',schedule);
window.addEventListener('load',schedule);
// Small safety check for async shared-practice/auth renders. It does not rewrite content;
// it only restores the intended order if another render places the status box elsewhere.
setInterval(()=>{if(app?.querySelector('.practice-hero'))mount();},750);
