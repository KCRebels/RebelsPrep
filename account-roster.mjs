import {rosterPlayers} from './team-rosters.mjs?v=rpbuild34';
import {teams} from './teams.mjs?v=rpbuild34';

const virtualTeamIds=new Set(['kc-rebels-nationals','kc-rebels-all-regional']);
const playerPortalTeamIds=new Set(teams.filter(t=>/^KC Rebels (14|16|18)(?:\s|B\b)/.test(t.name)).map(t=>t.id));
export function canonicalPlayerRecords(){
 return rosterPlayers.map(p=>({
  id:p.id,
  name:p.name,
  aliases:[...new Set(p.aliases||[])],
  teamIds:[...new Set((p.memberTeamIds||[]).filter(id=>!virtualTeamIds.has(id)))],
  groupIds:[...new Set((p.memberTeamIds||[]).filter(id=>virtualTeamIds.has(id)))],
  pitcher:Boolean(p.pitcher),
  catcher:Boolean(p.catcher),
  source:p.roleSource||'roster'
 }));
}
export function rosterAudit(){
 const players=canonicalPlayerRecords(),ids=new Set(),problems=[];
 for(const p of players){
  if(ids.has(p.id))problems.push('Duplicate player ID: '+p.id);ids.add(p.id);
  if(!p.teamIds.length)problems.push('No individual team: '+p.name);
  for(const id of [...p.teamIds,...p.groupIds])if(!teams.some(t=>t.id===id))problems.push('Unknown team '+id+': '+p.name);
 }
 return {playerCount:players.length,teamCount:teams.filter(t=>!virtualTeamIds.has(t.id)).length,problems};
}
export function playerSeedDocuments(){
 return canonicalPlayerRecords().map(p=>({id:p.id,data:{name:p.name,aliases:p.aliases,teamIds:p.teamIds,groupIds:p.groupIds,pitcher:p.pitcher,catcher:p.catcher,source:p.source,active:true,playerPortalEnabled:p.teamIds.some(id=>playerPortalTeamIds.has(id))}}));
}
export function playerPortalPlayers(){return canonicalPlayerRecords().filter(p=>p.teamIds.some(id=>playerPortalTeamIds.has(id)));}
export function teamSeedDocuments(){
 return teams.map(t=>({id:t.id,data:{name:t.name,virtual:virtualTeamIds.has(t.id),active:true,playerPortalEnabled:virtualTeamIds.has(t.id)||playerPortalTeamIds.has(t.id),archivedFromPlayerPortal:!virtualTeamIds.has(t.id)&&!playerPortalTeamIds.has(t.id),playerIds:[...new Set(t.players.map(p=>p.id))]}}));
}
