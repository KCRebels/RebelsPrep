// Home entry points for permanent personal accounts.
import * as shared from './shared-rp52.mjs?v=rp276';
let user=null;
function mount(){
 const onHome=document.querySelector('.bottom-nav [data-view="home"][aria-current="page"]');
 const actions=onHome&&document.querySelector('#build-selected-teams')?.closest('.actions.step-actions');
 if(!actions)return;
 actions.classList.add('rp-home-actions-284');
 const continueBtn=actions.querySelector('#build-selected-teams');
 if(continueBtn)continueBtn.classList.add('rp-home-continue-284');

 // Keep all home actions in ONE grid so older flex rules cannot split them unpredictably.
 let start=actions.querySelector('#rp-home-start-over-284');
 if(!start){
  start=document.createElement('button');
  start.id='rp-home-start-over-284';
  start.type='button';
  start.textContent='Start Over';
  start.className='rp-home-secondary-284';
  // On Home, Start Over means discard the currently selected/resumable draft by using
  // the app's own Start Over control. If none is available yet, keep the button disabled.
  start.disabled=true;
  actions.appendChild(start);
 }

 // If an app-native Start Over control is present, use it instead of the disabled placeholder.
 const native=[...document.querySelectorAll('#start-over')].find(el=>el!==start);
 if(native){
  start.replaceWith(native);
  native.id='rp-home-start-over-284';
  native.classList.add('rp-home-secondary-284');
  start=native;
 }

 let coach=actions.querySelector('#my-practice-button');
 if(shared.allowed(user)&&!coach){
  coach=document.createElement('button');
  coach.id='my-practice-button';
  coach.type='button';
  coach.textContent='Coach Sign In';
  coach.className='rp-home-secondary-284';
  coach.onclick=()=>location.assign('./?coach=1');
  actions.appendChild(coach);
 }
 let player=actions.querySelector('#player-signin-entry');
 if(!player){
  player=document.createElement('a');
  player.id='player-signin-entry';
  player.href='./?player=1';
  player.textContent='Player Sign In';
  player.className='rp-home-secondary-284';
  actions.appendChild(player);
 }

 // Remove leftovers from older builds so only this single four-control grid remains.
 document.querySelectorAll('#personal-entry-actions').forEach(el=>el.remove());
}
let frame;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
shared.observeAuth(u=>{user=u;schedule();}).catch(()=>{});
new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:true});
schedule();
