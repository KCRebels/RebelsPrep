import {firebaseConfig,builderEmails} from './shared-config.mjs?v=rpbuild19';
import {portalAssignments,newClock,changeClock,clockState,portalURL} from './portal-model.mjs?v=rpbuild18';
let servicesPromise;
export const configured=Boolean(firebaseConfig?.projectId&&firebaseConfig?.apiKey&&firebaseConfig?.authDomain);
export async function services(){
 if(!configured)throw Error('Shared portals need the separate RebelsPrep Firebase project configured.');
 if(!servicesPromise)servicesPromise=(async()=>{const root='https://www.gstatic.com/firebasejs/12.19.0/';const [app,A,F]=await Promise.all(['app','auth','firestore'].map(s=>import(root+'firebase-'+s+'.js')));const project=app.initializeApp(firebaseConfig,'RebelsPrep');return {A,F,auth:A.getAuth(project),db:F.getFirestore(project)};})();
 return servicesPromise;
}
export function allowed(user){return Boolean(user?.emailVerified&&builderEmails.includes(user.email?.toLowerCase()));}
export async function sendLogin(email,base){if(!builderEmails.includes(email.toLowerCase()))throw Error('That coach email is not enabled yet.');const {A,auth}=await services();const url=new URL(base);url.hash='';url.search='';await A.sendSignInLinkToEmail(auth,email,{url:url.href,handleCodeInApp:true});localStorage.setItem('RebelsPrep:login-email',email);}
export async function completeLogin(email,url){const {A,auth}=await services();await A.signInWithEmailLink(auth,email,url);localStorage.removeItem('RebelsPrep:login-email');}
export async function isLoginLink(url){const {A,auth}=await services();return A.isSignInWithEmailLink(auth,url);}
export async function signOut(){const {A,auth}=await services();await A.signOut(auth);}
export async function observeAuth(fn){const {A,auth}=await services();return A.onAuthStateChanged(auth,fn);}
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export function checkinURL(base,token){const u=new URL(base);u.hash='';u.search='?checkin=1&session='+encodeURIComponent(token);return u.href;}
export async function registry(teamId){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');const d=await F.getDocFromServer(F.doc(db,'rpTeams',teamId));return d.exists()?d.data():{portals:{}};}
export async function activate(plan,teamId,date,allPeople,base,teamIds=[teamId]){
 if(!plan)throw Error('Build a practice first.');
 if(plan.practiceType!=='Hitting')throw Error('Choose Hitting in Setup before activating this practice.');
 plan=JSON.parse(JSON.stringify(plan));
 const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');
 if(plan.requiresAcceptance&&!plan.accepted)throw Error('Accept the listed shortfalls before activating.');
 const clockToken=token(),checkinToken=token(),keys=[...new Set([teamId,...teamIds])];
 return F.runTransaction(db,async tx=>{
  const facilitySlug=String(plan.facility||'').toLowerCase().includes('barn')?'barn':String(plan.facility||'').toLowerCase().includes('shed')?'shed':'';
  const locationRef=facilitySlug?F.doc(db,'rpCheckinLocations',facilitySlug):null;
  const locationSnap=locationRef?await tx.get(locationRef):null;
  const directories=new Map();
  const lookupKeys=[...new Set([...keys,...allPeople.flatMap(p=>p.memberTeamIds||[])])];
  for(const key of lookupKeys){const doc=await tx.get(F.doc(db,'rpTeams',key));directories.set(key,doc.exists()?doc.data():{portals:{}});}
  const previousClocks=new Set(keys.map(key=>directories.get(key)?.clockToken).filter(Boolean));
  const clockDocs=new Map();
  for(const id of previousClocks){const doc=await tx.get(F.doc(db,'rpClocks',id));clockDocs.set(id,doc.exists()?doc.data():null);}
  for(const data of clockDocs.values())if(data&&!clockState(data.clock)?.done)throw Error('Finish the active practice for the selected teams before activating another.');
  const identity=p=>p.role+':'+p.name.trim().toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ');
  const current=new Map(allPeople.flatMap(p=>[p.name,...p.aliases||[]].map(name=>[identity({...p,name}),p])));
  const currentIds=new Map(allPeople.map(p=>[p.id,p]));
  const portals={},records=new Map();
  // Keep every existing permanent token, including links created in earlier combinations.
  for(const key of [...new Set([...teamIds,teamId,...lookupKeys])])for(const [id,p] of Object.entries(directories.get(key)?.portals||{})){
   const person=currentIds.get(id)||current.get(identity(p));
   if(!keys.includes(key)&&!person)continue;
   const entry={...p,id:person?.id||id,name:person?.name||p.name};
   for(const link of [p.token,...p.alternateTokens||[]])records.set(link,{...entry,token:link});portals[entry.id]??={token:p.token,name:entry.name,role:p.role};
  }
  for(const person of allPeople){
   portals[person.id]??={token:token(),name:person.name,role:person.role};
   const p=portals[person.id];records.set(p.token,{...p,id:person.id});
  }
  for(const [id,p] of Object.entries(portals))p.alternateTokens=[...records.entries()].filter(([link,record])=>record.id===id&&link!==p.token).map(([link])=>link);
  // An existing person's link cannot be reassigned away from an unfinished practice.
  for(const [id] of records){
   const portal=await tx.get(F.doc(db,'rpPortals',id));
   if(portal.exists()&&portal.data().active&&portal.data().clockToken){
    const oldClock=portal.data().clockToken;
    if(!clockDocs.has(oldClock)){const doc=await tx.get(F.doc(db,'rpClocks',oldClock));clockDocs.set(oldClock,doc.exists()?doc.data():null);}
    if(clockDocs.get(oldClock)&&!clockState(clockDocs.get(oldClock).clock)?.done)throw Error('A selected player or coach already has an active practice. Finish it first.');
   }
  }
  if(records.size+keys.length+1>450)throw Error('This combination has too many saved portal links to activate in one practice.');
  for(const [id,p] of records){
   const person=(p.role==='coach'?plan.coaches:plan.players).find(x=>x.id===p.id);
   tx.set(F.doc(db,'rpPortals',id),{name:p.name,role:p.role,active:Boolean(person),date,clockToken:person?clockToken:null,blocks:person?portalAssignments(plan,person,p.role):[]});
  }
  tx.set(F.doc(db,'rpClocks',clockToken),{clock:newClock(plan),date,teamId,teamIds});
  tx.set(F.doc(db,'rpCheckinSessions',checkinToken),{date,clockToken,teamId,teamIds,facility:plan.facility,start:plan.start,players:plan.players.map(p=>({id:p.id,name:p.name})),active:true});
  if(locationRef){const old=locationSnap?.exists()?locationSnap.data():{},kept=(old.sessions||[]).filter(x=>x.date===date&&x.checkinToken!==checkinToken);kept.push({date,start:plan.start,checkinToken,teamId,teamIds});tx.set(locationRef,{facility:facilitySlug,date,sessions:kept,updatedAt:Date.now()});}
  const next={portals,clockToken,checkinToken,checkinURL:checkinURL(base,checkinToken),plan,date,teamIds,practiceKey:teamId};
  for(const key of keys){
   if(key===teamId){tx.set(F.doc(db,'rpTeams',key),next);continue;}
   const own={...directories.get(key).portals};
   for(const person of allPeople)if(person.role==='coach'||person.memberTeamIds?.includes(key))own[person.id]=portals[person.id];
   tx.set(F.doc(db,'rpTeams',key),{...next,portals:own});
  }
  return {...next,checkinURL:checkinURL(base,checkinToken),links:Object.entries(portals).map(([id,p])=>({id,...p,url:portalURL(base,p.token)}))};
 });
}
export async function control(clockToken,action){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const ref=F.doc(db,'rpClocks',clockToken);let nextClock;await F.runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('The shared practice could not be found.');nextClock=changeClock(s.data().clock,action);tx.update(ref,{clock:nextClock});});if(nextClock?.done){const q=F.query(F.collection(db,'rpCheckinSessions'),F.where('clockToken','==',clockToken)),snaps=await F.getDocs(q);await Promise.all(snaps.docs.map(d=>F.updateDoc(d.ref,{active:false})));}}
export async function watchClock(id,onValue,onError){const {F,db}=await services();return F.onSnapshot(F.doc(db,'rpClocks',id),{includeMetadataChanges:true},s=>onValue(s.exists()?s.data():null,s.metadata),onError);}
export async function watchPortal(id,onValue,onError){if(!/^[a-f0-9]{64}$/.test(id))throw Error('This portal link is invalid.');const {F,db}=await services();return F.onSnapshot(F.doc(db,'rpPortals',id),{includeMetadataChanges:true},s=>onValue(s.exists()?s.data():null,s.metadata),onError);}

export async function checkinFeed(clockToken,onValue,onError){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const col=F.collection(db,'rpCheckins'),direct=F.query(col,F.where('clockToken','==',clockToken)),guest=F.query(col,F.where('clockTokens','array-contains',clockToken));let a=[],b=[];const send=()=>{const m=new Map([...a,...b].map(x=>[x.id,x]));onValue([...m.values()])};const u1=F.onSnapshot(direct,s=>{a=s.docs.map(d=>({id:d.id,...d.data()}));send()},onError),u2=F.onSnapshot(guest,s=>{b=s.docs.map(d=>({id:d.id,...d.data()}));send()},onError);return ()=>{u1();u2()}}

export async function correctCheckin(id){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');await F.updateDoc(F.doc(db,'rpCheckins',id),{status:'corrected'});}
export async function setGuestStatus(id,status){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');if(status!=='declined')throw Error('Approval must include a successful future-block rebuild.');const ref=F.doc(db,'rpCheckins',id);await F.runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('Guest request not found.');if(s.data().status!=='pending')throw Error('This guest request was already handled.');tx.update(ref,{status:'declined',joinRule:null});});}
export async function approveGuestAndReplaceFuturePlan(checkinId,clockToken,plan,fromIndex){const {F,db,auth}=await services();const candidateTokens=new Map(plan.players.map(p=>[p.id,token()]));if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const clockRef=F.doc(db,'rpClocks',clockToken),guestRef=F.doc(db,'rpCheckins',checkinId);await F.runTransaction(db,async tx=>{const clockSnap=await tx.get(clockRef),guestSnap=await tx.get(guestRef);if(!clockSnap.exists()||!guestSnap.exists())throw Error('The practice or guest request is no longer available.');const data=clockSnap.data(),guest=guestSnap.data(),now=clockState(data.clock);if(!now||now.done)throw Error('The practice is no longer active.');if(guest.status!=='pending')throw Error('This guest request was already handled.');if(Array.isArray(guest.clockTokens)&&guest.clockTokens.length&&!guest.clockTokens.includes(clockToken))throw Error('This guest request belongs to a different practice.');if(now.index>=fromIndex)throw Error('The next block has already started. Try approval again for the following block.');const teamIds=[...new Set([data.teamId,...data.teamIds||[]].filter(Boolean))],teamDocs=[];for(const id of teamIds){const ref=F.doc(db,'rpTeams',id),snap=await tx.get(ref);teamDocs.push({id,ref,snap})}const base=teamDocs.find(x=>x.id===data.teamId)||teamDocs[0],portals={...(base?.snap.exists()?base.snap.data().portals||{}:{})};for(const person of plan.players)if(!portals[person.id])portals[person.id]={token:candidateTokens.get(person.id),name:person.name,role:'player',alternateTokens:[]};tx.update(guestRef,{status:'approved',joinRule:'next-block',approvedClockToken:clockToken,clockToken});tx.update(clockRef,{futurePlan:{fromIndex,blocks:plan.blocks.slice(fromIndex),players:plan.players,updatedAt:Date.now()}});for(const [personId,p] of Object.entries(portals)){const person=(p.role==='coach'?plan.coaches:plan.players).find(x=>x.id===personId);if(!person)continue;for(const link of [p.token,...p.alternateTokens||[]])if(link)tx.set(F.doc(db,'rpPortals',link),{name:p.name,role:p.role,active:true,date:data.date,clockToken,blocks:portalAssignments(plan,person,p.role)},{merge:true})}for(const t of teamDocs)if(t.snap.exists())tx.update(t.ref,{plan,portals});});}
export async function approvedGuests(clockToken){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const q=F.query(F.collection(db,'rpCheckins'),F.where('clockToken','==',clockToken),F.where('kind','==','guest-request'),F.where('status','==','approved'));const s=await F.getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));}

export async function replaceFuturePlan(clockToken,plan,fromIndex){const {F,db,auth}=await services();const candidateTokens=new Map(plan.players.map(p=>[p.id,token()]));if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const ref=F.doc(db,'rpClocks',clockToken);await F.runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('Active practice not found.');const data=s.data(),now=clockState(data.clock);if(!now||now.done)throw Error('The practice is no longer active.');if(now.index>=fromIndex)throw Error('The next block has already started. Rebuild again from the following block.');const teamIds=[...new Set([data.teamId,...data.teamIds||[]].filter(Boolean))],teamDocs=[];for(const id of teamIds){const ref=F.doc(db,'rpTeams',id),snap=await tx.get(ref);teamDocs.push({id,ref,snap})}const base=teamDocs.find(x=>x.id===data.teamId)||teamDocs[0],portals={...(base?.snap.exists()?base.snap.data().portals||{}:{})};for(const person of plan.players)if(!portals[person.id])portals[person.id]={token:candidateTokens.get(person.id),name:person.name,role:'player',alternateTokens:[]};const future={fromIndex,blocks:plan.blocks.slice(fromIndex),players:plan.players,updatedAt:Date.now()};tx.update(ref,{futurePlan:future});for(const [personId,p] of Object.entries(portals)){const person=(p.role==='coach'?plan.coaches:plan.players).find(x=>x.id===personId);if(!person)continue;for(const link of [p.token,...p.alternateTokens||[]])if(link)tx.set(F.doc(db,'rpPortals',link),{name:p.name,role:p.role,active:true,date:data.date,clockToken,blocks:portalAssignments(plan,person,p.role)},{merge:true})}for(const t of teamDocs)if(t.snap.exists())tx.update(t.ref,{plan,portals});});}
