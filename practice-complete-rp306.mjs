// Build 308: persist finished shared-practice state through the redraw and keep Change Drills visually secondary.
const app=document.getElementById('app');
const STYLE_ID='rp306-complete-style';
const DONE_KEY='RebelsPrep:shared-practice-finished';
function addStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .rp306-practice-complete{margin:14px 0 2px;padding:18px;border:2px solid #d8ddd9;border-radius:18px;background:#fff;text-align:center}
 .rp306-practice-complete .rp306-label{margin:0 0 6px;color:#b51f2e;font-size:14px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
 .rp306-practice-complete h2{margin:0 0 8px;color:#0c1222;font-size:26px;line-height:1.1}
 .rp306-practice-complete p{margin:0 0 14px;color:#667085;font-size:16px}
 .rp306-practice-complete button{width:100%;min-height:54px;border:0;border-radius:14px;background:#c8102e;color:#fff;font-size:17px;font-weight:800}
 #open-drill-picker[data-rp-change-drills="true"]{background:#fff!important;color:#111!important;border:1.5px solid #cfd5da!important;box-shadow:none!important}
 `;document.head.appendChild(s);
}
function buttonByText(label){
 return [...app.querySelectorAll('button')].find(b=>(b.textContent||'').replace(/\s+/g,' ').trim().toUpperCase()===label.toUpperCase());
}
function finishingFlag(){try{return sessionStorage.getItem(DONE_KEY)==='1';}catch{return false;}}
function setFinishing(value){try{value?sessionStorage.setItem(DONE_KEY,'1'):sessionStorage.removeItem(DONE_KEY);}catch{}}
function decorateChangeDrills(){
 const b=app?.querySelector('#open-drill-picker');
 if(!b)return;
 const change=/^change drills$/i.test((b.textContent||'').trim());
 if(change){b.dataset.rpChangeDrills='true';b.classList.remove('primary');}
 else delete b.dataset.rpChangeDrills;
}
function mount(){
 if(!app)return;addStyle();decorateChangeDrills();
 const liveDone=app.querySelector('[data-shared-control="done"]');
 const activate=app.querySelector('#activate-shared');
 const start=buttonByText('Start');
 const done=buttonByText('DONE!');
 const completedControls=Boolean(start?.disabled&&done?.disabled&&!activate&&!liveDone);
 const complete=Boolean(finishingFlag()||completedControls);
 const old=app.querySelector('.rp306-practice-complete');
 if(!complete){
  old?.remove();
  const actions=app.querySelector('.practice-hero-actions');
  if(actions)actions.style.display='';
  return;
 }
 const actions=(done||app.querySelector('#done'))?.closest('.practice-hero-actions')||app.querySelector('.practice-hero-actions');
 if(!actions)return;
 actions.style.display='none';
 if(old)return;
 const card=document.createElement('section');card.className='rp306-practice-complete';
 card.innerHTML='<p class="rp306-label">Practice Complete</p><h2>Practice Complete</h2><p>This practice has ended.</p><button type="button" id="rp306-home">Back to Home</button>';
 actions.after(card);
 card.querySelector('#rp306-home').onclick=()=>{setFinishing(false);app.querySelector('.bottom-nav [data-view="home"]')?.click();};
}
if(app){
 document.addEventListener('click',e=>{
  const liveDone=e.target.closest?.('[data-shared-control="done"]');
  if(liveDone){setFinishing(true);setTimeout(mount,0);}
  if(e.target.closest?.('#activate-shared,#start-over,[data-view="setup"]'))setFinishing(false);
 },true);
 new MutationObserver(()=>queueMicrotask(mount)).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
 window.addEventListener('load',mount);setTimeout(mount,0);
}
