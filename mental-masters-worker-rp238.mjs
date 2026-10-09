import './worker.mjs?v=structural237';

const baseHandler=self.onmessage;
const BJ_ID='rp-c-57';
const MIN=5,MAX=15,PREFERRED_MIN=8,PREFERRED_MAX=12;

function mentalMastersAvailable(input){
 const hitting=!input?.practiceType||String(input.practiceType).toLowerCase().includes('hitting');
 const bj=(input?.coaches||[]).some(c=>c.id===BJ_ID);
 return hitting&&bj;
}
function groupScore(n){
 if(n>=PREFERRED_MIN&&n<=PREFERRED_MAX)return 100-Math.abs(10-n);
 if(n>=MIN&&n<=MAX)return 50-Math.abs(10-n);
 return -1000;
}
function combinations(items){
 const out=[];
 const walk=(at,pick,total)=>{
  if(total>MAX)return;
  if(pick.length>=2&&total>=MIN)out.push({group:[...pick],players:pick.flatMap(s=>s.players||[]),total});
  for(let i=at;i<items.length;i++)walk(i+1,[...pick,items[i]],total+(items[i].players?.length||0));
 };
 walk(0,[],0);
 return out.sort((a,b)=>groupScore(b.total)-groupScore(a.total)||a.group.length-b.group.length);
}
function reserveBJ(block,coaches){
 const existing=(block.stations||[]).find(s=>s.coach===BJ_ID);
 if(!existing)return true;
 const used=new Set((block.stations||[]).map(s=>s.coach).filter(Boolean));
 const replacement=coaches.find(c=>c.id!==BJ_ID&&!used.has(c.id)&&!(existing.kind==='warm'&&/\bdan\s+lickel\b/i.test(c.name||'')));
 if(!replacement)return false;
 existing.coach=replacement.id;
 return true;
}
function rebuildCoachAssignments(block,coaches){
 const used=new Set((block.stations||[]).map(s=>s.coach).filter(Boolean));
 block.coaching=coaches.filter(c=>!used.has(c.id)).map(c=>c.id);
 block.coachAssignments=coaches.map(c=>{
  const station=(block.stations||[]).find(s=>s.coach===c.id);
  return station?{coach:c.id,assignment:station.drill||station.kind,role:station.coachRole||'Coach station',stationKind:station.kind,players:[...(station.players||[])],pitcher:station.pitcher||null,catcher:station.catcher||null}:{coach:c.id,assignment:'Coaching',role:'Coaching',stationKind:'coaching',players:[],pitcher:null,catcher:null};
 });
}
function addMentalMasters(plan,input){
 if(!plan||!mentalMastersAvailable(input))return plan;
 const coaches=input.coaches||[],served=new Set();let sessions=0;
 for(const block of plan.blocks||[]){
  if(!reserveBJ(block,coaches))continue;
  const drills=(block.stations||[]).filter(s=>s.kind==='drill'&&Array.isArray(s.players)&&s.players.length&&(s.players||[]).every(id=>!served.has(id)));
  const chosen=combinations(drills)[0];
  if(!chosen||chosen.total<MIN||chosen.total>MAX)continue;
  const remove=new Set(chosen.group);
  block.stations=block.stations.filter(s=>!remove.has(s));
  block.stations.push({kind:'mental',drill:'Mental Masters',players:chosen.players,coach:BJ_ID,coachRole:'Run Mental Masters',resource:'No space/equipment required',capacity:'8–12 preferred; 5–15 allowed'});
  chosen.players.forEach(id=>served.add(id));sessions++;
  rebuildCoachAssignments(block,coaches);
 }
 plan.mentalMasters={enabled:true,coach:BJ_ID,sessions,players:[...served],preferredMin:PREFERRED_MIN,preferredMax:PREFERRED_MAX,min:MIN,max:MAX};
 // A zero-session Mental Masters note is not a plan error. Only report it when a session was actually scheduled.
 if(sessions)plan.warnings=[...(plan.warnings||[]),'Mental Masters: '+served.size+' players scheduled with BJ Fox across '+sessions+' block'+(sessions===1?'':'s')+' (8–12 preferred; 5–15 allowed).'];
 return plan;
}
function rotations(players){
 const out=[],seen=new Set(),add=a=>{const key=a.map(p=>p.id).join('|');if(!seen.has(key)){seen.add(key);out.push(a);}};
 add(players);
 add([...players].reverse());
 for(let n=1;n<players.length&&out.length<24;n++)add(players.slice(n).concat(players.slice(0,n)));
 return out;
}
function planRank(plan){
 if(!plan)return -Infinity;
 const pitchers=plan.missingPitchers?.length||0;
 const mandatory=(plan.missingMachine?.length||0)+(plan.missingFront?.length||0);
 const live=plan.missingLive?.length||0;
 const catchers=plan.missingCatchers?.length||0;
 return -pitchers*1000000000-mandatory*10000000-live*10000-catchers*100+(plan.score||0);
}
function buildBestSmallTeam(event,raw){
 const players=raw?.players||[];
 if(event?.data?.mode!=='build'||players.length<3||players.length>24)return null;
 let best=null,bestRank=-Infinity;
 for(const order of rotations(players)){
  const messages=[];
  const originalPost=self.postMessage;
  self.postMessage=m=>messages.push(m);
  try{baseHandler({data:{...event.data,input:{...raw,players:order}}});}catch{}finally{self.postMessage=originalPost;}
  const msg=messages.find(m=>m?.plan)||messages[0];
  if(msg?.plan){const rank=planRank(msg.plan);if(rank>bestRank){bestRank=rank;best=msg;}if((msg.plan.missingPitchers?.length||0)===0&&(msg.plan.missingMachine?.length||0)===0&&(msg.plan.missingFront?.length||0)===0)break;}
 }
 return best;
}

self.onmessage=event=>{
 const raw=event?.data?.input||event?.data||{};
 const best=buildBestSmallTeam(event,raw);
 if(best){if(best.plan)addMentalMasters(best.plan,raw);self.postMessage(best);return;}
 const originalPost=self.postMessage.bind(self);
 self.postMessage=message=>{
  if(message?.plan)addMentalMasters(message.plan,raw);
  originalPost(message);
 };
 try{return baseHandler(event);}finally{self.postMessage=originalPost;}
};
