// Build 309: lightweight completion state. No startup or class observers.
const app=document.getElementById('app');
const KEY='RebelsPrep:shared-practice-finished';
const STYLE_ID='rp309-complete-style';
function flagged(){try{return sessionStorage.getItem(KEY)==='1';}catch{return false;}}
function setFlag(v){try{v?sessionStorage.setItem(KEY,'1'):sessionStorage.removeItem(KEY);}catch{}}
function style(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 .rp309-practice-complete{margin:14px 0 2px;padding:18px;border:2px solid #d8ddd9;border-radius:18px;background:#fff;text-align:center}
 .rp309-practice-complete .rp309-label{margin:0 0 6px;color:#b51f2e;font-size:14px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
 .rp309-practice-complete h2{margin:0 0 8px;color:#0c1222;font-size:26px;line-height:1.1}
 .rp309-practice-complete p{margin:0 0 14px;color:#667085;font-size:16px}
 .rp309-practice-complete button{width:100%;min-height:54px;border:0;border-radius:14px;background:#c8102e;color:#fff;font-size:17px;font-weight:800}
 `;document.head.appendChild(s);
}
function mount(){
 if(!app||!flagged())return;
 style();
 const actions=app.querySelector('.practice-hero-actions');
 if(!actions)return;
 actions.style.display='none';
 if(app.querySelector('.rp309-practice-complete'))return;
 const card=document.createElement('section');card.className='rp309-practice-complete';
 card.innerHTML='<p class="rp309-label">Practice Complete</p><h2>Practice Complete</h2><p>This practice has ended.</p><button type="button" id="rp309-home">Back to Home</button>';
 actions.after(card);
 card.querySelector('#rp309-home').onclick=()=>{setFlag(false);app.querySelector('.bottom-nav [data-view="home"]')?.click();};
}
if(app){
 document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-shared-control="done"]')){setFlag(true);setTimeout(mount,0);}
  if(e.target.closest?.('#activate-shared,#start-over'))setFlag(false);
 },true);
 new MutationObserver(mount).observe(app,{childList:true,subtree:true});
 setTimeout(mount,0);
}
