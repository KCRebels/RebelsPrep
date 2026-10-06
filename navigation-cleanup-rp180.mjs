// Build 190: locked builder navigation cleanup + 120-minute default. Do not alter scheduler, drills, portals, or assignments.
const MIN_H='48px',KEY='RebelsPrep:coach-pilot:1';
const backLabels={setup:'← Back to Home',attendance:'← Back to Setup',drills:'← Back to Attendance',review:'← Back to Drills',plan:'← Back to Review'};
const targets={setup:'home',attendance:'setup',drills:'attendance',review:'drills',plan:'review'};
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function isCoachAttendance(){return activeView()==='attendance'&&document.querySelector('#app h1')?.textContent?.includes('Coaches');}
function hasDraft(){return Boolean(document.querySelector('[data-resume-team]'));}
function css(){if(document.getElementById('rp190-style'))return;document.querySelectorAll('[id^="rp18"][id$="-style"],#rp187-style,#rp188-style,#rp189-style').forEach(x=>x.remove());const s=document.createElement('style');s.id='rp190-style';s.textContent=`
#app button,.bottom-nav button,#rp-global-nav button{min-height:${MIN_H}}
.actions.step-actions{align-items:stretch}.actions.step-actions>button{min-height:${MIN_H};height:${MIN_H}}
#rp-builder-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}
#rp-context-back,#rp-native-coach-back{appearance:none!important;-webkit-appearance:none!important;border:0!important;background:transparent!important;box-shadow:none!important;padding:4px 0!important;margin:0!important;min-height:0!important;height:auto!important;width:auto!important;color:#111!important;font:inherit!important;font-weight:700!important;text-align:left!important}
#rp-builder-top #rp-global-nav{display:flex!important;margin:0!important;padding:0!important;justify-content:flex-end!important;flex:0 0 auto!important}
#rp-builder-top #rp-global-nav button{height:${MIN_H}!important;min-height:${MIN_H}!important;margin:0!important}
#app>.actions.step-actions:has(#build-selected-teams){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:stretch!important}
#app>.actions.step-actions:has(#build-selected-teams)>button,#app>.actions.step-actions:has(#build-selected-teams)>#my-practice-wrap,#app>.actions.step-actions:has(#build-selected-teams)>#rp-home-start-wrap{width:100%!important;min-width:0!important;margin:0!important;display:block!important}
#app>.actions.step-actions:has(#build-selected-teams)>#my-practice-wrap button,#app>.actions.step-actions:has(#build-selected-teams)>#rp-home-start-wrap button,#app>.actions.step-actions:has(#build-selected-teams)>button{width:100%!important;height:${MIN_H}!important;min-height:${MIN_H}!important;padding:8px 6px!important;white-space:normal!important;font-weight:700}
.actions.step-actions #start-over,.actions.step-actions #back-attendance-players{display:none!important}
`;document.head.appendChild(s);}
function topbar(){let bar=document.getElementById('rp-builder-top');if(!bar){bar=document.createElement('div');bar.id='rp-builder-top';}return bar;}
function contextualBack(){const view=activeView(),app=document.querySelector('#app');let bar=topbar();if(!view||view==='home'){bar.remove();return;}let back=document.getElementById('rp-context-back');if(!back){back=document.createElement('button');back.id='rp-context-back';back.type='button';}
 if(isCoachAttendance()){
  back.textContent='← Back to Players';back.onclick=()=>{const native=document.querySelector('#back-attendance-players');if(native){native.click();return;}document.querySelector('.bottom-nav [data-view="attendance"]')?.click();};
 }else{
  back.textContent=backLabels[view]||'← Back';back.onclick=()=>{const target=targets[activeView()];document.querySelector('.bottom-nav [data-view="'+target+'"]')?.click();};
 }
 if(back.parentElement!==bar)bar.prepend(back);const h=app?.querySelector('h1');if(h&&bar.nextElementSibling!==h)h.before(bar);
}
function homeStartOver(){const view=activeView();let wrap=document.getElementById('rp-home-start-wrap');if(view!=='home'||!hasDraft()){wrap?.remove();return;}const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');if(!actions)return;if(!wrap){wrap=document.createElement('div');wrap.id='rp-home-start-wrap';wrap.innerHTML='<button type="button" id="rp-home-start-over">Start Over</button>';wrap.querySelector('button').onclick=()=>document.querySelector('#rp-global-start')?.click();}if(wrap.parentElement!==actions)actions.appendChild(wrap);}
function globalStartOver(){const global=document.querySelector('#rp-global-nav');if(!global)return;const view=activeView();if(view==='home'||!view){global.style.display='none';return;}const bar=topbar();global.style.display='flex';if(global.parentElement!==bar)bar.appendChild(global);}
function cleanBottomActions(){document.querySelectorAll('.actions.step-actions #start-over').forEach(x=>x.style.display='none');const nativeBack=document.querySelector('#back-attendance-players');if(nativeBack)nativeBack.style.display='none';document.querySelectorAll('.picker-back,#back-drills-attendance,[data-rp-specific-back],#rp-global-back').forEach(x=>x.remove());}
function lock120Default(){if(activeView()!=='setup')return;const input=document.getElementById('durationMinutes'),date=document.getElementById('date');if(!input||String(input.value)!=='180')return;let active='';try{active=localStorage.getItem(KEY+':active-team')||'practice';}catch{}const marker='RebelsPrep:default120:'+active+':'+(date?.value||'date');try{if(localStorage.getItem(marker))return;localStorage.setItem(marker,'1');}catch{}input.value='120';input.dispatchEvent(new Event('change',{bubbles:true}));}
function mount(){css();contextualBack();globalStartOver();cleanBottomActions();homeStartOver();lock120Default();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
new MutationObserver(schedule).observe(document.querySelector('#app')||document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('load',schedule);schedule();