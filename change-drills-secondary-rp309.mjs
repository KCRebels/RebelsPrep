// Build 309: keep Change Drills visually secondary without affecting startup.
const app=document.getElementById('app');
const STYLE_ID='rp309-change-drills-style';
function style(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
 #open-drill-picker.rp309-change-drills{background:#fff!important;color:#111!important;border:1.5px solid #cfd5da!important;box-shadow:none!important}
 `;document.head.appendChild(s);
}
function mount(){
 if(!app)return;style();
 const b=app.querySelector('#open-drill-picker');
 if(!b)return;
 const isChange=/^change drills$/i.test((b.textContent||'').trim());
 b.classList.toggle('rp309-change-drills',isChange);
 if(isChange)b.classList.remove('primary');
}
if(app){new MutationObserver(mount).observe(app,{childList:true,subtree:true});setTimeout(mount,0);}
