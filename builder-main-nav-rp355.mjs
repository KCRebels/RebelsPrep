// Build 355: one RebelsPrep bottom menu everywhere. Keep the native builder nav in the DOM for internal routing, but hide it from the UI.
const app=document.getElementById('app');

function ensureStyle(){
 if(document.getElementById('rp355-main-nav-style'))return;
 const style=document.createElement('style');
 style.id='rp355-main-nav-style';
 style.textContent=`
  #app>.bottom-nav,.bottom-nav[aria-label="Practice planner"]{display:none!important}
  .rp355-coach-bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:10000;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #d8ddd9;background:#fff;padding:10px max(10px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));box-shadow:0 -3px 14px rgba(12,18,34,.06)}
  .rp355-coach-bottom-nav a{display:flex;align-items:center;justify-content:center;min-height:58px;border:0;background:transparent;color:#515866;font-size:14px;font-weight:800;text-decoration:none;text-align:center}
  .rp355-coach-bottom-nav a:active{color:#c8102e}
  #app{padding-bottom:90px}
 `;
 document.head.appendChild(style);
}
function ensureNav(){
 let nav=document.getElementById('rp355-coach-bottom-nav');
 if(nav)return;
 nav=document.createElement('nav');
 nav.id='rp355-coach-bottom-nav';
 nav.className='rp355-coach-bottom-nav';
 nav.setAttribute('aria-label','RebelsPrep');
 nav.innerHTML=`
  <a href="./coach.html?v=355">Home</a>
  <a href="./coach.html?v=355&practice=1">My Practice</a>
  <a href="./coach.html?v=355&view=focus">Player Focus</a>
  <a href="./coach.html?v=355&view=more">More</a>`;
 document.body.appendChild(nav);
}
function mount(){ensureStyle();ensureNav();}
mount();
if(app)new MutationObserver(mount).observe(app,{childList:true,subtree:true});
