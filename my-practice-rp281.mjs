// Home entry points for permanent personal accounts.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
function mount(){
 const actions=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]')&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 let personal=document.querySelector('#personal-entry-actions');
 if(!personal){
  personal=document.createElement('div');
  personal.id='personal-entry-actions';
  personal.className='personal-entry-actions';
  actions.insertAdjacentElement('afterend',personal);
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
