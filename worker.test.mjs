import {test} from 'node:test';
import assert from 'node:assert/strict';
import {players,coaches} from './roster.mjs';
import {drills} from './drills.mjs';
import {buildPractice,validatePractice} from './scheduler.mjs';
const fixed=drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work'&&d.tees);let teeBudget=5;const teeDrills=[];for(const d of fixed){if((d.tees||0)<=teeBudget){teeDrills.push(d);teeBudget-=d.tees||0;}}
const barnDrills=drills.filter(d=>d.kind!=='drill'||d.name==='Basic Tee Work'||!d.tees).concat(teeDrills);
const messages=[];
globalThis.self={postMessage:m=>messages.push(m)};
await import('./worker.mjs');
const input=n=>({players:players.slice(0,n),coaches,drills:barnDrills,facility:'The Barn',start:'17:30',durationMinutes:180,blockMinutes:12,allowReplacements:true});
const build=i=>{messages.length=0;self.onmessage({data:{mode:'build',input:i}});return messages[0];};
test('build checks Live first even when old draft allowed replacements',()=>{const m=build(input(12));assert.ok(m.plan);assert.equal(m.plan.replacements.length,0);assert.equal(m.replacementOffer,undefined);assert.deepEqual(validatePractice(m.plan),[]);});
test('scheduler supports relaxed coverage goals without relaxing hard safety rules',()=>{const base={...input(12),durationMinutes:120,requireFront:false,requireSecondFrontForReplacement:false,allowReplacements:false};const p=buildPractice(base);assert.equal(p.requirements.front,false);assert.ok(p.blocks.flatMap(b=>b.stations).filter(s=>!['opening','warm'].includes(s.kind)).every(s=>s.players.length>=3&&s.players.length<=4));assert.deepEqual(validatePractice(p),[]);});
test('23 hitters recommendation reflects simultaneous station demand',()=>{messages.length=0;self.onmessage({data:{mode:'recommend',input:input(23)}});const r=messages[0].recommendation;assert.ok(r.total>=6&&r.total<=8);assert.ok(r.frontCount>=3&&r.frontCount<=r.total);assert.ok(r.liveCount>=3&&r.liveCount<=r.total);assert.equal(r.count,Math.max(r.frontCount,r.liveCount));});
test('changing duration does not multiply the station setup count',()=>{messages.length=0;self.onmessage({data:{mode:'recommend',input:{...input(23),durationMinutes:210}}});assert.ok(messages[0].recommendation.count>=3&&messages[0].recommendation.count<=8);});
