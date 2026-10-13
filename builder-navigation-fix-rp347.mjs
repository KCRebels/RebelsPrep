// Build 350: deterministic Teams-page Resume + Start Over.
// Loaded after the native builder so cleanup/route restoration runs after the builder's pagehide save.
const app=document.getElementById('app');
const KEY='RebelsPrep:coach-pilot:1';
const RESET='RebelsPrep:builder-reset-350';
const RESUME='RebelsPrep:builder-resume-350';
let frame=0;
function activeView(){return app?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function clearDraftStorage(){try{const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k===KEY||k===KEY+':active-team'||k.startsWith(KEY+':resume:')||k.startsWith(KEY+':team:')))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));['rp156-drill-repair','rp157-drill-cleared','rp163-review-after-reload','rp170-review-after-reload','rp171-review-after-reload','rp199-pending-drills'].forEach(k=>sessionStorage.removeItem(k));}catch{}}
function ensureStyle(){if(document.getElementById('rp350-builder-nav-style'))return;const style=document.createElement('style');style.id='rp350-builder-nav-style';style.textContent='#rp-home-start-wrap,#rp-home-start-over-placeholder,#rp-global-nav{display:none!important}';document.head.appendChild(style);}
function fixBackLabel(){const back=document.getElementById('rp-context-back');if(back&&/back to home/i.test(back.textContent||''))back.textContent='← Back to Teams';}
function hasSavedDraft(){return !!document.querySelector('[data-resume-team]');}
function fixTeamsStartOver(){let start=document.getElementById('rp350-home-start-over');if(activeView()!=='home'||!hasSavedDraft()){start?.remove();return;}const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');if(!actions)return;if(!start){start=document.createElement('button');start.type='button';start.id='rp350-home-start-over';start.textContent='Start Over';start.className='rp-home-secondary-286';start.onclick=e=>{e.preventDefault();e.stopPropagation();if(!confirm('Start over and clear this practice draft?'))return;try{sessionStorage.setItem(RESET,'1');sessionStorage.removeItem(RESUME);}catch{}clearDraftStorage();location.replace('./?build=1&fresh=350-'+Date.now());};}if(start.parentElement!==actions)actions.appendChild(start);}
function handleResume(e){const button=e.target.closest?.('[data-resume-team]');if(!button)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const teamId=button.dataset.resumeTeam;if(!teamId)return;try{const draftId=localStorage.getItem(KEY+':resume:'+teamId)||teamId;sessionStorage.setItem(RESUME,draftId);localStorage.setItem(KEY+':active-team',draftId);sessionStorage.removeItem(RESET);}catch{}location.replace('./?build=1&resumeTeam='+encodeURIComponent(teamId)+'&v=350&t='+Date.now());}
function mount(){ensureStyle();fixBackLabel();fixTeamsStartOver();}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
window.addEventListener('pagehide',()=>{try{if(sessionStorage.getItem(RESET)==='1'){clearDraftStorage();return;}const resumeId=sessionStorage.getItem(RESUME);if(resumeId)localStorage.setItem(KEY+':active-team',resumeId);}catch{}});
if(app){document.addEventListener('click',handleResume,true);new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});document.addEventListener('click',schedule,true);setInterval(schedule,500);schedule();}
setTimeout(()=>{try{sessionStorage.removeItem(RESET);sessionStorage.removeItem(RESUME);}catch{}},1000);
