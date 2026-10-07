// Build 206: consistent HotB-style section labels across RebelsPrep. Presentation only.
const ID='rp206-section-label-style';
const rules=[
 {match:/practice settings|setup|practice details/i,label:'PRACTICE DETAILS'},
 {match:/attendance/i,label:'ATTENDANCE'},
 {match:/coach/i,label:'COACHES'},
 {match:/drills/i,label:'DRILL STATIONS'},
 {match:/practice status|shared practice/i,label:'PRACTICE STATUS'},
 {match:/check-?in/i,label:'CHECK-IN'},
 {match:/practice plan|schedule|rotation/i,label:'PRACTICE PLAN'}
];
function css(){if(document.getElementById(ID))return;const s=document.createElement('style');s.id=ID;s.textContent=`
.rp-section-label{margin:0 0 7px!important;color:#b51f2e!important;font-size:14px!important;font-weight:900!important;letter-spacing:.12em!important;text-transform:uppercase!important;line-height:1.2!important}
#app .panel>.rp-section-label+ h2{margin-top:0!important}
`;document.head.appendChild(s);}
function labelPanel(panel){if(panel.id==='rp-review-built-in-hotb'||panel.id==='rp-review-drills-hotb')return;if(panel.querySelector(':scope > .rp-section-label'))return;const h=panel.querySelector(':scope > h1,:scope > h2,:scope > h3');if(!h)return;const text=(h.textContent||'').trim();if(!text)return;const hit=rules.find(r=>r.match.test(text));if(!hit)return;const p=document.createElement('p');p.className='rp-section-label';p.textContent=hit.label;h.before(p);}
function mount(){css();document.querySelectorAll('#app section.panel,#app .panel').forEach(labelPanel);}
window.addEventListener('load',mount);setTimeout(mount,0);setInterval(mount,900);