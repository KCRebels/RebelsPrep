// Build 200: unify Review Practice and Hitting Practice headers and remove redundant top actions.
const KEY='RebelsPrep:coach-pilot:1';
function activeView(){return document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function draft(){try{const id=localStorage.getItem(KEY+':active-team')||'';return id?JSON.parse(localStorage.getItem(KEY+':team:'+id)||'{}'):{};}catch{return {};}}
function teamName(){const d=draft();const h1=document.querySelector('#app h1');const sub=h1?.nextElementSibling;if(sub?.classList.contains('muted')&&sub.textContent.trim())return sub.textContent.trim();return d.teamName||'';}
function clockLabel(v){if(!v)return'';const [h,m]=String(v).split(':').map(Number);const ap=h>=12?'PM':'AM';const hh=((h+11)%12)+1;return hh+':'+String(m||0).padStart(2,'0')+' '+ap;}
function endLabel(start,duration){if(!start)return'';let [h,m]=start.split(':').map(Number);let total=h*60+m+Number(duration||0);total%=1440;return clockLabel(String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0'));}
function css(){if(document.getElementById('rp200-practice-header-style'))return;const s=document.createElement('style');s.id='rp200-practice-header-style';s.textContent=`
#rp-practice-hero{border:2px solid #d9ddd9;border-radius:22px;background:#fff;padding:20px 18px 22px;margin:0 0 16px;text-align:center}
#rp-practice-hero .rp-team{margin:0 0 5px;color:#59657d;font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.25}
#rp-practice-hero .rp-meta{margin:0 0 12px;color:#59657d;font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;line-height:1.25}
#rp-practice-hero h1{margin:0;color:#0c1222;font-size:42px;line-height:1.05;font-weight:800;letter-spacing:-.035em}
@media(max-width:430px){#rp-practice-hero h1{font-size:38px}#rp-practice-hero .rp-team,#rp-practice-hero .rp-meta{font-size:13px}}
`;document.head.appendChild(s);}
function hero(){const view=activeView();if(!['review','plan'].includes(view))return;document.getElementById('rp-builder-top')?.remove();document.querySelector('#rp-global-start')?.style.setProperty('display','none','important');document.querySelectorAll('#app .actions.step-actions #start-over').forEach(x=>x.style.setProperty('display','none','important'));
 const app=document.querySelector('#app'),h1=app?.querySelector('h1');if(!app||!h1)return;const d=draft();const title=view==='review'?'Review Practice':'Hitting Practice';const team=teamName();const facility=d.facility||'The Barn';const date=d.date||'';const start=clockLabel(d.start);const end=endLabel(d.start,d.durationMinutes);const meta=[facility,date,[start,end].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
 let box=document.getElementById('rp-practice-hero');if(!box){box=document.createElement('section');box.id='rp-practice-hero';h1.before(box);}box.innerHTML='<p class="rp-team">'+team+'</p><p class="rp-meta">'+meta+'</p><h1>'+title+'</h1>';
 const oldSub=h1.nextElementSibling;if(oldSub?.classList.contains('muted'))oldSub.remove();h1.remove();}
function mount(){css();hero();}
const obs=new MutationObserver(()=>queueMicrotask(mount));function observe(){const app=document.getElementById('app');if(app){obs.disconnect();obs.observe(app,{childList:true,subtree:true});mount();}}
window.addEventListener('load',observe);setTimeout(observe,0);setInterval(mount,500);