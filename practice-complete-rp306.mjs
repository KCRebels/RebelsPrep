// Build 306: keep a finished shared practice in a clear completed state instead of falling back to pre-practice controls.
const app=document.getElementById('app');
const STYLE_ID='rp306-complete-style';
function addStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .rp306-practice-complete{margin:14px 0 2px;padding:18px;border:2px solid #d8ddd9;border-radius:18px;background:#fff;text-align:center}
 .rp306-practice-complete .rp306-label{margin:0 0 6px;color:#b51f2e;font-size:14px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
 .rp306-practice-complete h2{margin:0 0 8px;color:#0c1222;font-size:26px;line-height:1.1}
 .rp306-practice-complete p{margin:0 0 14px;color:#667085;font-size:16px}
 .rp306-practice-complete button{width:100%;min-height:54px;border:0;border-radius:14px;background:#c8102e;color:#fff;font-size:17px;font-weight:800}
 `;document.head.appendChild(s);
}
function sharedPracticePanel(){
 return [...app.querySelectorAll('section.panel,.panel')].find(p=>/shared practice/i.test(p.textContent||''));
}
function mount(){
 if(!app)return;addStyle();
 const localDone=app.querySelector('#done[disabled]');
 const sharedPanel=sharedPracticePanel();
 const activate=app.querySelector('#activate-shared');
 const liveDone=app.querySelector('[data-shared-control="done"]');
 const complete=Boolean(localDone&&sharedPanel&&!activate&&!liveDone&&['plan','review'].includes(app.dataset.practiceView||''));
 const old=app.querySelector('.rp306-practice-complete');
 if(!complete){old?.remove();return;}
 const actions=localDone.closest('.practice-hero-actions');
 if(!actions)return;
 actions.style.display='none';
 if(old)return;
 const card=document.createElement('section');card.className='rp306-practice-complete';
 card.innerHTML='<p class="rp306-label">Practice Complete</p><h2>Practice Complete</h2><p>This practice has ended.</p><button type="button" id="rp306-home">Back to Home</button>';
 actions.after(card);
 card.querySelector('#rp306-home').onclick=()=>app.querySelector('.bottom-nav [data-view="home"]')?.click();
}
if(app){
 new MutationObserver(()=>queueMicrotask(mount)).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view','disabled']});
 window.addEventListener('load',mount);setTimeout(mount,0);
}
