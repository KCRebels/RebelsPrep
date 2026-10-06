import {facilityPolicy,facilityConflict,makePracticeId,sessionRecord,personConflict} from './practice-capacity.mjs?v=rp132';

export function practiceIdentity({date,start,teamId}){
 return makePracticeId({date,start,teamId,nonce:crypto.randomUUID()});
}

export function buildSession({practiceId,date,plan,teamId,teamIds,clockToken,checkinToken}){
 return sessionRecord({practiceId,date,start:plan.start,durationMinutes:plan.durationMinutes,facility:plan.facility,clockToken,checkinToken,teamId,teamIds,playerIds:(plan.players||[]).map(p=>p.id),coachIds:(plan.coaches||[]).map(p=>p.id)});
}

export function validateConcurrentActivation(candidate,locationData,otherSessions=[]){
 const policy=facilityPolicy(candidate.facility);
 if(!policy)throw Error('Choose a valid practice facility.');
 const facility=facilityConflict(candidate,locationData);
 if(facility.blocked)throw Error(facility.message);
 const people=personConflict(candidate,otherSessions,[...(candidate.playerIds||[]),...(candidate.coachIds||[])]);
 if(people.length)throw Error('A selected player or coach already has another practice during that time.');
 return {policy,facility};
}

export function canonicalPractice({practiceId,date,plan,teamId,teamIds,clockToken,checkinToken,createdBy}){
 const session=buildSession({practiceId,date,plan,teamId,teamIds,clockToken,checkinToken});
 return {...session,status:'scheduled',practiceType:plan.practiceType||'Hitting',plan,createdBy:createdBy||null,createdAt:Date.now()};
}
