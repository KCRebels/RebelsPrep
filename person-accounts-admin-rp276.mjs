import {coaches} from './roster.mjs?v=rp129';
import {accountContext,isOrgCoach,eligiblePlayerDirectory,pendingPlayerAccounts,activatePlayerAccount,activateCoachAccount} from './account-model-rp276.mjs?v=rp276';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let players=[],pending=[],message='',busy=false;
function teamLabel(p){return (p.teamIds||[]).map(id=>id.replace('kc-rebels-','').replaceAll('-',' ')).join(' · ');}
function render(){
 const app=$('#app');
 const options=players.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' — '+esc(teamLabel(p))+'</option>').join('');
 app.innerHTML='<h1>Player and Coach Accounts</h1><p class="muted">Permanent RebelsPrep accounts</p>'+
 (message?'<div class="notice">'+esc(message)+'</div>':'')+
 '<section class="panel"><h2>Waiting for activation</h2>'+
 (pending.length?pending.map(a=>'<div class="account-activation"><div><strong>'+esc(a.email||a.displayName||'Pending login')+'</strong><small>Signed in · waiting for a profile</small></div><select data-player-for="'+esc(a.uid)+'"><option value="">Choose player…</option>'+options+'</select><select data-coach-for="'+esc(a.uid)+'"><option value="">Or choose coach…</option>'+coaches.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select><button class="primary" data-activate="'+esc(a.uid)+'" '+(busy?'disabled':'')+'>Activate</button></div>').join(''):'<p class="empty">No logins are waiting for activation.</p>')+
 '</section><section class="panel"><h2>How this works</h2><p class="muted">A player or coach signs in first. Their login appears here. You connect it to the correct player or coach once. After that, the same account always opens that person’s RebelsPrep area.</p><p class="muted">8U–12U players are intentionally excluded from individual accounts; their teams remain fully available to coaches in the practice builder.</p></section><div class="actions"><a class="portal-open" href="./">Back to Practice Builder</a></div>';
 document.querySelectorAll('[data-activate]').forEach(b=>b.onclick=()=>activate(b.dataset.activate));
}
async function activate(uid){
 const coachSelect=document.querySelector('[data-coach-for="'+CSS.escape(uid)+'"]'),coach=coaches.find(c=>c.id===coachSelect?.value);
 const select=document.querySelector('[data-player-for="'+CSS.escape(uid)+'"]'),player=players.find(p=>p.id===select?.value);
 if((!player&&!coach)||(player&&coach)){message='Choose either the correct player or coach before activating.';render();return;}
 const login=pending.find(a=>a.uid===uid);
 if(!confirm('Connect '+(login?.email||'this login')+' permanently to '+(player||coach).name+'?'))return;
 busy=true;message='Activating '+(player||coach).name+'…';render();
 try{if(coach)await activateCoachAccount(uid,coach);else await activatePlayerAccount(uid,player);message=(player||coach).name+' is activated.';pending=await pendingPlayerAccounts();}
 catch(e){message=e.message;}busy=false;render();
}
async function load(){
 try{
  const {account}=await accountContext();
  if(!isOrgCoach(account)){location.replace('./');return;}
  [players,pending]=await Promise.all([eligiblePlayerDirectory(),pendingPlayerAccounts()]);
 }catch(e){message=e.message;}
 render();
}
load();