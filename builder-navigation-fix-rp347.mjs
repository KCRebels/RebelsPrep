// Build 347: correct builder Back label and keep exactly one working Start Over control on Teams.
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
 `;
 document.head.appendChild(style);
}

function fixBackLabel(){
 const back=document.getElementById('rp-context-back');
 if(back&&/back to home/i.test(back.textContent||''))back.textContent='← Back to Teams';
}

function fixTeamsStartOver(){
 if(activeView()!=='home')return;
 const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 const start=document.getElementById('rp-global-start');
 if(start){
  start.removeAttribute('style');
  start.style.display='';
  start.style.width='100%';
  start.style.height='48px';
  start.style.minHeight='48px';
  start.textContent='Start Over';
  if(start.parentElement!==actions)actions.appendChild(start);
 }
 const global=document.getElementById('rp-global-nav');
 if(global)global.style.display='none';
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
