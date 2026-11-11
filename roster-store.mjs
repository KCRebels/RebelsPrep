import {services,canAccessTeam,isOrgCoach} from './account-model-rp276.mjs?v=rp276';
import {planAddPlayer,planRemovePlayer,planTransferPlayer,rosterForTeam,cleanName} from './roster-management.mjs';
import {teams} from './teams.mjs';

function assertTeam(account,teamId){
 if(!teams.some(t=>t.id===teamId)||['kc-rebels-nationals','kc-rebels-all-regional'].includes(teamId))throw Error('Choose an individual Rebels team.');
 if(!canAccessTeam(account,teamId))throw Error('You do not have permission to manage this team.');
}
function sourceRecord(doc){return {id:doc.id,...doc.data()};}
export async function loadTeamRoster(account,teamId,getServices=services){
 assertTeam(account,teamId);
 const {F,db}=await getServices();
 const team=await F.getDoc(F.doc(db,'rpDirectoryTeams',teamId));
 if(!team.exists())throw Error('This team has not been provisioned in RebelsPrep.');
 const ids=[...new Set(team.data().playerIds||[])];
 const docs=await Promise.all(ids.map(id=>F.getDoc(F.doc(db,'rpPlayers',id))));
 return rosterForTeam(docs.filter(d=>d.exists()).map(sourceRecord),teamId);
}
export async function addRosterPlayer(account,teamId,values,getServices=services){
 assertTeam(account,teamId);
 const players=await loadTeamRoster(account,teamId,getServices);
 const record=planAddPlayer({...values,teamId},players);
 const {F,db,auth}=await getServices();
 if(!auth.currentUser)throw Error('Sign in as a coach first.');
 const ref=F.doc(F.collection(db,'rpPlayers'));
 const team=teams.find(t=>t.id===teamId);
 const portalEnabled=/^KC Rebels (14|16|18)(?:\s|B\b)/.test(team.name);
 const batch=F.writeBatch(db);
 batch.set(ref,{...record,aliases:[],groupIds:[],source:'coach',playerPortalEnabled:portalEnabled,createdAt:F.serverTimestamp(),createdBy:auth.currentUser.uid});
 batch.update(F.doc(db,'rpDirectoryTeams',teamId),{playerIds:F.arrayUnion(ref.id)});
 await batch.commit();
 return ref.id;
}
export async function editRosterPlayer(account,teamId,playerId,changes,getServices=services){
 assertTeam(account,teamId);
 const {F,db}=await getServices();
 const ref=F.doc(db,'rpPlayers',playerId);
 const name=cleanName(changes.name);
 const email=String(changes.email||'').trim().toLowerCase();
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email or leave it blank.');
 const jerseyNumber=String(changes.jerseyNumber||'').trim();
 if(jerseyNumber.length>12)throw Error('Jersey number is too long.');
 await F.runTransaction(db,async tx=>{
  const current=await tx.get(ref);
  if(!current.exists()||!current.data().teamIds?.includes(teamId))throw Error('Player is no longer on this team.');
  if(!isOrgCoach(account)&&current.data().teamIds.length!==1)throw Error('This player belongs to multiple teams. An organization admin must edit her.');
  tx.update(ref,{name,email,jerseyNumber,pitcher:changes.pitcher===true,catcher:changes.catcher===true,updatedAt:F.serverTimestamp()});
 });
}
export async function removeRosterPlayer(account,teamId,playerId,getServices=services){
 assertTeam(account,teamId);
 const {F,db}=await getServices();
 const ref=F.doc(db,'rpPlayers',playerId),directory=F.doc(db,'rpDirectoryTeams',teamId);
 await F.runTransaction(db,async tx=>{
  const snap=await tx.get(ref),roster=await tx.get(directory);
  if(!roster.exists())throw Error('Team roster is not provisioned.');
  if(!snap.exists()||!snap.data().teamIds?.includes(teamId))throw Error('Player is no longer on this team.');
  if(!isOrgCoach(account)&&snap.data().teamIds.length!==1)throw Error('This player belongs to multiple teams. Ask an organization admin to remove her.');
  const update=planRemovePlayer(snap.data(),teamId);
  tx.update(ref,{teamIds:update.teamIds,active:update.active,playerPortalEnabled:update.playerPortalEnabled,updatedAt:F.serverTimestamp(),email:String(snap.data().email||''),jerseyNumber:String(snap.data().jerseyNumber||'')});
  tx.update(directory,{playerIds:F.arrayRemove(playerId)});
 });
}
export async function transferRosterPlayer(account,fromTeamId,toTeamId,playerId,getServices=services){
 assertTeam(account,fromTeamId);assertTeam(account,toTeamId);
 if(!isOrgCoach(account))throw Error('Transfers between teams require an organization admin.');
 const {F,db}=await getServices();
 const ref=F.doc(db,'rpPlayers',playerId);
 const source=F.doc(db,'rpDirectoryTeams',fromTeamId),target=F.doc(db,'rpDirectoryTeams',toTeamId);
 await F.runTransaction(db,async tx=>{
  const snap=await tx.get(ref),from=await tx.get(source),to=await tx.get(target);
  if(!snap.exists())throw Error('Player not found.');
  if(!from.exists()||!to.exists())throw Error('Both team rosters must be provisioned.');
  const next=planTransferPlayer(snap.data(),fromTeamId,toTeamId);
  tx.update(ref,{teamIds:next.teamIds,active:true,playerPortalEnabled:next.teamIds.some(id=>/^KC Rebels (14|16|18)(?:\s|B\b)/.test(teams.find(t=>t.id===id)?.name||'')),updatedAt:F.serverTimestamp()});
  tx.update(source,{playerIds:F.arrayRemove(playerId)});
  tx.update(target,{playerIds:F.arrayUnion(playerId)});
 });
}
