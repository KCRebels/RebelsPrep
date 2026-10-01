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
 for(const n of [12,20]){const p=make(n);assert.equal(p.missingLive.length,0);assert.equal(p.blocks[0].stations[0].drill,'Warm Up');assert.equal(p.blocks[1].stations[0].drill,'Tee Work');assert.deepEqual(validatePractice(p),[]);}
});
test('32 hitters omit all tee work while preserving group sizes',()=>{
 const p=make(32);assert.equal(p.missingLive.length,0);assert.ok(!p.blocks.flatMap(b=>b.stations).some(s=>s.drill==='Tee Work'||s.tees>0));assert.deepEqual(validatePractice(p),[]);
});
test('45-person plan requires explicit Live replacement choice',()=>{
 assert.throws(()=>make(45,{allowReplacements:false}),/No valid plan found/);
 const p=make(45);assert.ok(p.replacements.length>0);assert.ok(p.missingPitchers.length>0);assert.ok(p.requiresAcceptance);assert.deepEqual(validatePractice(p),[]);
});
test('late/early attendees get their opening work before stations',()=>{
 const adjusted=players.slice(0,12).map((p,i)=>i===4?{...p,arrival:'18:06',departure:'20:06'}:p);
 const p=make(12,{players:adjusted});const late=p.players.find(x=>x.id===adjusted[4].id);
 assert.equal(late.from,3);assert.equal(late.until,13);
 assert.ok(p.blocks[3].stations.some(s=>s.drill==='Warm Up'&&s.players.includes(late.id)));
 assert.ok(p.blocks[4].stations.some(s=>s.drill==='Tee Work'&&s.players.includes(late.id)));
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
});
