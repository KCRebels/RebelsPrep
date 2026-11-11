// Permanent roster operations. These helpers do not modify HotB records.
export const VIRTUAL_TEAM_IDS=new Set(['kc-rebels-nationals','kc-rebels-all-regional']);
export function cleanName(value){
 const name=String(value||'').trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>100)throw Error('Enter a player name (2–100 characters).');
 return name;
}
export function cleanTeamIds(ids){
 return [...new Set((Array.isArray(ids)?ids:[]).filter(id=>typeof id==='string'&&id&&!VIRTUAL_TEAM_IDS.has(id)))];
}
export function canonicalPlayer(id,data={}){
 return {id,name:String(data.name||'').trim(),teamIds:cleanTeamIds(data.teamIds),pitcher:data.pitcher===true,catcher:data.catcher===true,active:data.active!==false,playerPortalEnabled:data.playerPortalEnabled===true,jerseyNumber:String(data.jerseyNumber||'').trim(),email:String(data.email||'').trim()};
}
export function rosterForTeam(players,teamId){
 return players.map(p=>canonicalPlayer(p.id,p)).filter(p=>p.active&&p.teamIds.includes(teamId)).sort((a,b)=>a.name.localeCompare(b.name));
}
export function planAddPlayer({name,teamId,pitcher=false,catcher=false,email='',jerseyNumber=''},existing=[]){
 const label=cleanName(name);
 if(!teamId||VIRTUAL_TEAM_IDS.has(teamId))throw Error('Select an individual Rebels team.');
 if(existing.some(p=>p.name?.trim().toLocaleLowerCase()===label.toLocaleLowerCase()&&cleanTeamIds(p.teamIds).includes(teamId)))throw Error('That player is already on this team.');
 const address=String(email||'').trim().toLowerCase();
 if(address&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw Error('Enter a valid email or leave it blank.');
 const number=String(jerseyNumber||'').trim();
 if(number.length>12)throw Error('Jersey number is too long.');
 return {name:label,teamIds:[teamId],pitcher:!!pitcher,catcher:!!catcher,email:address,jerseyNumber:number,active:true};
}
export function planRemovePlayer(player,teamId){
 const teamIds=cleanTeamIds(player.teamIds);
 if(!teamIds.includes(teamId))throw Error('Player is not on that team.');
 const remaining=teamIds.filter(id=>id!==teamId);
 return {...player,teamIds:remaining,active:remaining.length>0,playerPortalEnabled:remaining.length>0&&player.playerPortalEnabled===true};
}
export function planTransferPlayer(player,fromTeamId,toTeamId){
 if(!toTeamId||VIRTUAL_TEAM_IDS.has(toTeamId)||fromTeamId===toTeamId)throw Error('Choose a different individual Rebels team.');
 if(!cleanTeamIds(player.teamIds).includes(fromTeamId))throw Error('Player is not on the source team.');
 return {...player,teamIds:[...new Set([...cleanTeamIds(player.teamIds).filter(id=>id!==fromTeamId),toTeamId])],active:true};
}
export function canManageTeam(account,teamId){
 return Boolean(account?.active&&(account.role==='org_admin'||account.role==='org_coach'||account.role==='team_coach'&&account.teamIds?.includes(teamId)));
}
