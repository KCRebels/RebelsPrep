import {accountContext,isCoach,isOrgCoach} from './account-model-rp276.mjs?v=rp276';
import {teams} from './teams.mjs';
import {loadTeamRoster,addRosterPlayer,editRosterPlayer,removeRosterPlayer,transferRosterPlayer} from './roster-store.mjs';
import {canManageTeam} from './roster-management.mjs';

const app=document.getElementById('app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const individual=teams.filter(t=>!['kc-rebels-nationals','kc-rebels-all-regional'].includes(t.id));
let ctx=null,teamId='',players=[],busy=false,error='',message='',editId='',mode='list';
function shell(body){
 app.innerHTML='<div class="rm-shell"><a class="rm-back" href="./coach.html?v=420">← Back to Coaches</a><h1>Manage Roster</h1><p class="rm-subtitle">Add or remove permanent players from your assigned team.</p>'+ (error?'<p class="rm-error" role="alert">'+esc(error)+'</p>':'')+(message?'<p class="rm-success" role="status">'+esc(message)+'</p>':'')+body+'</div>';
}
function permittedTeams(){return individual.filter(t=>canManageTeam(ctx?.account,t.id));}
function page(){
 const choices=permittedTeams();if(!choices.length){shell('<p>You do not have a team assigned. Ask your RebelsPrep administrator.</p>');return;}
 const pick='<label class="rm-label">Team<select id="rm-team">'+choices.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===teamId?'selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select></label>';
 if(mode==='form'){
  const p=players.find(p=>p.id===editId)||{};
  shell(pick+'<form id="rm-form" class="rm-form"><h2>'+(editId?'Edit Player':'Add Player')+'</h2><label class="rm-label">Player name<input required maxlength="100" name="name" value="'+esc(p.name||'')+'"></label><label class="rm-label">Email (optional)<input type="email" maxlength="254" name="email" value="'+esc(p.email||'')+'"></label><label class="rm-label">Jersey number (optional)<input maxlength="12" name="jerseyNumber" value="'+esc(p.jerseyNumber||'')+'"></label><div class="rm-checks"><label><input type="checkbox" name="pitcher" '+(p.pitcher?'checked':'')+'> Pitcher</label><label><input type="checkbox" name="catcher" '+(p.catcher?'checked':'')+'> Catcher</label></div><div class="rm-actions"><button type="button" id="rm-cancel">Cancel</button><button class="rm-primary" type="submit" '+(busy?'disabled':'')+'>Save Player</button></div></form>');
 }else{
  shell(pick+'<div class="rm-actions"><strong>'+players.length+' active players</strong><button class="rm-primary" id="rm-add">+ Add Player</button></div><div class="rm-players">'+players.map(p=>'<article class="rm-player"><div><strong>'+esc(p.name)+'</strong><small>'+(p.pitcher?'Pitcher ':'')+(p.catcher?'Catcher ':'')+(p.jerseyNumber?'#'+esc(p.jerseyNumber):'')+'</small></div><div class="rm-actions"><button data-edit="'+esc(p.id)+'">Edit</button><button data-remove="'+esc(p.id)+'">Remove</button>'+(isOrgCoach(ctx.account)?'<button data-transfer="'+esc(p.id)+'">Transfer</button>':'')+'</div></article>').join('')+'</div>');
 }
 document.querySelectorAll('button, input, select').forEach(el=>el.disabled=busy);
 const selector=document.getElementById('rm-team');
 selector?.addEventListener('change',e=>{teamId=e.target.value;editId='';mode='list';reload();});
 document.getElementById('rm-add')?.addEventListener('click',()=>{editId='';mode='form';error='';page();});
 document.getElementById('rm-cancel')?.addEventListener('click',()=>{editId='';mode='list';error='';page();});
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{editId=b.dataset.edit;mode='form';error='';page();}));
 document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>remove(b.dataset.remove)));
 document.querySelectorAll('[data-transfer]').forEach(b=>b.addEventListener('click',()=>transfer(b.dataset.transfer)));
 document.getElementById('rm-form')?.addEventListener('submit',e=>{e.preventDefault();save(new FormData(e.currentTarget));});
}
let loadVersion=0;
async function reload(){
 const version=++loadVersion, selected=teamId;players=[];page();
 try{error='';const rows=await loadTeamRoster(ctx.account,selected);if(version!==loadVersion)return;players=rows;page();}catch(e){if(version!==loadVersion)return;error=e.message||String(e);page();}
}
async function save(form){
 if(busy)return;busy=true;error='';message='';page();
 const values={name:form.get('name'),email:form.get('email'),jerseyNumber:form.get('jerseyNumber'),pitcher:form.has('pitcher'),catcher:form.has('catcher')};
 try{if(editId)await editRosterPlayer(ctx.account,teamId,editId,values);else await addRosterPlayer(ctx.account,teamId,values);message=editId?'Player updated.':'Player added.';editId='';mode='list';await reload();}
 catch(e){error=e.message||String(e);page();}
 finally{busy=false;page();}
}
async function remove(id){
 if(busy)return;const player=players.find(p=>p.id===id);if(!player)return;
 if(!confirm('Remove '+player.name+' from this team? This does not affect HotB.'))return;
 busy=true;error='';message='';page();
 try{await removeRosterPlayer(ctx.account,teamId,id);message=player.name+' removed from this team.';await reload();}
 catch(e){error=e.message||String(e);page();}
 finally{busy=false;page();}
}
async function transfer(id){
 if(busy||!isOrgCoach(ctx.account))return;
 const player=players.find(p=>p.id===id);if(!player)return;
 const choices=permittedTeams().filter(t=>t.id!==teamId);
 const selected=prompt('Transfer '+player.name+' to which team? Enter a team ID:\n'+choices.map(t=>t.id+' — '+t.name).join('\n'));
 if(selected===null)return;
 const target=choices.find(t=>t.id===selected.trim());
 if(!target){error='Choose a listed team ID.';page();return;}
 if(!confirm('Transfer '+player.name+' to '+target.name+'? Her player identity and history will be preserved.'))return;
 busy=true;error='';message='';page();
 try{await transferRosterPlayer(ctx.account,teamId,target.id,id);message='Player transferred.';await reload();}
 catch(e){error=e.message||String(e);}
 finally{busy=false;page();}
}
try{
 ctx=await accountContext();
 if(!ctx?.user||!isCoach(ctx.account)){shell('<p>Sign in as an assigned coach to manage a team roster.</p><a href="./coach.html?v=420">Coach Sign In</a>');}
 else{teamId=permittedTeams()[0]?.id||'';await reload();}
}catch(e){error=e.message||String(e);shell('<a href="./coach.html?v=420">Return to Coach Sign In</a>');}
