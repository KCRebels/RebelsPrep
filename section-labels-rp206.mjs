// Build 362: consistent HotB-style section labels. Practice Status / Overview are
// owned only by plan-layout-rp357.mjs so generic labels cannot conflict with them.
const ID='rp206-section-label-style';
const rules=[
 {match:/practice settings|setup|practice details/i,label:'PRACTICE DETAILS'},
 {match:/attendance/i,label:'ATTENDANCE'},
 {match:/coach/i,label:'COACHES'},
 {match:/drills/i,label:'DRILL STATIONS'},
 {match:/check-?in/i,label:'CHECK-IN',hideHeading:true},
 {match:/practice plan|schedule|rotation/i,label:'PRACTICE PLAN'}
];
function css(){if(document.getElementById(ID))return;const s=document.createElement('style');s.id=ID;s.textContent=`
.rp-section-label{margin:0 0 7px!important;color:#b51f2e!important;font-size:14px!important;font-weight:900!important;letter-spacing:.12em!important;text-transform:uppercase!important;line-height:1.2!important}
#app .panel>.rp-section-label+ h2{margin-top:0!important}
#app .panel.rp-section-label-only>.rp-section-label+ h2{display:none!important}
`;document.head.appendChild(s);}
function ensureLabel(panel,label,heading,hideHeading=false){
 if(hideHeading&&!panel.classList.contains('rp-section-label-only'))panel.classList.add('rp-section-label-only');
 let p=panel.querySelector(':scope > .rp-section-label');
 if(!p){p=document.createElement('p');p.className='rp-section-label';p.textContent=label;heading?heading.before(p):panel.prepend(p);}
 else if(p.textContent!==label)p.textContent=label;
 return p;
}
function isPracticeStatus(panel){
 const h=panel.querySelector(':scope > h2');
 return panel.id==='rp362-practice-status'
  ||!!panel.querySelector('#activate-shared,#coach-logout,#practice-status-coach-signin')
  ||/^(Shared Practice|Practice Status)$/i.test((h?.textContent||'').trim());
}
function labelPanel(panel){
 if(panel.id==='rp-review-built-in-hotb'||panel.id==='rp-review-drills-hotb'||isPracticeStatus(panel))return;
 const h=panel.querySelector(':scope > h1,:scope > h2,:scope > h3');
 if(!h)return;
 const text=(h.textContent||'').trim();if(!text)return;
 const hit=rules.find(r=>r.match.test(text));if(!hit)return;
 ensureLabel(panel,hit.label,h,!!hit.hideHeading);
}
function mount(){css();document.querySelectorAll('#app section.panel,#app .panel').forEach(labelPanel);}
css();mount();
const app=document.getElementById('app');
if(app)new MutationObserver(()=>mount()).observe(app,{childList:true,subtree:true});
window.addEventListener('load',mount);
