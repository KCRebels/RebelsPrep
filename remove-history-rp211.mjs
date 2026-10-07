// Build 211: remove coach-facing Practice History while preserving completed-practice data in storage.
const STYLE='rp211-remove-history-style';
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
[data-history-team]{display:none!important}
`;document.head.appendChild(s);}
function mount(){css();document.querySelectorAll('[data-history-team]').forEach(b=>b.remove());const app=document.getElementById('app');if(!app)return;const h1=app.querySelector('h1');if(h1?.textContent.trim()==='Practice History'){const home=app.querySelector('.bottom-nav [data-view="home"]');if(home)home.click();}}
window.addEventListener('load',mount);setTimeout(mount,0);new MutationObserver(()=>queueMicrotask(mount)).observe(document.documentElement,{childList:true,subtree:true});