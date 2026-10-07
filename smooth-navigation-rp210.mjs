// Build 215: hide scheduler redraw until the branded header/labels are mounted.
const STYLE='rp215-smooth-nav-style';
const schedulerViews=new Set(['setup','attendance','drills','review','plan']);
let previous='';
function view(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
#app{transition:opacity .09s ease-out}
body.rp215-changing #app{opacity:0!important}
.bottom-nav button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
`;document.head.appendChild(s);}
function schedulerTop(){const main=document.querySelector('main');const header=main?.querySelector(':scope > header');if(!header)return 0;return Math.max(0,Math.round(header.getBoundingClientRect().bottom+window.scrollY-8));}
function reveal(next){if(schedulerViews.has(next)){const y=schedulerTop();requestAnimationFrame(()=>{window.scrollTo({top:y,left:0,behavior:'auto'});requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));});}requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('rp215-changing')));}
function watch(){css();const next=view();if(!next||next===previous)return;previous=next;const ready=()=>document.getElementById('rp207-setup-header')||!schedulerViews.has(next);if(ready())reveal(next);else{let tries=0;const wait=setInterval(()=>{if(ready()||++tries>20){clearInterval(wait);reveal(next);}},15);}}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.bottom-nav button,[data-view],button[data-next],#next-coaches-drills');if(!b)return;document.body.classList.add('rp215-changing');},true);
new MutationObserver(()=>queueMicrotask(watch)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});
window.addEventListener('load',watch);setTimeout(watch,0);