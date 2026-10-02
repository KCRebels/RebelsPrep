import {accountContext,isOrgCoach,eligiblePlayerDirectory,pendingPlayerAccounts,activatePlayerAccount} from './account-model.mjs?v=rpadmin1';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let players=[],pending=[],message='',busy=false;
function teamLabel(p){return (p.teamIds||[]).map(id=>id.replace('kc-rebels-','').replaceAll('-',' ')).join(' · ');}
function render(){
 const app=$('#app');
 const options=players.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' — '+esc(teamLabel(p))+'</option>').join('');
 app.innerHTML='<h1>Player Accounts</h1><p class="muted">14U, 16U and 18U permanent RebelsPrep accounts</p>'+
 (message?'<div class="notice">'+esc(message)+'</div>':'')+
 '<section class="panel"><h2>Waiting for activation</h2>'+
 (pending.length?pending.map(a=>'<div class="account-activation"><div><strong>'+esc(a.email||a.displayName||'Pending login')+'</strong><small>Signed in · not connected to a player</small></div><select data-player-for="'+esc(a.uid)+'"><option value="">Choose player…</option>'+options+'</select><button class="primary" data-activate="'+esc(a.uid)+'" '+(busy?'disabled':'')+'>Activate</button></div>').join(''):'<p class="empty">No player logins are waiting for activation.</p>')+
 '</section><section class="panel"><h2>How this works</h2><p class="muted">A player signs in first. Her login appears here. You connect it to the correct eligible player once. After that, the same account always opens that player’s private RebelsPrep area.</p><p class="muted">8U–12U players are intentionally excluded from individual accounts; their teams remain fully available to coaches in the practice builder.</p></section><div class="actions"><a class="portal-open" href="./">Back to Practice Builder</a></div>';
 document.querySelectorAll('[data-activate]').forEach(b=>b.onclick=()=>activate(b.dataset.activate));
}
async function activate(uid){
 const select=document.querySelector('[data-player-for="'+CSS.escape(uid)+'"]'),player=players.find(p=>p.id===select?.value);
 if(!player){message='Choose the correct player before activating.';render();return;}
 const login=pending.find(a=>a.uid===uid);
 if(!confirm('Connect '+(login?.email||'this login')+' permanently to '+player.name+'?'))return;
 busy=true;message='Activating '+player.name+'…';render();
 try{await activatePlayerAccount(uid,player);message=player.name+' is activated.';pending=await pendingPlayerAccounts();}
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