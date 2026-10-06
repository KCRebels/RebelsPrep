// Build 186: stable builder-page navigation. Home is left untouched; builder pages get one text-style contextual Back link and consistent action heights.
const MIN_H='48px';
const backLabels={setup:'← Back to Home',attendance:'← Back to Setup',drills:'← Back to Attendance',review:'← Back to Drills',plan:'← Back to Review'};
const targets={setup:'home',attendance:'setup',drills:'attendance',review:'drills',plan:'review'};
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function css(){if(document.getElementById('rp186-style'))return;document.querySelectorAll('#rp180-style,#rp181-style,#rp182-style').forEach(x=>x.remove());const s=document.createElement('style');s.id='rp186-style';s.textContent=`
#app button,.bottom-nav button,#rp-global-nav button{min-height:${MIN_H}}
.actions.step-actions{align-items:stretch}.actions.step-actions>button{min-height:${MIN_H};height:${MIN_H}}
#rp-context-back{appearance:none!important;-webkit-appearance:none!important;border:0!important;background:transparent!important;box-shadow:none!important;padding:4px 0!important;margin:0 0 14px!important;min-height:0!important;height:auto!important;width:auto!important;color:#111!important;font:inherit!important;font-weight:700!important;text-align:left!important}
#rp-global-nav{margin:0 0 14px!important}#rp-global-nav button{height:${MIN_H}!important;min-height:${MIN_H}!important}
`;document.head.appendChild(s);}
function removeOldBacks(){document.querySelectorAll('#back-attendance-players,#back-drills-attendance,.picker-back,[data-rp-specific-back],#rp-global-back').forEach(x=>x.remove());}
function contextualBack(){const view=activeView();let b=document.getElementById('rp-context-back');if(!view||view==='home'){b?.remove();return;}if(!b){b=document.createElement('button');b.id='rp-context-back';b.type='button';b.addEventListener('click',()=>{const v=activeView(),target=targets[v];document.querySelector('.bottom-nav [data-view="'+target+'"]')?.click();});}b.textContent=backLabels[view]||'← Back';const app=document.querySelector('#app');const h=app?.querySelector('h1');if(h&&b.nextElementSibling!==h)h.before(b);}
function startOver(){const global=document.querySelector('#rp-global-nav');if(!global)return;const view=activeView();if(!view||view==='home'){global.style.display='none';return;}global.style.display='flex';global.style.justifyContent='flex-end';const app=document.querySelector('#app');const back=document.getElementById('rp-context-back');const h=app?.querySelector('h1');if(app&&global.parentElement!==app)app.prepend(global);if(back&&global.nextElementSibling!==back)back.before(global);else if(!back&&h&&global.nextElementSibling!==h)h.before(global);}
function mount(){css();removeOldBacks();contextualBack();startOver();}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
new MutationObserver(schedule).observe(document.querySelector('#app')||document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);window.addEventListener('load',schedule);schedule();