import {test} from 'node:test';
import assert from 'node:assert/strict';
import {players,coaches} from './roster.mjs';
import {drills} from './drills.mjs';
import {buildPractice,validatePractice} from './scheduler.mjs';
const make=(n,extra={})=>buildPractice({players:players.slice(0,n),coaches,drills,facility:'The Barn',start:'17:30',durationMinutes:180,blockMinutes:12,allowReplacements:true,...extra});
test('written corrections override screenshot positions',()=>{
 for(const name of ['Stella Utter','Rylee Rushton','Alaina Assenmacher','Ainsley Curry','Emma Robertson'])assert.ok(players.find(p=>p.name===name).pitcher,name);
 for(const name of ['Avree Troxel','Grace Samuels','Evangeline Pham','Teagan Hills','Shanley Taylor'])assert.ok(players.find(p=>p.name===name).catcher,name);
 assert.equal(players.length,45);assert.equal(new Set(players.map(p=>p.id)).size,45);
});
test('180 minutes remains 180 for every supported block size',()=>{
 for(const blockMinutes of [10,12,15]){const p=make(12,{blockMinutes});assert.equal(p.durationMinutes,180);assert.equal(p.blocks.length,180/blockMinutes);assert.deepEqual(validatePractice(p),[]);}
});
test('all small-group hitters receive mandatory work and Live',()=>{
 for(const n of [12,20]){const p=make(n);assert.equal(p.missingLive.length,0);assert.equal(p.blocks[0].stations[0].drill,'Warm Up');assert.ok(!p.blocks.flatMap(b=>b.stations).some(s=>s.drill==='Tee Work'));assert.deepEqual(validatePractice(p),[]);}
});
test('32 hitters can use selected tee stations while preserving group sizes',()=>{
 const p=make(32);assert.equal(p.missingLive.length,0);assert.ok(!p.blocks.flatMap(b=>b.stations).some(s=>s.drill==='Tee Work'));assert.ok(p.blocks.flatMap(b=>b.stations).some(s=>s.tees>0));assert.deepEqual(validatePractice(p),[]);
});
test('45-person plan requires explicit Live replacement choice',()=>{
 assert.throws(()=>make(45,{allowReplacements:false}),/No valid plan found/);
 const p=make(45);assert.ok(p.replacements.length>0);assert.ok(p.missingPitchers.length>0);assert.ok(p.requiresAcceptance);assert.deepEqual(validatePractice(p),[]);
 for(const block of p.blocks){const names=block.stations.filter(s=>s.kind==='drill').map(s=>s.drill);assert.equal(new Set(names).size,names.length,'Equipment station duplicated');}
});
test('late/early attendees get their opening work before stations',()=>{
 const adjusted=players.slice(0,12).map((p,i)=>i===4?{...p,arrival:'18:06',departure:'20:06'}:p);
 const p=make(12,{players:adjusted});const late=p.players.find(x=>x.id===adjusted[4].id);
 assert.equal(late.from,3);assert.equal(late.until,13);
 assert.ok(p.blocks[3].stations.some(s=>s.drill==='Warm Up'&&s.players.includes(late.id)));
 assert.ok(!p.blocks.flatMap(b=>b.stations).some(s=>s.drill==='Tee Work'));
 assert.ok(p.blocks[4].stations.some(s=>s.kind!=='opening'&&[...s.players,s.pitcher,s.catcher].includes(late.id)));
 assert.deepEqual(validatePractice(p),[]);
});
test('no-warmup and injured-role adjustments are respected',()=>{
 const adjusted=players.slice(0,12).map((p,i)=>i===0?{...p,noPitchWarmup:true}:i===9?{...p,canPitch:false}:p);
 const p=make(12,{players:adjusted});assert.ok(!p.blocks.flatMap(b=>b.stations).some(s=>s.pitcher===adjusted[9].id));assert.deepEqual(validatePractice(p),[]);
});
test('validator rejects missing human warmup, oversize group and repeat drills',()=>{
 const p=make(12);const oversized=structuredClone(p);const station=oversized.blocks.flatMap(b=>b.stations).find(s=>s.kind==='drill');station.players.push('rp-p-01','rp-p-02');assert.ok(validatePractice(oversized).length);
 const invalid=structuredClone(p);const warm=invalid.blocks.flatMap(b=>b.stations).find(s=>s.kind==='warm');assert.ok(warm);warm.coach=null;warm.catcher=null;assert.ok(validatePractice(invalid).includes('Warm-up needs a human catcher or coach'));
 const conflict=structuredClone(p);const block=conflict.blocks.find(b=>b.stations.some(s=>s.kind==='live'));block.stations.push({kind:'front',drill:'Front Toss',players:[],coach:coaches[0].id});assert.ok(validatePractice(conflict).includes('Tunnel conflict'));
 const duplicate=structuredClone(p);const drillBlock=duplicate.blocks.find(b=>b.stations.some(s=>s.kind==='drill'));drillBlock.stations.push(structuredClone(drillBlock.stations.find(s=>s.kind==='drill')));assert.ok(validatePractice(duplicate).includes('A drill station is used twice in one block'));
});
test('all 40 catalog drills have a supported scheduling role',()=>{
 assert.equal(drills.length,40);
 for(const d of drills){assert.ok(['drill','front','machine'].includes(d.kind));assert.ok(d.howItWorks);assert.ok(d.coachingCues);}
 const extra=drills.filter(d=>d.kind==='drill');
 for(const d of drills.filter(d=>d.kind!=='drill')){
  const p=make(12,{drills:[...extra,d]});assert.deepEqual(validatePractice(p),[],d.name);
  const station=p.blocks.flatMap(b=>b.stations).find(s=>s.drillId===d.id);assert.ok(station,d.name);assert.equal(station.drill,d.name);assert.equal(station.howItWorks,d.howItWorks);
 }
 assert.ok(!make(12).blocks.flatMap(b=>b.stations).some(s=>s.drillId==='drill-0'));
});
test('multiple chosen machine variants appear and total tee capacity stays at six',()=>{
 const p=make(12);const stations=p.blocks.flatMap(b=>b.stations);for(const d of drills.filter(d=>d.kind==='machine'))assert.ok(stations.some(s=>s.drillId===d.id),d.name);
 for(const b of p.blocks)assert.ok(b.stations.reduce((n,s)=>n+(s.tees||0),0)<=6);
});
