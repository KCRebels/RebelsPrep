// Build 352: restore the approved builder flow layout.
// Back navigation is always a top-left text link. Bottom action rows keep Next on the left.
const app=document.getElementById('app');
let frame=0;
let observer=null;
let mounting=false;

function currentView(){return app?.dataset.practiceView||'';}
function currentStage(){return app?.dataset.attendanceStage||'';}
function clickNative(selector){const el=document.querySelector(selector);if(el){el.click();return true;}return false;}
function goTeams(){location.assign('./?build=1&teams=1&v=352');}

function backSpec(){
 const view=currentView(),stage=currentStage();
 if(view==='setup')return ['← Back to Teams',goTeams];
 if(view==='attendance'&&stage==='players')return ['← Back to Setup',()=>clickNative('.bottom-nav [data-view="setup"]')];
 if(view==='attendance'&&stage==='coaches')return ['← Back to Players',()=>clickNative('#back-attendance-players')||clickNative('.bottom-nav [data-view="attendance"]')];
 if(view==='plan'||view==='review')return ['← Back to Coaches',()=>clickNative('#back-practice-coaches')||clickNative('.bottom-nav [data-view="attendance"]')];
 if(view==='drills')return ['← Back to Practice',()=>clickNative('#back-drills-attendance')||clickNative('.bottom-nav [data-view="review"]')];
 return null;
}

function ensureStyle(){
 if(document.getElementById('rp352-builder-flow-style'))return;
 const style=document.createElement('style');
 style.id='rp352-builder-flow-style';
 style.textContent=`
  .rp352-back-link{display:inline-block;margin:0 0 10px;padding:2px 0;color:#111!important;background:transparent!important;border:0!important;box-shadow:none!important;font-size:16px;font-weight:800;line-height:1.25;text-decoration:none;cursor:pointer}
  .rp352-back-link:active,.rp352-back-link:focus{color:#c8102e!important;text-decoration:none}
  #rp-builder-top,#rp-context-back{display:none!important}
  #back-attendance-players,#back-practice-coaches{display:none!important}
  #app[data-practice-view="setup"] .actions.step-actions,
  #app[data-practice-view="attendance"] .actions.step-actions{justify-content:flex-start!important}
 `;
 document.head.appendChild(style);
}

function ensureBackLink(){
 const spec=backSpec();
 let link=document.getElementById('rp352-back-link');
 if(!spec){link?.remove();return;}
 if(!link){
  link=document.createElement('a');
  link.id='rp352-back-link';
  link.className='rp352-back-link';
  link.href='#';
 }
 link.textContent=spec[0];
 link.onclick=e=>{e.preventDefault();spec[1]();};
 const scheduler=document.getElementById('rp207-setup-header');
 const anchor=scheduler||app?.querySelector('h1,section.panel');
 if(anchor&&link.nextElementSibling!==anchor)anchor.before(link);
}

function normalizeActions(){
 const view=currentView(),stage=currentStage();
 if(!['setup','attendance'].includes(view))return;
 const actions=[...app.querySelectorAll('.actions.step-actions')].at(-1);
 if(!actions)return;
 const next=view==='setup'?actions.querySelector('[data-next]'):stage==='players'?actions.querySelector('#next-attendance-coaches'):actions.querySelector('#next-coaches-practice');
 if(next){next.textContent='Next';if(actions.firstElementChild!==next)actions.prepend(next);}
 if(view==='attendance'&&stage==='coaches')actions.querySelector('#save-draft')?.remove();
 const bottomBack=actions.querySelector('#back-attendance-players');
 if(bottomBack)bottomBack.style.display='none';
 const start=actions.querySelector('#start-over');
 if(start&&actions.lastElementChild!==start)actions.appendChild(start);
}

function cleanNativeBack(){
 document.querySelectorAll('#back-practice-coaches,#back-attendance-players').forEach(el=>el.style.display='none');
}

function mount(){
 if(mounting||!app)return;
 mounting=true;
 observer?.disconnect();
 try{ensureStyle();cleanNativeBack();normalizeActions();ensureBackLink();}
 finally{mounting=false;observe();}
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
function observe(){if(!app)return;if(!observer)observer=new MutationObserver(schedule);observer.disconnect();observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view','data-attendance-stage']});}

ensureStyle();schedule();observe();
window.addEventListener('load',schedule);
