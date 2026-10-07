// Build 213: Practice History is retired completely.
// Remove every coach-facing History control and erase legacy practice-history records from this device.
const STYLE='rp213-remove-history-style';
function css(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
[data-history-team],button[data-history-team],.history,.practice-history{display:none!important}
`;document.head.appendChild(s);}
function purgeStoredHistory(){try{const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.includes(':history:')||k.endsWith(':history')))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));}catch{}}
function removeHistoryUI(){css();purgeStoredHistory();document.querySelectorAll('[data-history-team],.practice-history').forEach(el=>el.remove());document.querySelectorAll('button,a').forEach(el=>{if((el.textContent||'').trim().toLowerCase()==='history')el.remove();});const app=document.getElementById('app');if(!app)return;const h1=app.querySelector('h1');if(h1?.textContent.trim()==='Practice History'){const home=app.querySelector('.bottom-nav [data-view="home"]');if(home)home.click();}}
css();purgeStoredHistory();
new MutationObserver(removeHistoryUI).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',removeHistoryUI);setTimeout(removeHistoryUI,0);setTimeout(removeHistoryUI,250);setTimeout(removeHistoryUI,1000);