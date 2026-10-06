// RebelsPrep concurrent-practice/facility-capacity policy.
// This module is intentionally independent from the hitting scheduler so practice
// concurrency can evolve without changing Build 125/126 player/coach rotations.

export const FACILITY_POLICIES=Object.freeze({
 barn:Object.freeze({id:'barn',name:'The Barn',mode:'exclusive',maxConcurrent:1}),
 shed:Object.freeze({id:'shed',name:'The Shed',mode:'exclusive',maxConcurrent:1}),
 fields:Object.freeze({id:'fields',name:'The Fields',mode:'shared',maxConcurrent:null})
});

const aliases=new Map([
 ['barn','barn'],['the barn','barn'],
 ['shed','shed'],['the shed','shed'],
 ['field','fields'],['fields','fields'],['the field','fields'],['the fields','fields'],
 ['outside','fields'],['outside fields','fields']
]);

export function facilityId(value){return aliases.get(String(value||'').trim().toLowerCase())||'';}
export function facilityPolicy(value){const id=facilityId(value);return id?FACILITY_POLICIES[id]:null;}

export function minutes(value){
 if(Number.isFinite(value))return Number(value);
 const m=/^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value||'').trim());
 return m?Number(m[1])*60+Number(m[2]):NaN;
}

export function practiceWindow(practice){
 const start=minutes(practice?.start);
 let end=minutes(practice?.end);
 if(!Number.isFinite(end))end=start+Number(practice?.durationMinutes||0);
 return {start,end};
}

export function overlaps(a,b){
 const x=practiceWindow(a),y=practiceWindow(b);
 return Number.isFinite(x.start)&&Number.isFinite(x.end)&&Number.isFinite(y.start)&&Number.isFinite(y.end)&&x.end>x.start&&y.end>y.start&&x.start<y.end&&y.start<x.end;
}

export function activeSessionsForDate(locationData,date){
 return (Array.isArray(locationData?.sessions)?locationData.sessions:[]).filter(s=>s&&s.active!==false&&s.date===date);
}

export function facilityConflict(candidate,locationData){
 const policy=facilityPolicy(candidate?.facility);
 if(!policy)return {blocked:true,code:'unknown-facility',message:'Choose a valid practice facility.'};
 if(policy.mode==='shared')return {blocked:false,code:'shared-facility',policy,conflicts:[]};
 const sessions=activeSessionsForDate(locationData,candidate?.date).filter(s=>s.clockToken!==candidate?.clockToken&&overlaps(candidate,s));
 if(!sessions.length)return {blocked:false,code:'available',policy,conflicts:[]};
 return {blocked:true,code:'facility-overlap',policy,conflicts:sessions,message:`${policy.name} already has a practice during that time. Choose a different time or facility.`};
}

export function personConflict(candidate,sessions,personIds=[]){
 const wanted=new Set(personIds.filter(Boolean));
 if(!wanted.size)return [];
 return (sessions||[]).filter(s=>s&&s.active!==false&&s.date===candidate?.date&&overlaps(candidate,s)&&[...(s.playerIds||[]),...(s.coachIds||[])].some(id=>wanted.has(id)));
}

export function makePracticeId({date,start,teamId,nonce=''}){
 const safe=x=>String(x||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return [safe(date),safe(start),safe(teamId),safe(nonce)].filter(Boolean).join('--');
}

export function sessionRecord({practiceId,date,start,end,durationMinutes,facility,clockToken,checkinToken,teamId,teamIds=[],playerIds=[],coachIds=[]}){
 const id=facilityId(facility);if(!id)throw Error('Choose a valid practice facility.');
 const window=practiceWindow({start,end,durationMinutes});
 if(!Number.isFinite(window.start)||!Number.isFinite(window.end)||window.end<=window.start)throw Error('Choose a valid practice time.');
 return {practiceId,date,start,end:window.end,durationMinutes:window.end-window.start,facility:id,clockToken,checkinToken,teamId,teamIds:[...new Set([teamId,...teamIds].filter(Boolean))],playerIds:[...new Set(playerIds)],coachIds:[...new Set(coachIds)],active:true};
}
