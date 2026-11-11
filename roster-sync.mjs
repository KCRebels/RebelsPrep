import {services,canAccessTeam,isOrgCoach} from './account-model-rp276.mjs?v=rp276';
import {rosterPlayers} from './team-rosters.mjs?v=teamaware101';
import {teams} from './teams.mjs?v=rpbuild34';

const virtual=new Set(['kc-rebels-nationals','kc-rebels-all-regional']);
export function mergeRosterTeam(teamId,docs){
 // Replace membership for this team, not every other team's players.
 for(const p of rosterPlayers)p.memberTeamIds=(p.memberTeamIds||[]).filter(id=>id!==teamId);
 for(const record of docs){
  if(!record.active||!record.teamIds?.includes(teamId))continue;
  let p=rosterPlayers.find(p=>p.id===record.id);
  if(!p){p={id:record.id,name:record.name,aliases:[],memberTeamIds:[],roleSource:'coach',pitcher:false,catcher:false};rosterPlayers.push(p);}
  p.name=record.name;p.pitcher=record.pitcher===true;p.catcher=record.catcher===true;
  p.aliases=record.aliases||p.aliases||[];
  p.memberTeamIds=[...new Set([...(p.memberTeamIds||[]),...record.teamIds,...record.groupIds||[],teamId])];
 }
 for(const t of teams.filter(t=>t.id===teamId))t.players.splice(0,t.players.length,...rosterPlayers.filter(p=>p.memberTeamIds.includes(teamId)));
}
export async function refreshRosters(account,{requireSeed=true}={}){
 const permitted=teams.filter(t=>!virtual.has(t.id)&&canAccessTeam(account,t.id));
 if(!permitted.length)return 0;
 const {F,db}=await services();
 let total=0;
 // All reads finish before mutating the in-memory rosters, so a permission
 // failure never leaves half the organization's team arrays modified.
 const snapshots=await Promise.all(permitted.map(async t=>{
  const q=F.query(F.collection(db,'rpPlayers'),F.where('teamIds','array-contains',t.id));
  const docs=(await F.getDocs(q)).docs.map(d=>({id:d.id,...d.data()}));
  return {teamId:t.id,docs};
 }));
 if(requireSeed&&snapshots.every(x=>x.docs.length===0))throw Error('The Firestore roster has not been provisioned. Existing roster was kept.');
 for(const item of snapshots){mergeRosterTeam(item.teamId,item.docs);total+=item.docs.length;}
 return total;
}
