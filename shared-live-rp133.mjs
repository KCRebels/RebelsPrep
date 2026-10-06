import * as legacy from './shared-rp49.mjs?v=rp133';
import {portalAssignments,newClock,changeClock,clockState,portalURL} from './portal-model.mjs?v=rp129';
import {facilityId,facilityPolicy,overlaps,practiceWindow,makePracticeId} from './practice-capacity.mjs?v=rp133';

const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const validTeamId=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!x.includes('/');
const bookingId=(date,id)=>date+'--'+id;
const activeOverlap=(sessions,candidate)=>Array.isArray(sessions)&&sessions.some(s=>s&&s.active!==false&&s.practiceId!==candidate.practiceId&&s.date===candidate.date&&overlaps(candidate,s));
const compactSession=s=>({practiceId:s.practiceId,date:s.date,start:s.start,end:s.end,durationMinutes:s.durationMinutes,facility:s.facility,clockToken:s.clockToken,checkinToken:s.checkinToken,teamId:s.teamId,teamIds:s.teamIds,active:true});

function validate(plan,teamId,date,allPeople,teamIds){
 if(!plan)throw Error('Build a practice first.');
 if(plan.practiceType!=='Hitting')throw Error('Choose Hitting in Setup before activating this practice.');
 const facility=facilityId(plan.facility);if(!facilityPolicy(facility))throw Error('Choose The Barn, The Shed, or The Fields before activating this practice.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(plan.start||'')))throw Error('Choose a valid practice start time before activating.');
 const duration=Number(plan.durationMinutes||plan.duration||0);if(!Number.isFinite(duration)||duration<=0)throw Error('Choose a valid practice duration before activating.');
 if(!Array.isArray(plan.players)||!plan.players.length)throw Error('Add at least one player before activating this practice.');
 if(plan.players.some(p=>!p||typeof p.id!=='string'||!p.id||p.id.length>128||typeof p.name!=='string'||!p.name.trim()||p.name.length>100))throw Error('The practice roster contains an invalid player.');
 if(new Set(plan.players.map(p=>p.id)).size!==plan.players.length)throw Error('The practice roster contains a duplicate player ID.');
 if(plan.requiresAcceptance&&!plan.accepted)throw Error('Accept the listed shortfalls before activating.');
 if(!Array.isArray(allPeople)||allPeople.some(p=>!p||typeof p.id!=='string'||!p.id||p.id.length>128||p.id.includes('/')||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||!['player','coach'].includes(p.role)))throw Error('The selected practice roster is invalid.');
 if(new Set(allPeople.map(p=>p.id)).size!==allPeople.length)throw Error('The selected practice roster contains a duplicate ID.');
 const parts=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date||'')),d=parts?new Date(Date.UTC(+parts[1],+parts[2]-1,+parts[3])):null;
 if(!parts||d.getUTCFullYear()!==+parts[1]||d.getUTCMonth()!==+parts[2]-1||d.getUTCDate()!==+parts[3])throw Error('Choose a valid practice date before activating.');
 if(!validTeamId(teamId)||!Array.isArray(teamIds)||teamIds.some(x=>!validTeamId(x)))throw Error('Choose a valid team before activating this practice.');
 const players=new Set(allPeople.filter(p=>p.role==='player').map(p=>p.id)),coaches=new Set(allPeople.filter(p=>p.role==='coach').map(p=>p.id));
 if(plan.players.some(p=>!players.has(p.id)))throw Error('The practice contains a player who is not in the selected roster.');
 if(!Array.isArray(plan.coaches)||plan.coaches.some(p=>!p||!coaches.has(p.id)))throw Error('The practice contains a coach who is not in the selected roster.');
 return {facility,duration};
}

export async function activate(plan,teamId,date,allPeople,base,teamIds=[teamId]){
 plan=JSON.parse(JSON.stringify(plan));
 const {facility,duration}=validate(plan,teamId,date,allPeople,teamIds);
 const {F,db,auth}=await legacy.services();if(!legacy.allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');await auth.currentUser.getIdToken(true);
 const keys=[...new Set([teamId,...teamIds])],clockToken=token(),checkinToken=token(),practiceId=makePracticeId({date,start:plan.start,teamId,nonce:crypto.randomUUID()}),candidateTokens=new Map(allPeople.map(p=>[p.id,token()]));
 const window=practiceWindow({start:plan.start,durationMinutes:duration});
 const session={practiceId,date,start:plan.start,end:window.end,durationMinutes:duration,facility,clockToken,checkinToken,teamId,teamIds:keys,playerIds:plan.players.map(p=>p.id),coachIds:plan.coaches.map(p=>p.id),active:true};
 const people=[...new Map([...plan.players.map(p=>[p.id,{...p,role:'player'}]),...plan.coaches.map(p=>[p.id,{...p,role:'coach'}])]).values()];
 return F.runTransaction(db,async tx=>{
  const locationRef=facility==='barn'||facility==='shed'?F.doc(db,'rpCheckinLocations',facility):null;
  const locationSnap=locationRef?await tx.get(locationRef):null;
  const teamBookings=[];for(const key of keys){const ref=F.doc(db,'rpPracticeTeams',bookingId(date,key)),snap=await tx.get(ref);teamBookings.push({key,ref,snap});}
  const personBookings=[];for(const person of people){const ref=F.doc(db,'rpPracticePeople',bookingId(date,person.id)),snap=await tx.get(ref);personBookings.push({person,ref,snap});}
  const directories=new Map();const lookupKeys=[...new Set([...keys,...allPeople.flatMap(p=>p.memberTeamIds||[])])];for(const key of lookupKeys){const ref=F.doc(db,'rpTeams',key),snap=await tx.get(ref);directories.set(key,{ref,snap,data:snap.exists()?snap.data():{portals:{}}});}
  const identity=p=>p.role+':'+p.name.trim().toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' '),current=new Map(allPeople.flatMap(p=>[p.name,...p.aliases||[]].map(name=>[identity({...p,name}),p]))),currentIds=new Map(allPeople.map(p=>[p.id,p]));
  const portals={};for(const key of lookupKeys)for(const [id,p] of Object.entries(directories.get(key)?.data?.portals||{})){const person=currentIds.get(id)||current.get(identity(p));if(!person)continue;portals[person.id]??={token:p.token,name:person.name,role:person.role,alternateTokens:p.alternateTokens||[]};}
  for(const person of allPeople)portals[person.id]??={token:candidateTokens.get(person.id),name:person.name,role:person.role,alternateTokens:[]};
  const portalSnaps=[];for(const person of people){const p=portals[person.id];for(const link of [p.token,...p.alternateTokens||[]].filter(Boolean)){const ref=F.doc(db,'rpPortals',link),snap=await tx.get(ref);portalSnaps.push({person,link,ref,snap});}}
  if(locationRef){const old=locationSnap?.exists()?locationSnap.data():{},sessions=Array.isArray(old.sessions)?old.sessions:[];if(activeOverlap(sessions,session))throw Error((facility==='barn'?'The Barn':'The Shed')+' already has a practice during that time. Choose a different time or facility.');}
  for(const b of teamBookings)if(activeOverlap(b.snap.exists()?b.snap.data().sessions:[],session))throw Error('That team already has a practice during that time.');
  for(const b of personBookings)if(activeOverlap(b.snap.exists()?b.snap.data().sessions:[],session))throw Error('A selected player or coach already has another practice during that time.');
  const practiceRef=F.doc(db,'rpPractices',practiceId),practiceDoc={...session,status:'scheduled',practiceType:plan.practiceType,plan,createdBy:auth.currentUser.uid,createdAt:F.serverTimestamp()};
  tx.set(practiceRef,practiceDoc);
  tx.set(F.doc(db,'rpClocks',clockToken),{clock:newClock(plan),date,teamId,teamIds:keys,practiceId,facility,start:plan.start,durationMinutes:duration});
  tx.set(F.doc(db,'rpCheckinSessions',checkinToken),{practiceId,date,clockToken,teamId,teamIds:keys,facility,start:plan.start,durationMinutes:duration,players:plan.players.map(p=>({id:p.id,name:p.name})),playerIds:plan.players.map(p=>p.id),playerNames:Object.fromEntries(plan.players.map(p=>[p.id,p.name])),active:true});
  const short=compactSession(session);
  if(locationRef){const old=locationSnap?.exists()?locationSnap.data():{},kept=(Array.isArray(old.sessions)?old.sessions:[]).filter(x=>x&&x.practiceId!==practiceId);kept.push(short);tx.set(locationRef,{facility,date,sessions:kept,updatedAt:Date.now()});}
  for(const b of teamBookings){const kept=(b.snap.exists()&&Array.isArray(b.snap.data().sessions)?b.snap.data().sessions:[]).filter(x=>x&&x.practiceId!==practiceId);kept.push(short);tx.set(b.ref,{date,teamId:b.key,sessions:kept,updatedAt:Date.now()});}
  for(const b of personBookings){const kept=(b.snap.exists()&&Array.isArray(b.snap.data().sessions)?b.snap.data().sessions:[]).filter(x=>x&&x.practiceId!==practiceId);kept.push(short);tx.set(b.ref,{date,personId:b.person.id,role:b.person.role,sessions:kept,updatedAt:Date.now()});}
  for(const x of portalSnaps){const assignment=(x.person.role==='coach'?plan.coaches:plan.players).find(p=>p.id===x.person.id);if(assignment)tx.set(x.ref,{name:x.person.name,role:x.person.role,active:true,date,clockToken,practiceId,blocks:portalAssignments(plan,assignment,x.person.role)},{merge:true});}
  const next={practiceId,portals,clockToken,checkinToken,checkinURL:legacy.checkinURL(base,checkinToken),plan,date,teamIds:keys,practiceKey:teamId};
  for(const key of keys){const directory=directories.get(key),own={...(directory?.data?.portals||{})};for(const person of allPeople)if(key===teamId||person.role==='coach'||person.memberTeamIds?.includes(key))own[person.id]=portals[person.id];tx.set(F.doc(db,'rpTeams',key),{...next,portals:own},{merge:true});}
  return {...next,links:Object.entries(portals).map(([id,p])=>({id,...p,url:portalURL(base,p.token)}))};
 });
}

export async function control(clockToken,action){
 const {F,db,auth}=await legacy.services();if(!legacy.allowed(auth.currentUser))throw Error('Coach sign-in is required.');if(!/^[a-f0-9]{64}$/.test(clockToken||''))throw Error('The active practice clock is invalid.');action=String(action||'').toLowerCase();if(action==='resume')action='start';if(action==='next')action='skip';if(!['start','pause','skip','done'].includes(action))throw Error('That practice clock action is invalid.');
 const ref=F.doc(db,'rpClocks',clockToken);let nextClock,clockData;await F.runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('The shared practice could not be found.');clockData=s.data();nextClock=changeClock(clockData.clock,action);tx.update(ref,{clock:nextClock});if(nextClock?.done&&clockData.practiceId)tx.update(F.doc(db,'rpPractices',clockData.practiceId),{status:'done',active:false,completedAt:F.serverTimestamp()});});
 if(nextClock?.done){const q=F.query(F.collection(db,'rpCheckinSessions'),F.where('clockToken','==',clockToken)),snaps=await F.getDocs(q);for(const d of snaps.docs)await F.updateDoc(d.ref,{active:false});}
 return nextClock;
}
