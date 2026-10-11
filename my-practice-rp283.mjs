// Home entry points for permanent personal accounts.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
function mount(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('builder-primary-actions');
 const continueBtn=document.querySelector('#build-selected-teams');
 if(continueBtn)continueBtn.classList.add('builder-continue-full');
 let personal=document.querySelector('#personal-entry-actions');
 if(!personal){
  personal=document.createElement('div');
  personal.id='personal-entry-actions';
  personal.className='personal-entry-actions has-start-over';
  actions.insertAdjacentElement('afterend',personal);
 }
 // Use the app's real Start Over when it exists. On the untouched home screen,
 // provide the same button so both home states keep the exact same 3-button row.
 const nativeStart=[...document.querySelectorAll('button,a')].find(el=>el.id==='start-over'||el.textContent.trim()==='Start Over');
 let start=personal.querySelector('.personal-entry-startover');
 if(nativeStart&&nativeStart!==start){
  start?.remove();
  start=nativeStart;
  start.classList.add('personal-entry','personal-entry-startover');
  personal.prepend(start);
 }else if(!start){
  start=document.createElement('button');
  start.type='button';
  start.textContent='Start Over';
  start.className='personal-entry personal-entry-startover';
  start.onclick=()=>location.reload();
  personal.prepend(start);
 }
 if(shared.allowed(user)&&!document.querySelector('#my-practice-button')){
  const b=document.createElement('button');b.id='my-practice-button';b.type='button';b.textContent='Coach Sign In';b.className='personal-entry personal-entry-coach';b.onclick=()=>location.assign('./?coach=1');personal.appendChild(b);
 }
 if(!document.querySelector('#player-signin-entry')){
  const a=document.createElement('a');a.id='player-signin-entry';a.href='./?player=1';a.textContent='Player Sign In';a.className='portal-open personal-entry personal-entry-player';personal.appendChild(a);
 }
}
let frame;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});schedule();
