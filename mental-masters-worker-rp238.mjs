import './worker.mjs?v=structural237';

const baseHandler=self.onmessage;
const BJ_ID='rp-c-57';
const ALL_NATIONAL='kc-rebels-nationals';

function isAllNationalHitting(input){
 const ids=Array.isArray(input?.teamIds)?input.teamIds:[input?.teamId].filter(Boolean);
 const allNational=ids.includes(ALL_NATIONAL);
 const hitting=!input?.practiceType||String(input.practiceType).toLowerCase().includes('hitting');
 const bj=(input?.coaches||[]).some(c=>c.id===BJ_ID);
 return allNational&&hitting&&bj;
}
function addMentalMasters(plan,input){
 if(!plan||!isAllNationalHitting(input))return plan;
 const served=new Set();
 let sessions=0;
 for(const block of plan.blocks||[]){
  const drills=(block.stations||[]).filter(s=>s.kind==='drill'&&(s.players||[]).every(id=>!served.has(id)));
  let chosen=null;
  // Preferred range is 8–12. Three normal 3–4 hitter stations naturally make 9–12.
  for(const n of [3,2]){
   for(let i=0;i<=drills.length-n;i++){
    const group=drills.slice(i,i+n),players=group.flatMap(s=>s.players||[]);
    if(players.length>=8&&players.length<=12){chosen={group,players};break;}
   }
   if(chosen)break;
  }
  // Flexible fallback: 6–7 is allowed rather than making the whole practice fail.
  if(!chosen){
   for(let i=0;i<drills.length-1;i++){
    const group=drills.slice(i,i+2),players=group.flatMap(s=>s.players||[]);
    if(players.length>=6&&players.length<=7){chosen={group,players};break;}
   }
  }
  if(!chosen)continue;
  const remove=new Set(chosen.group);
  block.stations=block.stations.filter(s=>!remove.has(s));
  block.stations.push({kind:'mental',drill:'Mental Masters',players:chosen.players,coach:BJ_ID,coachRole:'Run Mental Masters',resource:'No space/equipment required',capacity:'8–12 preferred; 6–12 allowed'});
  chosen.players.forEach(id=>served.add(id));
  sessions++;
 }
 if(sessions){
  plan.mentalMasters={coach:BJ_ID,sessions,players:[...served],preferredMin:8,min:6,max:12};
  plan.warnings=[...(plan.warnings||[]),'Mental Masters: '+served.size+' players scheduled with BJ Fox across '+sessions+' block'+(sessions===1?'':'s')+'.'];
 }
 return plan;
}

self.onmessage=event=>{
 const raw=event?.data?.input||event?.data||{};
 const originalPost=self.postMessage.bind(self);
 self.postMessage=message=>{
  if(message?.plan)addMentalMasters(message.plan,raw);
  originalPost(message);
 };
 try{return baseHandler(event);}finally{self.postMessage=originalPost;}
};
