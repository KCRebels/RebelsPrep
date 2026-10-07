// Build 210: presentation-only smoothing for scheduler navigation.
// Keeps the branded header stable, prevents click-time layout flash, and resets each new step cleanly below the brand header.
const STYLE='rp210-smooth-nav-style';
const schedulerViews=new Set(['setup','attendance','drills','review','plan']);
let previous='';
function view(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
#app{transition:opacity .12s ease-out}
body.rp210-changing #app{opacity:.985}
.bottom-nav button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
`;document.head.appendChild(s);}
function schedulerTop(){const main=document.querySelector('main');const header=main?.querySelector(':scope > header');if(!header)return 0;return Math.max(0,Math.round(header.getBoundingClientRect().bottom+window.scrollY-8));}
function settle(next){if(!schedulerViews.has(next))return;const y=schedulerTop();requestAnimationFrame(()=>{window.scrollTo({top:y,left:0,behavior:'auto'});requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));});}
function watch(){css();const next=view();if(!next||next===previous)return;const old=previous;previous=next;if(schedulerViews.has(next)&&old&&next!==old)settle(next);}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.bottom-nav button,[data-view],button[data-next],#next-coaches-drills');if(!b)return;document.body.classList.add('rp210-changing');setTimeout(()=>document.body.classList.remove('rp210-changing'),180);},true);
new MutationObserver(()=>queueMicrotask(watch)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});
window.addEventListener('load',watch);setTimeout(watch,0);