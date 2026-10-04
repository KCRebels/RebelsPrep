export const clockMinutes = s => {const [h,m]=String(s).split(':').map(Number);return h*60+m;};
export const timeLabel = t => {t=((t%1440)+1440)%1440;const h=Math.floor(t/60),m=t%60;return (h%12||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM');};
export function partitionable(n){return n===0||n>=3&&n!==5;}
function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const counts = (a,id)=>a.filter(x=>x===id).length;
function prepare(input){
 const step=Number(input.blockMinutes),duration=Number(input.durationMinutes),start=clockMinutes(input.start);
 if(![10,12,15].includes(step)||!Number.isFinite(start)||!Number.isFinite(duration)||duration<step||duration>360)throw Error('Choose valid time and block settings. Maximum duration is 360 minutes.');
 if(input.facility!=='The Barn')throw Error('Only The Barn is configured.');
 const facility={tees:5,nets:14,machines:1,nineSquare:2,tunnels:2,outsideStations:15};
 const blocks=Math.floor(duration/step);
 const people=input.players.map(p=>{
  const arrival=p.arrival?clockMinutes(p.arrival):start,depart=p.departure?clockMinutes(p.departure):start+duration;
  return {...p,from:Math.max(0,Math.ceil((arrival-start)/step)),until:Math.min(blocks,Math.floor((depart-start)/step)),canPitch:p.pitcher&&p.canPitch!==false,canCatch:p.catcher&&p.canCatch!==false,noPitchWarmup:!!p.noPitchWarmup};
 });
 if(new Set(people.map(p=>p.id)).size!==people.length)throw Error('Each player must have a unique ID.');
 if(people.length<3)throw Error('At least three hitters are needed for 3–4 player stations.');
 if(people.some(p=>p.from>=p.until))throw Error('An included player has no complete available block. Adjust arrival/departure or attendance.');
 const coachIds=new Set(input.coaches.map(c=>c.id));if(coachIds.size!==input.coaches.length)throw Error('Each coach must have a unique ID.');
 const extras=input.drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work');
 const variants={front:input.drills.filter(d=>d.kind==='front'),machine:input.drills.filter(d=>d.kind==='machine')};
 const fixedDrillTees=extras.reduce((n,d)=>n+(d.tees||0),0);
 if(fixedDrillTees>facility.tees)throw Error('The selected drill stations require '+fixedDrillTees+' tees to stay set up for the practice, but The Barn has 5. Choose a combination using 5 or fewer tees.');
 return {people,step,start,blocks,extras,variants,coaches:input.coaches,duration,facility,fixedDrillTees};
}
function attempt(input,prepared,pattern,seed,preferThree=true,diag=null){
 const fail=(reason,detail='')=>{if(diag){diag[reason]=(diag[reason]||0)+1;if(detail&&!diag[reason+'Sample'])diag[reason+'Sample']=detail;}return null;};
 const {people,step,start,blocks,extras,variants,coaches,duration,facility,fixedDrillTees}=prepared,rng=random(seed);
 const memory=new Map(people.map(p=>[p.id,{machine:0,front:0,live:0,pitched:0,caught:0,warm:p.noPitchWarmup,seen:new Set()}]));
 const plan={blockMinutes:step,durationMinutes:duration,start:input.start,facility:input.facility,players:people,coaches,blocks:[],replacements:[],warnings:[],score:0,selectedDrills:input.drills.map(d=>({...d}))};
 const needsOpening=(p,b)=>b===p.from;
 const eligible=p=>p.until>p.from;
 if(people.some(p=>!eligible(p)))return fail('availability');
 const lastLive=pattern.reduce((a,v,i)=>v?i:a,-1);
 for(let b=0;b<blocks;b++){
  let available=people.filter(p=>b>=p.from&&b<p.until),stations=[],usedCoaches=new Set();
  const reserved=new Set();
  const add=(s)=>{stations.push(s);for(const id of [...s.players,s.pitcher,s.catcher].filter(Boolean))reserved.add(id);if(s.coach)usedCoaches.add(s.coach);};
  const warmGroup=available.filter(p=>b===p.from).map(p=>p.id);
  if(warmGroup.length)add({kind:'opening',drill:'Warm Up',players:warmGroup,resource:'Group'});
  let pool=available.filter(p=>!needsOpening(p,b));
  let livePitcher=null,liveCatcher=null;
  if(pattern[b]&&pool.length>=4){
   const pitches=pool.filter(p=>p.canPitch&&memory.get(p.id).warm&&memory.get(p.id).pitched<3).sort((a,z)=>memory.get(a.id).pitched-memory.get(z.id).pitched||a.until-z.until||rng()-.5);
   livePitcher=pitches[0]||null;
   if(livePitcher){
    liveCatcher=pool.filter(p=>p.id!==livePitcher.id&&p.canCatch&&memory.get(p.id).caught<3).sort((a,z)=>memory.get(a.id).caught-memory.get(z.id).caught||rng()-.5)[0]||null;
    if(available.length>45&&!liveCatcher){livePitcher=null;pool=available.filter(p=>!needsOpening(p,b));}
    else pool=pool.filter(p=>p.id!==livePitcher.id&&p.id!==liveCatcher?.id);
    if(pool.length<3){livePitcher=null;liveCatcher=null;pool=available.filter(p=>!needsOpening(p,b));}
   }
  }
  // Pitching warm-ups are human pairs outside the tunnel. Four pairs at most.
  // Coaches are preferred here so catchers remain available as hitters.
  const pairs=[];
  if(!pattern[b]&&b<lastLive){
   const pending=pool.filter(p=>p.canPitch&&!memory.get(p.id).warm).sort((a,z)=>a.until-z.until||rng()-.5);
   for(const p of pending){
    if(pairs.length>=4||!pool.some(q=>q.id===p.id))continue;
    const coach=coaches.find(c=>!usedCoaches.has(c.id));
    const catcher=coach?null:pool.find(q=>q.id!==p.id&&q.canCatch&&!pending.some(v=>v.id===q.id));
    if(!coach&&!catcher)continue;
    const next=pool.filter(q=>q.id!==p.id&&q.id!==catcher?.id);
    // Leave enough hitters for at least one 3–4 player core station.
    if(next.length<3)continue;
    pool=next;
    const s={kind:'warm',drill:'Pitching Warm Up',players:[p.id],catcher:catcher?.id||null,coach:coach?.id||null,resource:'Warm-up pair '+(pairs.length+1)};
    pairs.push(s);if(coach)usedCoaches.add(coach.id);
   }
  }
  function order(kind){
   return pool.map(p=>({p,score:(
    kind==='live'?(memory.get(p.id).live===0?250:0)-(memory.get(p.id).front>=2?180:0):
    kind==='machine'?(memory.get(p.id).machine===0?220:0):
    ((memory.get(p.id).front===0?230:0)+(input.allowReplacements&&memory.get(p.id).live===0&&memory.get(p.id).front<2?100:0))
   )+(kind==='live'&&(input.previousReplacements||[]).includes(p.id)?300:0)+100/Math.max(1,p.until-b)+(memory.get(p.id).machine===0&&kind==='front'?-35:0)+rng()*50})).sort((a,z)=>z.score-a.score).map(x=>x.p);
  }
  const coreDrill=(kind,index=0)=>{const list=variants[kind],d=list[((kind==='machine'?b:b*2)+index)%list.length];return {kind,drill:kind==='front'?'Front Toss':'Machine',...(d?{drill:d.name,drillId:d.id,tees:d.tees||0,equipment:d.equipment,howItWorks:d.howItWorks,coachingCues:d.coachingCues}:{})};};
  const tunnelUnits=facility.tunnels*2;const machineUnits=2;const liveUnits=livePitcher?2:0;const frontSlots=Math.max(0,tunnelUnits-machineUnits-liveUnits);const fronts=[...Array(Math.min(frontSlots,coaches.filter(c=>!usedCoaches.has(c.id)).length))].map((_,i)=>({...coreDrill('front',i),resource:'Front Toss'}));
  const core=[];
  if(livePitcher)core.push({kind:'live',drill:'Live',resource:'Shared tunnel',pitcher:livePitcher.id,catcher:liveCatcher?.id||null,equipment:liveCatcher?'Player catcher':'9Square'});
  // Alternate allocation order to avoid starving either mandatory hitting method.
  if(b%2===0)core.push({...coreDrill('machine'),resource:'Machine lane'});
  core.push(...fronts);
  if(b%2!==0)core.push({...coreDrill('machine'),resource:'Machine lane'});
  let settled=null;
  function chooseCore(at,chosen,remaining){
   if(at===core.length){
    if(!partitionable(remaining.length))return;
    const coreTees=chosen.reduce((n,s)=>n+(s.tees||0),0);
    if(fixedDrillTees+coreTees>facility.tees)return;
    const fill=fillDrills(remaining,extras,memory,rng,preferThree,facility);
    if(fill){settled=[...chosen,...fill];return true;}return false;
   }
   const c=core[at],saved=pool;pool=remaining;
   const sorted=order(c.kind);pool=saved;
   const liveDebt=people.filter(p=>!memory.get(p.id).live).length;
   const liveSlots=pattern.slice(b).filter(Boolean).length;
   const sizes=c.kind==='live'?(!preferThree||liveDebt>3*liveSlots?[4,3]:[3,4]):(c.kind==='machine'?[4,3,0]:(preferThree?[3,4,0]:[4,3,0]));
   for(const n of sizes){
    if(n>remaining.length||c.kind==='live'&&n===0)continue;
    const group=sorted.slice(0,n),ids=new Set(group.map(p=>p.id));
    const rest=remaining.filter(p=>!ids.has(p.id));
    if(chooseCore(at+1,n?[...chosen,{...c,players:group.map(p=>p.id)}]:chosen,rest))return true;
   }
   return false;
  }
  if(!chooseCore(0,[],pool)){
   // Retry this block without warm-up pairs if their roles prevented valid group sizes.
   if(pairs.length)return fail('partition','block '+(b+1)+' with '+available.length+' available, '+pool.length+' hitting-pool players, '+pairs.length+' pitching warm-up pairs');
   return fail('partition','block '+(b+1)+' with '+available.length+' available and '+pool.length+' hitting-pool players');
  }
  for(const pair of pairs){add(pair);memory.get(pair.players[0]).warm=true;}
  let frontCount=0;
  for(const s of settled){
   if(s.kind==='front'){
    const coach=coaches.find(c=>!usedCoaches.has(c.id));if(!coach)return fail('frontCoach','block '+(b+1));
    s.coach=coach.id;s.resource='Front Toss '+(++frontCount);
   }
   add(s);
   for(const id of s.players){const m=memory.get(id);if(['machine','front','live'].includes(s.kind))m[s.kind]++;else m.seen.add(s.drill);}
   if(s.pitcher)memory.get(s.pitcher).pitched++;
   if(s.kind==='live'&&s.catcher)memory.get(s.catcher).caught++;
  }
  const assignments=new Set(stations.flatMap(s=>[...s.players,s.pitcher,s.catcher].filter(Boolean)));
  if(assignments.size!==available.length)return fail('assignment','block '+(b+1)+': '+assignments.size+' assigned of '+available.length);
  plan.blocks.push({number:b+1,start:start+b*step,end:start+(b+1)*step,stations,coaching:coaches.filter(c=>!usedCoaches.has(c.id)).map(c=>c.id)});
 }
 const missingMachine=people.filter(p=>!memory.get(p.id).machine),missingFront=people.filter(p=>!memory.get(p.id).front);
 if(missingMachine.length||missingFront.length)return fail('mandatory','missing Machine '+missingMachine.length+', Front Toss '+missingFront.length);
 const missingLive=people.filter(p=>!memory.get(p.id).live);
 if(input.allowReplacements){
  if(missingLive.some(p=>memory.get(p.id).front<2))return fail('replacement','missing Live '+missingLive.length+'; at least one lacks second Front Toss');
  plan.replacements=missingLive.map(p=>p.id);
 }
 const pitching=people.filter(p=>p.canPitch&&!memory.get(p.id).pitched),catching=people.filter(p=>p.canCatch&&!memory.get(p.id).caught);
 plan.missingLive=missingLive.map(p=>p.id);plan.missingPitchers=pitching.map(p=>p.id);plan.missingCatchers=catching.map(p=>p.id);
 plan.score=(people.length-missingLive.length)*100+(people.filter(p=>p.canPitch).length-pitching.length)*20+(people.filter(p=>p.canCatch).length-catching.length)*5;
 if(missingLive.length&&!input.allowReplacements)plan.warnings.push(missingLive.length+' hitters still need Live. Choose extra Front Toss replacements or extend the practice.');
 if(plan.replacements.length)plan.warnings.push(plan.replacements.length+' hitters receive a second Front Toss session in place of Live.');
 if(pitching.length)plan.warnings.push(pitching.length+' pitchers have no Live pitching session: '+pitching.map(p=>p.name).join(', ')+'.');
 if(catching.length)plan.warnings.push(catching.length+' catchers have no Live catching session: '+catching.map(p=>p.name).join(', ')+'.');
 const usedIds=new Set(plan.blocks.flatMap(b=>b.stations.map(s=>s.drillId).filter(Boolean)));
 plan.unusedSelectedDrills=input.drills.filter(d=>!usedIds.has(d.id)).map(d=>d.name);
 if(duration%step)plan.warnings.push(duration%step+' minutes at the end are reserved for group wrap-up; station blocks stay '+step+' minutes.');
 plan.requiresAcceptance=(!input.allowReplacements&&missingLive.length>0)||pitching.length>0||catching.length>0;
 return plan;
}
function fillDrills(pool,drills,memory,rng,preferThree=true,facility={tees:5,outsideStations:15}){
 if(!pool.length)return [];
 if(!partitionable(pool.length)||!drills.length)return null;
 let budget=5000;
 function visit(remaining,stations){
  if(!remaining.length)return stations;
  if(stations.length>=facility.outsideStations||--budget<0)return null;
  const usedDrills=new Set(stations.map(s=>s.drill));
  const options=p=>drills.filter(d=>!usedDrills.has(d.name));
  const sorted=remaining.slice().sort((a,b)=>options(a).length-options(b).length);
  const first=sorted[0];const choices=options(first).map(d=>({d,compat:sorted.slice().sort((a,b)=>Number(memory.get(a.id).seen.has(d.name))-Number(memory.get(b.id).seen.has(d.name))),unseen:sorted.filter(p=>!memory.get(p.id).seen.has(d.name)).length,r:rng()})).sort((a,b)=>b.unseen-a.unseen||a.r-b.r);
  for(const {d,compat} of choices){
   for(const n of (preferThree?[3,4]:[4,3])){
    if(compat.length<n||!partitionable(remaining.length-n))continue;
    const group=compat.slice(0,n),ids=new Set(group.map(p=>p.id));
    const rest=remaining.filter(p=>!ids.has(p.id));
    const result=visit(rest,[...stations,{kind:'drill',drill:d.name,drillId:d.id,players:group.map(p=>p.id),tees:d.tees||0,equipment:d.equipment,howItWorks:d.howItWorks,coachingCues:d.coachingCues,resource:'Drill station '+(drills.findIndex(x=>x.id===d.id)+1)}]);
    if(result)return result;
   }
  }
  return null;
 }
 return visit(pool,[]);
}
export function buildPractice(input){
 const prepared=prepare(input),{people,blocks,coaches}=prepared;
 if(!coaches.length)throw Error('Include at least one coach for mandatory Front Toss and human pitching warm-ups.');
 const open=1,total=blocks-open;
 const maxLive=Math.min(Math.floor(total/2),people.filter(p=>p.canPitch).length*3,Math.max(0,total-Math.ceil(people.length/8)));
 const maxActive=Math.max(...Array.from({length:blocks},(_,b)=>people.filter(p=>b>=p.from&&b<p.until&&b!==p.from).length),0);
 const maxAssignableWithSelectedDrills=prepared.extras.length*4+12;
 if(maxActive>maxAssignableWithSelectedDrills)throw Error('This practice has '+maxActive+' hitters available in the same rotation, but '+prepared.extras.length+' selected drill stations plus Machine/Front Toss can place at most '+maxAssignableWithSelectedDrills+' hitters under the 3–4 player rule. Add '+Math.ceil((maxActive-maxAssignableWithSelectedDrills)/4)+' more drill station'+(Math.ceil((maxActive-maxAssignableWithSelectedDrills)/4)===1?'':'s')+'.');
 let best=null,diag={};
 // Independent randomized attempts; no HotB duration normalization or imported scheduler.
 for(let live=maxLive;live>=0;live--){
  const liveCapacity=4*live;
  const frontStationsPerBlock=Math.min(Math.max(0,prepared.facility.tunnels*2-2),coaches.length);
  const frontCapacity=frontStationsPerBlock*4*(total-live);
  if(frontCapacity<people.length)continue;
  const machineCapacity=4*total;
  if(machineCapacity<people.length)continue;
  for(let trial=0;trial<120;trial++){
   const pattern=Array(blocks).fill(false);
   const positions=Array.from({length:Math.max(0,total-1)},(_,i)=>i+open+1);
   const rng=random(901+live*100+trial);
   if(trial%3===0)positions.sort((a,b)=>rng()-.5);
   else if(trial%3===1)positions.sort((a,b)=>b-a);
   else positions.sort((a,b)=>(a%2)-(b%2)||a-b);
   positions.slice(0,live).forEach(i=>pattern[i]=true);
   const threeCapacity=Math.min(prepared.facility.tunnels*2,coaches.length)*3*(total-live);
   const preferThree=threeCapacity>=people.length+(input.allowReplacements?Math.max(0,people.length-4*live):0);
   const candidate=attempt(input,prepared,pattern,12577+trial*37+live*1000,preferThree,diag);
   if(candidate&&(!best||candidate.score>best.score))best=candidate;
   if(candidate&&!candidate.missingLive.length&&!candidate.missingPitchers.length&&!candidate.missingCatchers.length)return candidate;
  }
  if(best)return best;
 }
 if(best)return best;
 const ranked=Object.entries(diag).filter(([k,v])=>typeof v==='number').sort((a,b)=>b[1]-a[1]);const top=ranked[0]?.[0];const detail=top?(diag[top+'Sample']||top)+' ('+diag[top]+' attempts)':'no candidate reached a diagnosable block';throw Error('No valid plan found. Scheduler blocker: '+detail+'.');
}
export function validatePractice(plan){
 const facility={tees:5,nets:14,machines:1,nineSquare:2,tunnels:2,outsideStations:15},errors=[],people=plan.players,ids=new Set(people.map(p=>p.id)),coachIds=new Set(plan.coaches.map(c=>c.id)),mem=new Map(people.map(p=>[p.id,{warm:p.noPitchWarmup,machine:0,front:0,live:0,pitch:0,catch:0,seen:new Set()}]));
 const fixedDrillTees=(plan.selectedDrills||[]).filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work').reduce((n,d)=>n+(d.tees||0),0);
 if(fixedDrillTees>facility.tees)errors.push('Selected drill stations require more than 5 fixed tees');
 for(const [b,block] of plan.blocks.entries()){
  const assigned=new Set(),usedCoaches=new Set(),stationDrills=new Set();let machine=0,front=0,live=0,warmPairs=0,other=0,tees=0;const pending=[];
  function take(id){if(!ids.has(id))errors.push('Unknown player');if(assigned.has(id))errors.push('Conflicting assignment in block '+(b+1));assigned.add(id);const p=people.find(p=>p.id===id);if(p&&(b<p.from||b>=p.until))errors.push('Unavailable player in block '+(b+1));}
  for(const s of block.stations){
   if(s.kind!=='opening')tees+=s.tees||0;
   if(s.drillId&&plan.selectedDrills){const d=plan.selectedDrills.find(d=>d.id===s.drillId);if(!d||d.kind!==s.kind&&s.kind!=='opening'||d&&s.kind!=='opening'&&d.name!==s.drill)errors.push('Drill is not a selected compatible drill');}
   for(const id of s.players)take(id);if(s.pitcher)take(s.pitcher);if(s.catcher)take(s.catcher);
   if(s.coach){if(!coachIds.has(s.coach)||usedCoaches.has(s.coach))errors.push('Invalid or conflicting coach');usedCoaches.add(s.coach);}
   if(!['opening','warm'].includes(s.kind)&&(s.players.length<3||s.players.length>4))errors.push('Station must have 3–4 hitters');
   if(s.kind==='opening'){
    if(s.drill==='Tee Work')errors.push('Opening Tee Work has been removed');
    if(s.drill==='Tee Work')tees+=Math.min(6,s.players.length);
    if(s.drill==='Tee Work')for(const id of s.players)mem.get(id)?.seen.add('Basic Tee Work');
    for(const id of s.players){const p=people.find(p=>p.id===id);if(b!==p.from+(s.drill==='Tee Work'?1:0))errors.push('Opening order invalid');}
   }else if(s.kind==='warm'){
    warmPairs++;if(s.players.length!==1||(!s.catcher&&!s.coach))errors.push('Warm-up needs a human catcher or coach');
    const p=people.find(p=>p.id===s.players[0]);if(!p?.canPitch)errors.push('Ineligible warm-up pitcher');
    if(s.catcher&&!people.find(p=>p.id===s.catcher)?.canCatch)errors.push('Ineligible warm-up catcher');
    pending.push(s.players[0]);
   }else if(s.kind==='live'){
    live++;const p=people.find(p=>p.id===s.pitcher);if(!p?.canPitch||!mem.get(s.pitcher)?.warm)errors.push('Pitcher must warm up before Live');
    if(s.pitcher)mem.get(s.pitcher).pitch++;
    if(s.catcher){if(!people.find(p=>p.id===s.catcher)?.canCatch)errors.push('Ineligible live catcher');mem.get(s.catcher).catch++;}
    else if(s.equipment!=='9Square')errors.push('Live requires player catcher or 9Square');
   }else if(s.kind==='machine')machine++;else if(s.kind==='front'){front++;if(!s.coach)errors.push('Front Toss requires coach');}else{other++;if(stationDrills.has(s.drill))errors.push('A drill station is used twice in one block');stationDrills.add(s.drill);}
   for(const id of s.players){const m=mem.get(id);if(!m)continue;if(['machine','front','live'].includes(s.kind))m[s.kind]++;
    else if(s.kind==='drill'){m.seen.add(s.drill);}
   }
  }
  const tunnelUnits=machine*2+live*2+front;
  if(machine>facility.machines||live>facility.tunnels||tunnelUnits>facility.tunnels*2)errors.push('Tunnel conflict');
  const nonDrillTees=block.stations.filter(s=>s.kind!=='drill'&&s.kind!=='opening').reduce((n,s)=>n+(s.tees||0),0);
  if(warmPairs>4||other>facility.outsideStations||fixedDrillTees+nonDrillTees>facility.tees)errors.push('Barn capacity exceeded');
  for(const p of people){
   if(b>=p.from&&b<p.until&&!assigned.has(p.id))errors.push('Missing assignment');
   if(b===p.from&&!block.stations.some(s=>s.drill==='Warm Up'&&s.players.includes(p.id)))errors.push('Missing opening Warm Up');
  }
  pending.forEach(id=>mem.get(id).warm=true);
 }
 for(const p of people){const m=mem.get(p.id);if(!m.machine||!m.front)errors.push('Mandatory Machine/Front Toss missing');if(m.pitch>3||m.catch>3)errors.push('Live role limit exceeded');if(plan.replacements.includes(p.id)&&m.front<2)errors.push('Replacement Front Toss missing');}
 if(plan.blocks.length*plan.blockMinutes>plan.durationMinutes)errors.push('Duration exceeded');
 return [...new Set(errors)];
}
