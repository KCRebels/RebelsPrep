const BJ_ID='rp-c-57';
const ALL_NATIONAL='kc-rebels-nationals';
const MIN=5,MAX=15,PREFERRED_MIN=8,PREFERRED_MAX=12;

function allNational(input){
 const ids=[...(Array.isArray(input?.teamIds)?input.teamIds:[]),input?.teamId].filter(Boolean);
 return ids.includes(ALL_NATIONAL);
}
function bjAttending(input){return (input?.coaches||[]).some(c=>c.id===BJ_ID);}
function score(n){
 if(n>=PREFERRED_MIN&&n<=PREFERRED_MAX)return 100-Math.abs(10-n);
 if(n>=MIN&&n<=MAX)return 50-Math.abs(10-n);
 return -1000;
}
function combinations(items){
 const out=[];
 const walk=(at,pick,total)=>{
  if(total>MAX)return;
  if(pick.length>=2&&total>=MIN)out.push({pick:[...pick],total});
  for(let i=at;i<items.length;i++)walk(i+1,[...pick,items[i]],total+(items[i].players?.length||0));
 };
 walk(0,[],0);return out.sort((a,b)=>score(b.total)-score(a.total)||a.pick.length-b.pick.length);
}
function rebuildAssignments(block,coaches){
 const used=new Set(block.stations.map(s=>s.coach).filter(Boolean));
 block.coaching=coaches.filter(c=>!used.has(c.id)).map(c=>c.id);
 block.coachAssignments=coaches.map(c=>{
  const station=block.stations.find(s=>s.coach===c.id);
  return station?{coach:c.id,assignment:station.drill||station.kind,role:station.coachRole||'Coach station',stationKind:station.kind,players:[...(station.players||[])],pitcher:station.pitcher||null,catcher:station.catcher||null}:{coach:c.id,assignment:'Coaching',role:'Coaching',stationKind:'coaching',players:[],pitcher:null,catcher:null};
 });
}
function freeBJ(block,coaches){
 const current=block.stations.find(s=>s.coach===BJ_ID);
 if(!current)return true;
 const used=new Set(block.stations.map(s=>s.coach).filter(Boolean));
 const replacement=coaches.find(c=>c.id!==BJ_ID&&!used.has(c.id)&&!(current.kind==='warm'&&/\bdan\s+lickel\b/i.test(c.name||'')));
 if(!replacement)return false;
 current.coach=replacement.id;
 return true;
}
export function applyMentalMasters(plan,input){
 if(!plan||!allNational(input)||!bjAttending(input))return plan;
 const coaches=input.coaches||[],seen=new Set();let sessions=0;
 for(const block of plan.blocks||[]){
  if(!freeBJ(block,coaches))continue;
  const candidates=(block.stations||[]).filter(s=>s.kind==='drill'&&Array.isArray(s.players)&&s.players.length&&s.players.every(id=>!seen.has(id)));
  const choice=combinations(candidates)[0];if(!choice)continue;
  const chosen=new Set(choice.pick),players=choice.pick.flatMap(s=>s.players);
  if(players.length<MIN||players.length>MAX)continue;
  block.stations=block.stations.filter(s=>!chosen.has(s));
  block.stations.push({kind:'mental',drill:'Mental Masters',players,coach:BJ_ID,coachRole:'Run Mental Masters',resource:'No space/equipment required',capacity:{min:MIN,max:MAX,preferredMin:PREFERRED_MIN,preferredMax:PREFERRED_MAX}});
  players.forEach(id=>seen.add(id));sessions++;rebuildAssignments(block,coaches);
 }
 plan.mentalMasters={enabled:true,coach:BJ_ID,min:MIN,max:MAX,preferredMin:PREFERRED_MIN,preferredMax:PREFERRED_MAX,sessions,players:[...seen]};
 plan.warnings=[...(plan.warnings||[]),'Mental Masters: '+seen.size+' players scheduled with BJ Fox across '+sessions+' block'+(sessions===1?'':'s')+' (8–12 preferred; 5–15 allowed).'];
 return plan;
}
