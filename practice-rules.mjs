/* RebelsPrep practice configuration and validation.
 * Roster and facility recovery is incomplete: never generate fake players or stations.
 */
export const settings = Object.freeze({
 team: 'KC Rebels Nationals', facility: 'The Barn', start: '17:30',
 durationMinutes: 180, blockMinutes: 12, transitionMinutes: 1,
 blockOptions: [10,12,15], expectedPlayers:45, expectedCoaches:9,
 builders:['Dan Lickel','Chris Olsen','Halley Rindom','Jimmy Miles','Dwight Mayhugh'],
 rosterManagers:['Dan Lickel','Chris Olsen'],
 practiceTypes:['Hitting','Fielding','Full Practice'],
 facilities:['The Barn','The Shed','Lone Elm','The Fields'],
 recoveryComplete:false
});
export const confirmedBarnResources = [
 {id:'machine',name:'Machine lane',uses:['Machine'],capacity:1},
 {id:'tunnel',name:'Shared tunnel',uses:['Live','Front Toss'],liveCapacity:1,frontTossCapacity:2}
];
export function attending(roster, responses) {
 return roster.filter(player => responses[player.id] === 'Coming');
}
export function validatePlan(plan, players) {
 const issues=[];
 const ids=new Set(players.map(p=>p.id));
 const pitchers=new Set(players.filter(p=>p.pitcher).map(p=>p.id));
 const catchers=new Set(players.filter(p=>p.catcher).map(p=>p.id));
 const liveCounts=new Map(),catchCounts=new Map(),warm=new Set(),seen=new Map();
 const teeRequired=players.length<=20;
 if(![10,12,15].includes(plan.blockMinutes)) issues.push('Choose 10, 12, or 15 minute blocks.');
 if(!Array.isArray(plan.blocks)||!plan.blocks.length) return [...issues,'A practice needs blocks.'];
 if(plan.blocks.length*plan.blockMinutes>180) issues.push('The plan exceeds 180 minutes; transitions are included in each block.');
 if(!plan.blocks[0].stations.every(s=>s.drill==='Warm Up')) issues.push('Warm Up must be first for everyone.');
 if(teeRequired&&!plan.blocks.some(b=>b.stations.some(s=>s.drill==='Tee Work'))) issues.push('Tee Work is required for 20 or fewer attendees.');
 if(!teeRequired&&plan.blocks.some(b=>b.stations.some(s=>s.drill==='Tee Work'))) issues.push('Remove Tee Work when attendance exceeds 20.');
 for(const [index,block] of plan.blocks.entries()){
  const assigned=new Set(),pendingWarm=[];
  let live=0,toss=0,machine=0;
  for(const station of block.stations){
   const label='Block '+(index+1)+': ';
   const members=station.players||[];
   for(const id of members){
    if(!ids.has(id)) issues.push(label+'An assignment includes a player who is not attending.');
    if(assigned.has(id)) issues.push(label+'A player is assigned to multiple stations.');
    assigned.add(id);
    const prior=seen.get(id)||new Set();
    if(!['Front Toss','Machine','Live','Pitching Warm Up','Catching Warm Up'].includes(station.drill)&&prior.has(station.drill)) issues.push(label+'A nonrepeatable drill repeats for a player.');
    prior.add(station.drill);seen.set(id,prior);
   }
   if(station.drill==='Machine') machine++;
   if(station.drill==='Front Toss') toss++;
   if(station.drill==='Pitching Warm Up') pendingWarm.push(...members);
   if(station.drill==='Live'){
    live++;
    if(members.length<3||members.length>4) issues.push(label+'Live needs 3–4 hitters.');
    if(!pitchers.has(station.pitcher)) issues.push(label+'Live needs an attending pitcher.');
    if(!warm.has(station.pitcher)) issues.push(label+'Pitcher must finish a warm-up block before Live.');
    liveCounts.set(station.pitcher,(liveCounts.get(station.pitcher)||0)+1);
    if(station.catcher){
     if(!catchers.has(station.catcher)) issues.push(label+'Catcher must be an attending catcher.');
     catchCounts.set(station.catcher,(catchCounts.get(station.catcher)||0)+1);
    } else if(station.equipment!=='9Square') issues.push(label+'Live without a catcher requires 9Square.');
    for(const role of [station.pitcher,station.catcher].filter(Boolean)){
     if(assigned.has(role)) issues.push(label+'A pitcher or catcher has conflicting assignments.');
     assigned.add(role);
    }
   }
  }
  if(machine>1) issues.push('Block '+(index+1)+': only one Machine lane is available.');
  if(live>1||toss>2||(live&&toss)) issues.push('Block '+(index+1)+': Live and Front Toss conflict in the shared tunnel.');
  for(const id of ids) if(!assigned.has(id)) issues.push('Block '+(index+1)+': an attendee has no assignment.');
  pendingWarm.forEach(id=>warm.add(id));
 }
 for(const count of liveCounts.values()) if(count>3) issues.push('A pitcher exceeds three Live blocks.');
 for(const count of catchCounts.values()) if(count>3) issues.push('A catcher exceeds three Live catching blocks.');
 return [...new Set(issues)];
}
