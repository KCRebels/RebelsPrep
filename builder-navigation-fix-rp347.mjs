// Build 351: native-first Teams navigation.
// Native team selection, Continue, and Resume stay untouched.
// This module only adds Teams-page Start Over and a contextual Back to Teams button.
const app=document.getElementById('app');
let frame=0;

function activeView(){
  return app?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';
}
function fakeEvent(target){
  return {target,currentTarget:target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
}
function nativeHome(){
  const home=document.querySelector('.bottom-nav [data-view="home"]');
  if(typeof home?.onclick==='function'){
    home.onclick.call(home,fakeEvent(home));
    return true;
  }
  return false;
}
function nativeStartOverFromTeams(){
  const resume=document.querySelector('[data-resume-team]');
  if(!resume||typeof resume.onclick!=='function')return false;
  resume.onclick.call(resume,fakeEvent(resume));
  const reset=document.getElementById('start-over');
  if(!reset||typeof reset.onclick!=='function')return false;
  reset.onclick.call(reset,fakeEvent(reset));
  return true;
}
function ensureStyle(){
  if(document.getElementById('rp351-builder-nav-style'))return;
  const style=document.createElement('style');
  style.id='rp351-builder-nav-style';
  style.textContent=`
    #rp-home-start-wrap,#rp-home-start-over-placeholder,#rp-global-nav{display:none!important}
    #rp351-context-back{appearance:none;-webkit-appearance:none;border:0;background:transparent;box-shadow:none;padding:4px 0;margin:0 0 12px;min-height:0;height:auto;width:auto;color:#111;font:inherit;font-weight:700;text-align:left}
  `;
  document.head.appendChild(style);
}
function ensureBackToTeams(){
  let back=document.getElementById('rp351-context-back');
  if(activeView()!=='setup'){
    back?.remove();
    return;
  }
  if(!back){
    back=document.createElement('button');
    back.id='rp351-context-back';
    back.type='button';
    back.textContent='← Back to Teams';
    back.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      nativeHome();
    };
  }
  const anchor=app?.querySelector('h1');
  if(anchor&&back.parentElement!==app)anchor.before(back);
}
function ensureTeamsStartOver(){
  let start=document.getElementById('rp351-home-start-over');
  const onTeams=activeView()==='home';
  const hasDraft=!!document.querySelector('[data-resume-team]');
  if(!onTeams||!hasDraft){
    start?.remove();
    return;
  }
  const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
  if(!actions)return;
  if(!start){
    start=document.createElement('button');
    start.id='rp351-home-start-over';
    start.type='button';
    start.textContent='Start Over';
    start.className='rp-home-secondary-286';
    start.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      if(!confirm('Start over and clear this practice draft?'))return;
      nativeStartOverFromTeams();
    };
  }
  if(start.parentElement!==actions)actions.appendChild(start);
}
function removeLegacyControls(){
  document.querySelectorAll('#rp347-home-start-over,#rp350-home-start-over,#rp-home-start-wrap,#rp-home-start-over-placeholder,#rp-global-nav').forEach(el=>el.remove());
}
function mount(){
  ensureStyle();
  removeLegacyControls();
  ensureBackToTeams();
  ensureTeamsStartOver();
}
function schedule(){
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(mount);
}
if(app){
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  schedule();
}
