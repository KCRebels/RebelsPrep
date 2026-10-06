import test from 'node:test';
import assert from 'node:assert/strict';
import {FACILITY_POLICIES,facilityId,facilityConflict,overlaps,personConflict,sessionRecord,makePracticeId} from './practice-capacity.mjs';

const base={date:'2026-10-07',durationMinutes:120};
const practice=(teamId,facility,start='17:30',extra={})=>sessionRecord({...base,teamId,teamIds:[teamId],facility,start,practiceId:makePracticeId({date:base.date,start,teamId,nonce:teamId}),clockToken:'clock-'+teamId,checkinToken:'check-'+teamId,playerIds:['p-'+teamId],coachIds:['c-'+teamId],...extra});

test('facility aliases and policies match RebelsPrep operating rules',()=>{
 assert.equal(facilityId('The Barn'),'barn');assert.equal(facilityId('The Shed'),'shed');assert.equal(facilityId('The Fields'),'fields');
 assert.equal(FACILITY_POLICIES.barn.maxConcurrent,1);assert.equal(FACILITY_POLICIES.shed.maxConcurrent,1);assert.equal(FACILITY_POLICIES.fields.maxConcurrent,null);
});

test('Barn cannot be double booked but can start when prior practice ends',()=>{
 const first=practice('16-regional','The Barn','17:30');
 assert.equal(facilityConflict(practice('14-regional','The Barn','18:30'),{sessions:[first]}).blocked,true);
 assert.equal(facilityConflict(practice('14-regional','The Barn','19:30'),{sessions:[first]}).blocked,false);
});

test('Shed cannot be double booked',()=>{
 const first=practice('18-national','The Shed','17:30');
 const result=facilityConflict(practice('16-national','The Shed','17:45'),{sessions:[first]});
 assert.equal(result.blocked,true);assert.equal(result.code,'facility-overlap');assert.match(result.message,/Shed already has a practice/);
});

test('Fields supports ten simultaneous independent practices',()=>{
 const sessions=[];
 for(let i=1;i<=10;i++){
  const next=practice('fields-team-'+i,'The Fields','18:00');
  const result=facilityConflict(next,{sessions});assert.equal(result.blocked,false);sessions.push(next);
 }
 assert.equal(sessions.length,10);assert.equal(new Set(sessions.map(s=>s.practiceId)).size,10);
});

test('facility conflicts are date scoped',()=>{
 const first=practice('team-a','The Barn','17:30');
 const tomorrow=practice('team-b','The Barn','17:30',{date:'2026-10-08'});
 assert.equal(facilityConflict(tomorrow,{sessions:[first]}).blocked,false);
});

test('time overlap is strict and adjacent sessions are allowed',()=>{
 assert.equal(overlaps({start:'17:30',durationMinutes:120},{start:'19:29',durationMinutes:60}),true);
 assert.equal(overlaps({start:'17:30',durationMinutes:120},{start:'19:30',durationMinutes:60}),false);
});

test('same player or coach can be detected across simultaneous practices',()=>{
 const a=practice('a','The Fields','18:00',{playerIds:['shared-player'],coachIds:['coach-a']});
 const b=practice('b','The Fields','18:00',{playerIds:['player-b'],coachIds:['shared-coach']});
 const candidate={date:base.date,start:'18:30',durationMinutes:60};
 assert.deepEqual(personConflict(candidate,[a,b],['shared-player']).map(x=>x.teamId),['a']);
 assert.deepEqual(personConflict(candidate,[a,b],['shared-coach']).map(x=>x.teamId),['b']);
 assert.equal(personConflict(candidate,[a,b],['nobody']).length,0);
});

test('session records keep practice identity and coach/player isolation',()=>{
 const s=practice('team-x','The Fields','18:00',{playerIds:['p1','p2','p1'],coachIds:['c1','c2','c1']});
 assert.equal(s.facility,'fields');assert.deepEqual(s.playerIds,['p1','p2']);assert.deepEqual(s.coachIds,['c1','c2']);assert.equal(s.durationMinutes,120);assert.equal(s.active,true);
});
