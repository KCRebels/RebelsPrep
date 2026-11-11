// Apply a complete team snapshot to the shared practice/coach roster cache.
export function applyRosterSnapshot(players, teams, teamId, records) {
 const virtual=new Set(['kc-rebels-nationals','kc-rebels-all-regional']);
 for(const player of players)player.memberTeamIds=(player.memberTeamIds||[]).filter(id=>id!==teamId);
 for(const record of records){
  if(record.active===false||!record.teamIds?.includes(teamId))continue;
  let player=players.find(p=>p.id===record.id);
  if(!player){player={id:record.id,memberTeamIds:[]};players.push(player);}
  Object.assign(player,{name:record.name,pitcher:record.pitcher===true,catcher:record.catcher===true,aliases:record.aliases||[],roleSource:record.source||'coach'});
  // The player document is authoritative for all individual memberships.
  player.memberTeamIds=[...new Set(record.teamIds.filter(id=>!virtual.has(id)))];
 }
 for(const player of players){
  const ids=(player.memberTeamIds||[]).filter(id=>!virtual.has(id));
  if(ids.some(id=>/-national$/.test(id)))ids.push('kc-rebels-nationals');
  if(ids.some(id=>/-regional$/.test(id)))ids.push('kc-rebels-all-regional');
  player.memberTeamIds=ids;
 }
 for(const team of teams)team.players.splice(0,team.players.length,...players.filter(p=>p.memberTeamIds.includes(team.id)));
}
