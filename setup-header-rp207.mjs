// Build 226: uniform RebelsPrep Practice Scheduler header using the full selected team name.
import {teams} from './teams.mjs?v=recovery78';
const ID='rp207-setup-header';
const pages={setup:'Practice Setup',attendance:'Attendance',drills:'Drills',review:'Review Practice',plan:'Hitting Practice'};
let lastView='',lastTeam='';
function view(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function team(){try{const id=localStorage.getItem('RebelsPrep:coach-pilot:1:active-team')||'';const exact=teams.find(t=>t.id===id);if(exact?.name)return exact.name;const d=id?JSON.parse(localStorage.getItem('RebelsPrep:coach-pilot:1:team:'+id)||'{}'):{};if(d.teamName)return d.teamName;}catch{}const app=document.querySelector('#app');for(const x of app?.querySelectorAll('p.muted')||[]){if(/KC Rebels/i.test(x.textContent||''))return x.textContent.trim();}return 'KC Rebels';}
function css(){if(document.getElementById(ID+'-style'))return;const s=document.createElement('style');s.id=ID+'-style';s.textContent=`
#${ID}{margin:8px 0 18px;padding:16px 18px;border:2px solid #d8ddd9;border-radius:20px;background:#fff;text-align:center}
#${ID} .rp207-team{margin:0 0 5px;color:#b51f2e;font-size:13px;font-weight:900;letter-spacing:.075em;text-transform:uppercase;line-height:1.25}
#${ID} .rp207-title{margin:0;color:#0c1222;font-size:30px;font-weight:850;letter-spacing:-.025em;line-height:1.05}
#${ID} .rp207-page{margin:8px 0 0;color:#59657d;font-size:15px;font-weight:800}
#app[data-rp209-scheduler="1"]>h1,#app[data-rp209-scheduler="1"]>h1+p.muted{display:none!important}
#app[data-rp209-scheduler="1"] section.panel[data-rp208-details="1"]>h2{display:none!important}
@media(max-width:430px){#${ID}{padding:15px 16px}#${ID} .rp207-title{font-size:28px}#${ID} .rp207-team{font-size:12px;letter-spacing:.055em}}
`;document.head.appendChild(s);}
function cleanDetails(app){for(const panel of app.querySelectorAll('section.panel')){const label=panel.querySelector(':scope > .rp-section-label');const h2=panel.querySelector(':scope > h2');if(label?.textContent.trim()==='PRACTICE DETAILS'&&/practice settings/i.test(h2?.textContent||''))panel.dataset.rp208Details='1';}}
function mount(){css();const app=document.getElementById('app');if(!app)return;const v=view(),page=pages[v],t=team(),old=document.getElementById(ID);if(!page){app.removeAttribute('data-rp209-scheduler');old?.remove();lastView='';lastTeam='';return;}app.setAttribute('data-rp209-scheduler','1');let box=old;if(!box){box=document.createElement('section');box.id=ID;const top=document.getElementById('rp-builder-top');if(top)top.after(box);else app.prepend(box);}if(v!==lastView||t!==lastTeam||!box.firstChild){box.innerHTML='<p class="rp207-team">'+esc(t)+'</p><h1 class="rp207-title">Practice Scheduler</h1><p class="rp207-page">'+esc(page)+'</p>';lastView=v;lastTeam=t;}cleanDetails(app);}
window.addEventListener('load',mount);setTimeout(mount,0);
new MutationObserver(()=>queueMicrotask(mount)).observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});