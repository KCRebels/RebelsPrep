export function selectionKey(ids){
 const unique=[...new Set(ids)].sort();
 if(!unique.length)throw Error('Choose at least one team.');
 return unique.length===1?unique[0]:'combined--'+unique.join('--');
}
export function combinedTeam(catalog,ids){
 const selected=catalog.filter(t=>ids.includes(t.id));
 if(!selected.length)throw Error('Choose at least one team.');
 const people=new Map();
 for(const t of selected)for(const p of t.players){
  const identity=p.name.trim().toLowerCase().replace(/\s+/g,' ');
  const previous=people.get(identity);
  if(previous){previous.pitcher=Boolean(previous.pitcher||p.pitcher);previous.catcher=Boolean(previous.catcher||p.catcher);previous.memberTeamIds.push(t.id);}
  else people.set(identity,{...p,memberTeamIds:[t.id]});
 }
 return {id:selectionKey(selected.map(t=>t.id)),teamIds:selected.map(t=>t.id),name:selected.map(t=>t.name).join(' + '),players:[...people.values()],missingRosters:selected.filter(t=>!t.players.length).map(t=>t.name)};
}
