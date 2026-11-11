import {services,canAccessTeam,isOrgCoach} from './account-model-rp276.mjs?v=rp276';
import {rosterPlayers} from './team-rosters.mjs';
import {teams} from './teams.mjs';
import {applyRosterSnapshot} from './roster-cache.mjs';

const virtual=new Set(['kc-rebels-nationals','kc-rebels-all-regional']);
export function mergeRosterTeam(teamId,docs){
 applyRosterSnapshot(rosterPlayers,teams,teamId,docs);
}
export async function refreshRosters(account){
 const permitted=teams.filter(t=>!virtual.has(t.id)&&canAccessTeam(account,t.id));
 if(!permitted.length)return 0;
 const {F,db}=await services();
 let total=0;
 // All reads finish before mutating the in-memory rosters, so a permission
 // failure never leaves half the organization's team arrays modified.
 const snapshots=await Promise.all(permitted.map(async t=>{
  const directory=await F.getDoc(F.doc(db,'rpDirectoryTeams',t.id));
  if(!directory.exists())throw Error('Team roster is not provisioned: '+t.name);
  const ids=[...new Set(directory.data().playerIds||[])];
  const snapshots=await Promise.all(ids.map(id=>F.getDoc(F.doc(db,'rpPlayers',id))));
  const docs=snapshots.filter(d=>d.exists()).map(d=>({id:d.id,...d.data()}));
  return {teamId:t.id,docs};
 }));
 for(const item of snapshots){mergeRosterTeam(item.teamId,item.docs);total+=item.docs.length;}
 return total;
}
