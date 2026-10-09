// Build 251: Start Over exists only while building; never recreate it on a built/ready/live practice.
import * as shared from './shared-rp52.mjs?v=rpauth52';
const KEY='RebelsPrep:coach-pilot:1';
const RESET='RebelsPrep:hard-reset';
let releasing=false,releasedFor='';
function activeId(){return localStorage.getItem(KEY+':active-team');}
function clearPracticeStorage(){try{const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k===KEY||k===KEY+':active-team'||k.startsWith(KEY+':resume:')||k.startsWith(KEY+':team:')))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));['rp156-drill-repair','rp157-drill-cleared','rp163-review-after-reload','rp170-review-after-reload','rp171-review-after-reload'].forEach(k=>sessionStorage.removeItem(k));}catch{}}
async function clockOnce(token){return await Promise.race([new Promise(async resolve=>{let stop=null,done=false;try{stop=await shared.watchClock(token,value=>{if(done)return;done=true;try{stop?.();}catch{}resolve(value);},()=>resolve(null));}catch{resolve(null);}}),new Promise(resolve=>setTimeout(()=>resolve(null),1500))]);}
async function closePublished(teamId,onlyReady=false){if(!teamId||!shared.configured)return;try{const directory=await shared.registry(teamId);if(!directory?.clockToken)return;const value=await clockOnce(directory.clockToken);const clock=value?.clock;if(!clock||clock.done)return;if(onlyReady&&clock.started)return;await shared.control(directory.clockToken,'done');}catch(e){console.warn('Published practice reset skipped',e);}}
async function releaseReadyShared(){const teamId=activeId();if(!teamId||releasing||releasedFor===teamId||!document.querySelector('#drill-picker'))return;releasing=true;try{await closePublished(teamId,true);releasedFor=teamId;}finally{releasing=false;}}
async function hardReset(){if(!confirm('Start over and clear this practice draft?'))return;const teamId=activeId();try{sessionStorage.setItem(RESET,'1');}catch{}clearPracticeStorage();await closePublished(teamId,false);location.replace(location.origin+location.pathname+'?reset='+Date.now());}
function finishReset(){let armed=false;try{armed=sessionStorage.getItem(RESET)==='1'||new URLSearchParams(location.search).has('reset');}catch{}if(!armed)return;clearPracticeStorage();try{sessionStorage.removeItem(RESET);}catch{}try{history.replaceState(null,'',location.pathname);}catch{}}
function builtPractice(){const view=document.querySelector('#app')?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';return view==='plan'||view==='active'||!!document.querySelector('#activate-practice,#start-practice,#active-practice,[data-practice-ready]');}
function removeBar(){document.querySelector('#rp-global-nav')?.remove();}
function bar(){let el=document.querySelector('#rp-global-nav');if(el)return el;el=document.createElement('div');el.id='rp-global-nav';el.style.cssText='display:flex;justify-content:flex-end;gap:12px;margin:0 0 22px;position:relative;z-index:9999';el.innerHTML='<button type="button" id="rp-global-start" style="font-weight:700;padding:10px 18px;min-width:150px">Start Over</button>';return el;}
function mount(){const app=document.querySelector('#app');if(!app)return;if(builtPractice()){removeBar();return;}const el=bar();if(el.parentElement!==app)app.prepend(el);}
document.addEventListener('click',e=>{const b=e.target.closest?.('#rp-global-start,#start-over');if(!b)return;e.preventDefault();e.stopImmediatePropagation();hardReset();},true);
window.addEventListener('hashchange',()=>setTimeout(mount,50));
window.addEventListener('load',()=>setTimeout(mount,500));
setInterval(()=>{const app=document.querySelector('#app');if(!app)return;if(builtPractice()){removeBar();return;}if(!document.querySelector('#rp-global-nav')||document.querySelector('#drill-picker'))mount();},500);
finishReset();setTimeout(mount,700);