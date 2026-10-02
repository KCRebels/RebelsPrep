import {accountContext,isPlayer,sendPlayerSignInLink,finishPlayerSignIn,signOutAccount} from './account-model.mjs?v=rpplayer2';

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let message='',busy=false,ctx=null,profile=null;
async function services(){const root='https://www.gstatic.com/firebasejs/12.19.0/';const [app,F]=await Promise.all([import(root+'firebase-app.js'),import(root+'firebase-firestore.js')]);const project=app.getApps().find(x=>x.name==='RebelsPrep');if(!project)throw Error('RebelsPrep sign-in is not ready.');return {F,db:F.getFirestore(project)};}
function login(){
 return '<h1>Player Sign In</h1><p class="muted">Permanent RebelsPrep accounts are available to 14U, 16U and 18U players.</p>'+
 '<section class="panel"><h2>Sign in to My RebelsPrep</h2><label>Email<input id="player-email" type="email" autocomplete="email" placeholder="player@example.com"></label><div class="actions"><button class="primary" id="send-player-link" '+(busy?'disabled':'')+'>'+(busy?'Sending…':'Send Sign-In Link')+'</button></div><p class="muted">Use the email connected to your player account. The link only signs you in; it does not let you choose or change which player you are.</p></section>'+
 '<section class="panel"><h2>Opening the link on an iPhone?</h2><p>If the email opens in Safari instead of your Home Screen app, copy the entire address from Safari and paste it below.</p><label>Sign-in link<input id="player-link" type="url" inputmode="url" placeholder="Paste complete link"></label><div class="actions"><button id="finish-player-link" '+(busy?'disabled':'')+'>Finish Sign In</button></div></section>';
}
function unclaimed(){
 const email=ctx?.user?.email||'this email';
 return '<h1>Player Account</h1><section class="panel"><h2>Account not activated yet</h2><p>'+esc(email)+' is signed in, but it has not been connected to a RebelsPrep player.</p><p class="muted">A coach/admin must activate the correct 14U, 16U or 18U player identity. Players cannot choose a name or claim another player account.</p><div class="actions"><button id="player-signout">Sign Out</button></div></section>';
}
function playerHome(){
 return '<h1>'+esc(profile?.name||ctx.account.displayName||'Player')+'</h1><p class="muted">My RebelsPrep</p>'+
 '<section class="panel"><h2>Player account active</h2><p>Your permanent RebelsPrep account is connected to your player profile.</p></section>'+
 '<section class="panel"><h2>My Development</h2><p class="muted">Player Focus, coach feedback and recommended drills will live here.</p></section>'+
 '<section class="panel"><h2>My Practice</h2><p class="muted">Upcoming practice assignments and facility check-in will live here.</p></section>'+
 '<div class="actions"><button id="player-signout">Sign Out</button></div>';
}
function render(){const app=$('#app');app.innerHTML=(message?'<div class="notice">'+esc(message)+'</div>':'')+(!ctx?.user?login():!isPlayer(ctx.account)?unclaimed():playerHome());bind();}
function bind(){
 $('#send-player-link')?.addEventListener('click',async()=>{const email=$('#player-email')?.value;busy=true;message='';render();try{await sendPlayerSignInLink(email);message='Sign-in link sent. Open that email on this device.';}catch(e){message=e.message;}busy=false;render();});
 $('#finish-player-link')?.addEventListener('click',async()=>{const link=$('#player-link')?.value?.trim();busy=true;message='';render();try{await finishPlayerSignIn(link);await load();return;}catch(e){message=e.message;}busy=false;render();});
 $('#player-signout')?.addEventListener('click',async()=>{await signOutAccount();ctx=null;profile=null;message='Signed out.';render();});
}
async function load(){
 try{
  ctx=await accountContext();profile=null;
  if(isPlayer(ctx.account)){const {F,db}=await services(),snap=await F.getDoc(F.doc(db,'rpPlayers',ctx.account.playerId));if(!snap.exists())throw Error('Your player profile is not available.');profile=snap.data();if(profile.playerPortalEnabled!==true)throw Error('Player portal access is not enabled for this team.');}
 }catch(e){message=e.message;}
 render();
}
load();