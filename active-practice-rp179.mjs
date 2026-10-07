// Build 203: clean active-practice mode with a safe return to the practice review screen.
const ACTIVE_ID='rp-active-practice-cleanup';
function isActive(){const hero=document.querySelector('.practice-hero'),shared=document.querySelector('.shared-clock');return Boolean(hero&&shared);}
function button(action,label,primary=false){const source=document.querySelector('[data-shared-control="'+action+'"]');if(!source)return '';return '<button type="button" data-rp-live-control="'+action+'" '+(source.disabled?'disabled':'')+(primary?' class="primary"':'')+'>'+label+'</button>';}
function backButton(){return '<button type="button" id="rp-live-back">← Practice Overview</button>';}
function mount(){
 const app=document.querySelector('#app');if(!app)return;
 const old=document.getElementById(ACTIVE_ID);if(!isActive()){old?.remove();return;}
 const hero=app.querySelector('.practice-hero'),shared=app.querySelector('.shared-clock');if(!hero||!shared)return;
 const title=hero.querySelector('.practice-hero-title')?.outerHTML||'';
 const stats=hero.querySelector('.practice-hero-stats')?.outerHTML||'';
 const clock=shared.querySelector('.practice-clock-stats')?.outerHTML||'';
 const phase=shared.querySelector('.practice-clock-phase')?.outerHTML||'';
 const started=/Start Shared Practice/.test(shared.textContent||'')?false:true;
 const controls='<div class="rp-live-controls">'+button('start',started?'Resume':'Start Shared Practice',!started)+button('pause','Pause')+button('skip','Skip')+button('done','Done')+'</div>';
 let clean=document.getElementById(ACTIVE_ID);if(!clean){clean=document.createElement('section');clean.id=ACTIVE_ID;clean.className='rp-active-practice';}
 clean.innerHTML='<div class="rp-live-top">'+backButton()+'</div>'+title+stats+'<div class="rp-live-status">'+clock+phase+controls+'</div>';
 const header=document.querySelector('main>header');if(header?.nextSibling!==clean)header.after(clean);
 app.querySelector('.bottom-nav')?.setAttribute('hidden','');
 hero.style.display='none';
 const sharedPanel=shared.closest('.panel');if(sharedPanel){shared.style.display='none';const h2=sharedPanel.querySelector('h2');if(h2)h2.style.display='none';}
 const my=app.querySelector('#rp-my-practice');if(my)my.style.display='none';
 const global=document.querySelector('#rp-global-nav');if(global)global.style.display='none';
 clean.querySelectorAll('[data-rp-live-control]').forEach(b=>b.onclick=()=>document.querySelector('[data-shared-control="'+b.dataset.rpLiveControl+'"]')?.click());
 const back=clean.querySelector('#rp-live-back');if(back)back.onclick=()=>{const review=app.querySelector('.bottom-nav [data-view="review"]');if(review){review.removeAttribute('hidden');review.click();return;}const build=app.querySelector('.bottom-nav [data-view="plan"]');if(build){build.removeAttribute('hidden');build.click();}};
}
function css(){if(document.getElementById('rp179-style'))return;const s=document.createElement('style');s.id='rp179-style';s.textContent=`
#${ACTIVE_ID}{margin:14px 0 22px}.rp-live-top{display:flex;justify-content:flex-start;margin:0 0 10px}.rp-live-top button{background:#fff;border:1.5px solid #cfd5d2;border-radius:14px;padding:9px 13px;font-weight:800;color:#202633}.rp-active-practice .practice-hero-title{margin:0 0 14px;padding:20px;border:2px solid #d8ddd9;border-radius:22px;text-align:center;background:#fff}.rp-active-practice .practice-hero-title small{display:block;margin-bottom:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.rp-active-practice .practice-hero-title h1{margin:0;font-size:clamp(30px,8vw,46px)}.rp-active-practice .practice-hero-stats{margin:0 0 14px}.rp-live-status{padding:18px;border:2px solid #d8ddd9;border-radius:22px;background:#fff}.rp-live-status .practice-clock-stats{margin:0}.rp-live-status .practice-clock-phase{text-align:center;margin:12px 0 16px;font-weight:800}.rp-live-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.rp-live-controls button{min-width:0;padding:12px 6px;font-weight:800}.rp-live-controls button:first-child{grid-column:span 2}.rp-live-controls button:last-child{grid-column:span 2}@media(max-width:520px){.rp-live-controls{grid-template-columns:1fr 1fr}.rp-live-controls button{grid-column:auto!important}}
`;document.head.appendChild(s);}
css();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.documentElement,{childList:true,subtree:true});setInterval(mount,700);mount();