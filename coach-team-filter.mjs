import {coaches} from './roster.mjs?v=rpbuild33';

const KEY='RebelsPrep:coach-pilot:1';
const master=coaches.map(c=>({...c,teamIds:[...(c.teamIds||[])]}));
let signature='';

function selectedTeamIds(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const raw=localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY);
  if(raw){
   const draft=JSON.parse(raw);
   if(Array.isArray(draft.teamIds)&&draft.teamIds.length)return draft.teamIds;
   if(draft.teamId)return [draft.teamId];
  }
  return active.includes('+')?active.split('+'):[active];
 }catch{return ['kc-rebels-nationals'];}
}

export function syncCoachesToSelectedTeams(){
 const teamIds=selectedTeamIds();
 const nextSignature=teamIds.slice().sort().join('|');
 if(nextSignature===signature)return;
 signature=nextSignature;
 const allowed=master.filter(c=>c.teamIds.some(id=>teamIds.includes(id)));
 coaches.splice(0,coaches.length,...allowed);
}

syncCoachesToSelectedTeams();
setInterval(syncCoachesToSelectedTeams,100);
