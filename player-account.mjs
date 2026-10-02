import {accountContext,isPlayer} from './account-model.mjs?v=rpplayer1';

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function services(){
 const root='https://www.gstatic.com/firebasejs/12.19.0/';
 const [app,F]=await Promise.all([import(root+'firebase-app.js'),import(root+'firebase-firestore.js')]);
 const project=app.getApps().find(x=>x.name==='RebelsPrep');
 if(!project)throw Error('RebelsPrep sign-in is not ready.');
 return {F,db:F.getFirestore(project)};
}
async function load(){
 const app=$('#app');
 try{
  const {account}=await accountContext();
  if(!isPlayer(account)){app.innerHTML='<h1>Player Account</h1><section class="panel"><h2>Sign in required</h2><p>This area is for activated 14U, 16U, and 18U player accounts.</p><p class="muted">Younger-team players do not use individual RebelsPrep accounts. Their coaches can still use the full practice builder.</p></section>';return;}
  const {F,db}=await services(),snap=await F.getDoc(F.doc(db,'rpPlayers',account.playerId));
  if(!snap.exists())throw Error('Your player profile is not available.');
  const p=snap.data();
  if(p.playerPortalEnabled!==true)throw Error('Player portal access is not enabled for this team.');
  app.innerHTML='<h1>'+esc(p.name||account.displayName||'Player')+'</h1><p class="muted">My RebelsPrep</p><section class="panel"><h2>Player account active</h2><p>Your permanent RebelsPrep account is connected to your player profile.</p></section><section class="panel"><h2>Coming into this account</h2><p>Practice assignments, coach feedback, Player Focus, recommended drills, development information, and facility check-in will appear here.</p></section>';
 }catch(e){app.innerHTML='<h1>Player Account</h1><div class="notice"><strong>Account unavailable</strong><p>'+esc(e.message)+'</p></div>';}
}
load();