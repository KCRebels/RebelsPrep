// Build 348: correct builder Back label and keep one working Start Over control on Teams.
const app=document.getElementById('app');
let frame=0;

function activeView(){
 return app?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';
}
function ensureStyle(){
 if(document.getElementById('rp347-builder-nav-style'))return;
 const style=document.createElement('style');
 style.id='rp347-builder-nav-style';
 style.textContent=`
  #rp-home-start-wrap,#rp-home-start-over-placeholder{display:none!important}
  #rp-global-nav{display:none!important}
 `;
 document.head.appendChild(style);
}
function fixBackLabel(){
 const back=document.getElementById('rp-context-back');
 if(back&&/back to home/i.test(back.textContent||''))back.textContent='← Back to Teams';
}
function hasSavedDraft(){return !!document.querySelector('[data-resume-team]');}
function runNativeStartOver(){
 const setup=document.querySelector('.bottom-nav [data-view="setup"]');
 if(!setup)return;
 setup.click();
 requestAnimationFrame(()=>{
  const nativeReset=document.getElementById('start-over');
  if(nativeReset)nativeReset.click();
 });
}
function fixTeamsStartOver(){
 const old=document.getElementById('rp347-home-start-over');
 if(activeView()!=='home'||!hasSavedDraft()){old?.remove();return;}
 const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 let start=old;
 if(!start){
  start=document.createElement('button');
  start.type='button';
  start.id='rp347-home-start-over';
  start.textContent='Start Over';
  start.className='rp-home-secondary-286';
  start.onclick=e=>{
   e.preventDefault();
   e.stopPropagation();
   if(!confirm('Start over and clear this practice draft?'))return;
   runNativeStartOver();
  };
 }
 if(start.parentElement!==actions)actions.appendChild(start);
 document.querySelectorAll('#rp-home-start-wrap,#rp-global-nav,#rp-home-start-over-placeholder').forEach(el=>el.remove());
}
function mount(){
 ensureStyle();
 fixBackLabel();
 fixTeamsStartOver();
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}

if(app){
 new MutationObserver(schedule).observe(app,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',schedule,true);
 setInterval(schedule,500);
 schedule();
}
