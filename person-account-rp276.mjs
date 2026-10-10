import {services,accountContext,isPlayer,isCoach,isOrgCoach,sendPlayerSignInLink,finishPlayerSignIn,registerPendingPlayerLogin,ensurePersonalCoachAccount,signOutAccount,watchAccount} from './account-model-rp276.mjs?v=rp276';
import {clockState} from './portal-model.mjs?v=rp129';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=new URLSearchParams(location.search).has('coach')?'coach':'player';
let ctx=null,profile=null,sessions={},clocks=new Map(),stops=[],accountStop=null,profileStop=null,message='',busy=false,email='',pastedLink='',chosen='',generation=0;
const range=b=>fmt(b.start)+'–'+fmt(b.end);
function fmt(n){const h=Math.floor(Number(n)/60)%24,m=Number(n)%60;return (h%12||12)+':'+String(m).padStart(2,'0')+(h>=12?'p':'a');}
function login(){
 return '<h1>'+ (mode==='coach'?'Coach':'Player')+' Sign In</h1><section class="panel"><h2>My RebelsPrep</h2><label>Email<input id="account-email" type="email" autocomplete="email" value="'+esc(email)+'"></label><p class="muted">Use your account email. You do not need a password.</p><div class="actions"><button class="primary" id="send-link" '+(busy?'disabled':'')+'>Send Sign-In Link</button></div></section><section class="panel"><h2>Already received a link?</h2><p class="muted">If it opens in Safari, copy the complete address and paste it here in your Home Screen app.</p><label>Sign-in link<input id="account-link" type="url" value="'+esc(pastedLink)+'"></label><div class="actions"><button id="finish-link" '+(busy?'disabled':'')+'>Finish Sign In</button></div></section>';
}
function pending(){
 return '<h1>My RebelsPrep</h1><section class="panel"><h2>Waiting for account activation</h2><p>'+esc(ctx.user.email)+' is signed in. A coach/admin needs to connect this login to your player or coach profile once.</p></section>';
}
function validRecord(r){return r&&r.practiceId&&/^[a-f0-9]{64}$/.test(r.clockToken||'')&&r.personId===(isPlayer(ctx?.account)?ctx.account.playerId:ctx?.account?.coachId)&&r.role===(isPlayer(ctx?.account)?'player':'coach');}
function activeRecords(){return Object.values(sessions).filter(validRecord).filter(r=>{const c=clocks.get(r.clockToken);return c&&!c.clock?.done&&!clockState(c.clock)?.done;}).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.start).localeCompare(String(b.start)));}
function duty(s){return (s.kind==='live'&&s.duty==='Pitching'?'Pitch Live':s.kind==='live'&&s.duty==='Catching'?'Catch Live':s.drill||s.duty)+(s.pitcher?' — Pitcher: '+s.pitcher:'')+(s.catcher?' — Catcher: '+s.catcher:'');}
function practiceHTML(r){
 const c=clockState(clocks.get(r.clockToken)?.clock);
 if(!c)return '<p>Loading practice clock…</p>';
 const secs=Math.ceil(c.remaining/1000),time=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
 const info='<section class="panel"><h2>'+esc(r.date)+' · '+esc(r.facility)+'</h2><p>'+esc(fmt(Number(r.start.split(':')[0])*60+Number(r.start.split(':')[1])))+'</p><div class="stat-line"><strong>Block '+(c.index+1)+' of '+c.blocks+'</strong><strong id="personal-timer">'+time+'</strong><strong>'+(!c.started?'Ready to start':c.phase==='rotate'?'Rotate':c.phase==='wrap'?'Wrap up':c.running?'Practice running':'Paused')+'</strong></div></section>';
 const role=r.role==='coach';
 return info+'<div id="blocks"><h2 class="rp-cards-heading">'+(role?'My Coaching Assignments':'My Player Card')+'</h2><article class="rp-player-card"><header class="rp-card-name">'+esc(r.name)+'</header><div class="rp-card-body"><table class="rp-player-rotation"><tbody>'+r.blocks.map((b,i)=>'<tr '+(i===c.index?'class="personal-current"':'')+'><th scope="row">B'+b.number+'</th><td class="rp-card-time">'+esc(range(b))+'</td><td>'+ (b.stations.length?b.stations.map(s=>esc(duty(s))+(role&&s.players?.length?'<div class="personal-players">'+s.players.map(esc).join(', ')+'</div>':'')).join('<br>'):b.coaching?'Circulate and coach':'Not Present')+'</td></tr>').join('')+'</tbody></table></div></article></div>';
}
function home(){
 const rows=activeRecords();
 if(!rows.some(r=>r.practiceId===chosen))chosen=rows[0]?.practiceId||'';
 const name=profile?.name||ctx.account.displayName||ctx.user.email;
 return '<h1>'+esc(name)+'</h1><p class="muted">My RebelsPrep</p>'+
 (rows.length>1?'<section class="panel"><label>My Practice<select id="personal-practice">'+rows.map(r=>'<option value="'+esc(r.practiceId)+'" '+(r.practiceId===chosen?'selected':'')+'>'+esc(r.date+' · '+r.start+' · '+r.facility)+'</option>').join('')+'</select></label></section>':'')+
 (rows.find(r=>r.practiceId===chosen)?practiceHTML(rows.find(r=>r.practiceId===chosen)):'<section class="panel"><h2>No active practice</h2><p>Your next assignment will appear here when your coach activates the practice.</p></section>')+
 (isPlayer(ctx.account)?'<section class="panel"><h2>Check In</h2><p>At the facility, use its QR code to check in.</p><a href="./?checkin=1&amp;facility=barn">Barn Check-In</a></section>':'');
}
function render(){
 if(!$('#app'))return;
 $('#app').innerHTML=(message?'<p class="notice" role="status">'+esc(message)+'</p>':'')+(!ctx?.user?login():!isPlayer(ctx.account)&&!isCoach(ctx.account)?pending():home())+(ctx?.user?'<div class="actions"><button id="account-signout">Sign Out</button>'+(isCoach(ctx.account)?'<a href="./">Practice Builder</a>'+(isOrgCoach(ctx.account)?'<a href="./?accounts=1">Player and Coach Accounts</a>':''):'')+'</div>':'');
 $('#account-email')?.addEventListener('input',e=>email=e.target.value);
 $('#account-link')?.addEventListener('input',e=>pastedLink=e.target.value);
 $('#send-link')?.addEventListener('click',()=>action(async()=>{await sendPlayerSignInLink(email,mode);message='Sign-in link sent. Open that email on this device.';}));
 $('#finish-link')?.addEventListener('click',()=>action(async()=>{await finishPlayerSignIn(pastedLink||location.href,email);history.replaceState(null,'',mode==='coach'?'?coach=1':'?player=1');await load();}));
 $('#personal-practice')?.addEventListener('change',e=>{chosen=e.target.value;render();});
 $('#account-signout')?.addEventListener('click',()=>action(async()=>{stop();await signOutAccount();ctx=null;profile=null;sessions={};clocks.clear();message='Signed out.';}));
}
async function action(fn){if(busy)return;busy=true;message='';render();try{await fn();}catch(e){message=e.message;}busy=false;render();}
function stop(){generation++;for(const f of stops)f();stops=[];accountStop?.();profileStop?.();accountStop=null;profileStop=null;}
async function setSessions(next){
 const version=++generation;for(const f of stops)f();stops=[];sessions=next||{};clocks.clear();
 const {F,db}=await services();
 for(const id of [...new Set(Object.values(sessions).filter(validRecord).map(r=>r.clockToken))]){
  if(version!==generation)return;
  stops.push(F.onSnapshot(F.doc(db,'rpClocks',id),s=>{if(version!==generation)return;if(s.exists())clocks.set(id,s.data());else clocks.delete(id);render();},e=>{if(version!==generation)return;message=e.message;render();}));
 }
 render();
}
async function load(){
 stop();ctx=null;profile=null;sessions={};clocks.clear();
 try{
  const {A,F,db,auth}=await services();await auth.authStateReady();
  if(A.isSignInWithEmailLink(auth,location.href)){await finishPlayerSignIn(location.href,email);history.replaceState(null,'',mode==='coach'?'?coach=1':'?player=1');}
  if(auth.currentUser){
   if(mode==='coach')await ensurePersonalCoachAccount();
   await registerPendingPlayerLogin();
  }
  ctx=await accountContext();
  if(isPlayer(ctx.account)){
   const snap=await F.getDoc(F.doc(db,'rpPlayers',ctx.account.playerId));
   if(!snap.exists()||snap.data().playerPortalEnabled!==true)throw Error('Player portal access is not enabled for this profile.');
   profile=snap.data();
   profileStop=F.onSnapshot(snap.ref,s=>{if(!s.exists()||s.data().playerPortalEnabled!==true){stop();ctx.account=null;message='Player portal access is not enabled.';render();return;}profile=s.data();setSessions(profile.practiceAssignments||{}).catch(e=>{message=e.message;render();});},e=>{message=e.message;render();});
  }else if(isCoach(ctx.account)){await setSessions(ctx.account.practiceAssignments);}
  if(ctx.user)accountStop=await watchAccount(a=>{
   const before=ctx.account;ctx.account=a;
   if(!a||!a.active){for(const f of stops)f();stops=[];sessions={};clocks.clear();render();return;}
   if((before?.role!==a.role||before?.playerId!==a.playerId||before?.coachId!==a.coachId)){load();return;}
   if(isCoach(a))setSessions(a.practiceAssignments).catch(e=>{message=e.message;render();});
  },e=>{message=e.message;render();});
 }catch(e){message=e.message;if(ctx)ctx.account=null;}
 render();
}
setInterval(()=>{const r=activeRecords().find(x=>x.practiceId===chosen),c=r&&clockState(clocks.get(r.clockToken)?.clock),el=$('#personal-timer');if(!el)return;if(!c||c.done){render();return;}const sec=Math.ceil(c.remaining/1000);el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');const key=[c.index,c.phase,c.running,c.started].join('-');if(el.dataset.clockKey&&el.dataset.clockKey!==key)render();const next=$('#personal-timer');if(next)next.dataset.clockKey=key;},500);
window.addEventListener('pagehide',stop);load();
