// Build 353: single owner for builder-page back links and bottom action order.
const app=document.getElementById('app');
let observer=null,frame=0,mounting=false;

const view=()=>app?.dataset.practiceView||'';
const stage=()=>app?.dataset.attendanceStage||'';
const click=id=>{const el=document.querySelector(id);if(!el)return false;if(typeof el.onclick==='function'){el.onclick.call(el,{target:el,currentTarget:el,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});return true;}el.click();return true;};

function style(){
 if(document.getElementById('rp353-flow-style'))return;
 const s=document.createElement('style');s.id='rp353-flow-style';s.textContent=`
 #rp353-builder-back{display:inline-block!important;align-self:flex-start!important;margin:0 0 10px!important;padding:2px 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#111!important;font-size:16px!important;font-weight:800!important;line-height:1.25!important;text-decoration:none!important;min-height:0!important;height:auto!important;width:auto!important;cursor:pointer!important}
 #rp353-builder-back:active{color:#c8102e!important}
 #rp351-context-back,#rp352-back-link,#rp-context-back,#back-attendance-players,#back-practice-coaches,#save-draft{display:none!important}
 #app[data-practice-view="setup"] .actions.step-actions,
 #app[data-practice-view="attendance"] .actions.step-actions{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;flex-wrap:wrap!important}
 #app[data-practice-view="setup"] .actions.step-actions .primary,
 #app[data-practice-view="attendance"] .actions.step-actions .primary{order:-10!important;margin-left:0!important;margin-right:0!important}
 #app[data-practice-view="setup"] .actions.step-actions #start-over,
 #app[data-practice-view="attendance"] .actions.step-actions #start-over{order:10!important;margin-left:auto!important;margin-right:0!important}
 `;document.head.appendChild(s);
}

function backConfig(){
 const v=view(),s=stage();
 if(v==='setup')return ['← Back to Teams',()=>click('.bottom-nav [data-view="home"]')];
 if(v==='attendance'&&s==='players')return ['← Back to Setup',()=>click('.bottom-nav [data-view="setup"]')];
 if(v==='attendance'&&s==='coaches')return ['← Back to Players',()=>click('#back-attendance-players')];
 if(v==='plan'||v==='review')return ['← Back to Coaches',()=>click('#back-practice-coaches')];
 if(v==='drills')return ['← Back to Practice',()=>click('#back-drills-attendance')];
 return null;
}

function back(){
 const cfg=backConfig();let a=document.getElementById('rp353-builder-back');
 document.querySelectorAll('#rp351-context-back,#rp352-back-link,#rp-context-back').forEach(x=>x.remove());
 if(!cfg){a?.remove();return;}
 if(!a){a=document.createElement('a');a.id='rp353-builder-back';a.href='#';}
 a.textContent=cfg[0];a.onclick=e=>{e.preventDefault();e.stopPropagation();cfg[1]();};
 const header=document.getElementById('rp207-setup-header');
 if(header){if(a.nextElementSibling!==header)header.before(a);}
 else{
   const first=[...app.children].find(x=>!x.classList?.contains('bottom-nav'));
   if(first&&a.nextElementSibling!==first)first.before(a);else if(!a.parentElement)app.prepend(a);
 }
}

function actions(){
 const v=view(),s=stage();if(v!=='setup'&&v!=='attendance')return;
 const row=[...app.querySelectorAll('.actions.step-actions')].at(-1);if(!row)return;
 let next=null;
 if(v==='setup')next=row.querySelector('[data-next]');
 else if(s==='players')next=row.querySelector('#next-attendance-coaches');
 else if(s==='coaches')next=row.querySelector('#next-coaches-practice');
 if(next){next.textContent='Next';if(row.firstElementChild!==next)row.prepend(next);}
 if(s==='coaches'){row.querySelector('#save-draft')?.remove();const b=row.querySelector('#back-attendance-players');if(b)b.style.display='none';}
 const start=row.querySelector('#start-over');if(start&&row.lastElementChild!==start)row.append(start);
}

function nativeBacks(){document.querySelectorAll('#back-attendance-players,#back-practice-coaches').forEach(x=>x.style.setProperty('display','none','important'));document.getElementById('save-draft')?.remove();}
function mount(){if(mounting||!app)return;mounting=true;observer?.disconnect();try{style();nativeBacks();actions();back();}finally{mounting=false;observe();}}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
function observe(){if(!observer)observer=new MutationObserver(schedule);observer.disconnect();observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view','data-attendance-stage']});}
style();schedule();observe();window.addEventListener('load',schedule);
