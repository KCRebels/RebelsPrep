import * as legacy from './shared-rp49.mjs?v=rp134';
import {changeClock} from './portal-model.mjs?v=rp129';

const bookingId=(kind,date,id)=>'practice-'+kind+'--'+date+'--'+id;
const withoutPractice=(data,practiceId)=>({...data,sessions:(Array.isArray(data?.sessions)?data.sessions:[]).filter(s=>s&&s.practiceId!==practiceId),updatedAt:Date.now()});

export async function control(clockToken,action){
 const {F,db,auth}=await legacy.services();
 if(!legacy.allowed(auth.currentUser))throw Error('Coach sign-in is required.');
 if(!/^[a-f0-9]{64}$/.test(clockToken||''))throw Error('The active practice clock is invalid.');
 action=String(action||'').toLowerCase();if(action==='resume')action='start';if(action==='next')action='skip';
 if(!['start','pause','skip','done'].includes(action))throw Error('That practice clock action is invalid.');
 const clockRef=F.doc(db,'rpClocks',clockToken);let nextClock,clockData;
 await F.runTransaction(db,async tx=>{
  const clockSnap=await tx.get(clockRef);if(!clockSnap.exists())throw Error('The shared practice could not be found.');
  clockData=clockSnap.data();nextClock=changeClock(clockData.clock,action);
  let practiceRef=null,practiceSnap=null,locationRef=null,locationSnap=null;const teamBookings=[],personBookings=[];
  if(nextClock?.done&&clockData.practiceId){
   practiceRef=F.doc(db,'rpPractices',clockData.practiceId);practiceSnap=await tx.get(practiceRef);
   if(practiceSnap.exists()){
    const p=practiceSnap.data(),date=p.date;
    if(['barn','shed'].includes(p.facility)){locationRef=F.doc(db,'rpCheckinLocations',p.facility);locationSnap=await tx.get(locationRef);}
    for(const id of [...new Set([p.teamId,...p.teamIds||[]].filter(Boolean))]){const ref=F.doc(db,'rpSystem',bookingId('team',date,id)),snap=await tx.get(ref);teamBookings.push({ref,snap});}
    for(const id of [...new Set([...(p.playerIds||[]),...(p.coachIds||[])].filter(Boolean))]){const ref=F.doc(db,'rpSystem',bookingId('person',date,id)),snap=await tx.get(ref);personBookings.push({ref,snap});}
   }
  }
  tx.update(clockRef,{clock:nextClock});
  if(nextClock?.done&&practiceRef&&practiceSnap?.exists()){
   tx.update(practiceRef,{status:'done',active:false,completedAt:F.serverTimestamp()});
   if(locationRef&&locationSnap?.exists())tx.set(locationRef,withoutPractice(locationSnap.data(),clockData.practiceId));
   for(const b of [...teamBookings,...personBookings])if(b.snap.exists())tx.set(b.ref,withoutPractice(b.snap.data(),clockData.practiceId));
  }
 });
 if(nextClock?.done){const q=F.query(F.collection(db,'rpCheckinSessions'),F.where('clockToken','==',clockToken)),snaps=await F.getDocs(q);for(const d of snaps.docs)await F.updateDoc(d.ref,{active:false});}
 return nextClock;
}
