import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSession,validateConcurrentActivation,canonicalPractice} from './shared-concurrency-rp132.mjs';

const plan=(facility='The Fields',start='17:30')=>({practiceType:'Hitting',facility,start,durationMinutes:120,players:[{id:'p1'}],coaches:[{id:'c1'}]});
const args=(id,facility='The Fields',start='17:30')=>({practiceId:id,date:'2026-10-07',plan:plan(facility,start),teamId:'team-'+id,teamIds:['team-'+id],clockToken:'a'.repeat(64),checkinToken:'b'.repeat(64)});

test('Fields permits ten simultaneous isolated practices',()=>{
 const sessions=[];
 for(let i=0;i<10;i++){
  const a=args('p'+i);a.plan.players=[{id:'player-'+i}];a.plan.coaches=[{id:'coach-'+i}];
  const s=buildSession(a);
  assert.doesNotThrow(()=>validateConcurrentActivation(s,{sessions},sessions));
  sessions.push(s);
 }
 assert.equal(new Set(sessions.map(s=>s.practiceId)).size,10);
});

test('Barn and Shed block overlapping practices but allow adjacent times',()=>{
 for(const facility of ['The Barn','The Shed']){
  const first=buildSession(args('one',facility));
  const overlap=buildSession(args('two',facility,'18:00'));
  assert.throws(()=>validateConcurrentActivation(overlap,{sessions:[first]},[first]),/already has a practice/);
  const adjacent=buildSession(args('three',facility,'19:30'));
  assert.doesNotThrow(()=>validateConcurrentActivation(adjacent,{sessions:[first]},[first]));
 }
});

test('same person cannot overlap across facilities',()=>{
 const first=buildSession(args('one','The Barn'));
 const second=buildSession(args('two','The Fields'));
 assert.throws(()=>validateConcurrentActivation(second,{sessions:[]},[first]),/selected player or coach/);
});

test('canonical practice owns its own tokens and plan',()=>{
 const a=args('one');const doc=canonicalPractice({...a,createdBy:'uid-1'});
 assert.equal(doc.practiceId,'one');assert.equal(doc.teamId,'team-one');assert.equal(doc.status,'scheduled');assert.equal(doc.createdBy,'uid-1');assert.equal(doc.plan.practiceType,'Hitting');
});
