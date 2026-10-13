// Build 353: native-first Teams navigation.
// Native team selection, Continue, and Resume stay untouched.
// This module only owns the Teams-page Start Over control. Builder-page back navigation
// is owned by builder-flow-layout-rp353.mjs so there is never a second competing Back link.
const app=document.getElementById('app');
let frame=0;

function activeView(){return app?.dataset.practiceView||document.querySelector('.bottom-nav [aria-current="page"]')?.dataset.view||'';}
function fakeEvent(target){return {target,currentTarget:target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};}
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
  if(document.getElementById('rp353-builder-nav-style'))return;
  const style=document.createElement('style');
  style.id='rp353-builder-nav-style';
  style.textContent=`#rp-home-start-wrap,#rp-home-start-over-placeholder,#rp-global-nav{display:none!important}#rp351-context-back,#rp352-back-link{display:none!important}`;
  document.head.appendChild(style);
}
function ensureTeamsStartOver(){
  let start=document.getElementById('rp351-home-start-over');
  const onTeams=activeView()==='home',hasDraft=!!document.querySelector('[data-resume-team]');
  if(!onTeams||!hasDraft){start?.remove();return;}
  const actions=document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
  if(!actions)return;
  if(!start){
    start=document.createElement('button');start.id='rp351-home-start-over';start.type='button';start.textContent='Start Over';start.className='rp-home-secondary-286';
    start.onclick=e=>{e.preventDefault();e.stopPropagation();if(!confirm('Start over and clear this practice draft?'))return;nativeStartOverFromTeams();};
  }
  if(start.parentElement!==actions)actions.appendChild(start);
}
function removeLegacyControls(){document.querySelectorAll('#rp347-home-start-over,#rp350-home-start-over,#rp-home-start-wrap,#rp-home-start-over-placeholder,#rp-global-nav,#rp351-context-back,#rp352-back-link').forEach(el=>el.remove());}
function mount(){ensureStyle();removeLegacyControls();ensureTeamsStartOver();}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
if(app){new MutationObserver(schedule).observe(app,{childList:true,subtree:true});schedule();}
