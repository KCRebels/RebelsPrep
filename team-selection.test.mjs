import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionKey,combinedTeam} from './team-selection.mjs';
test('Combined practice key is stable regardless of selection order and retains single-team IDs',()=>{
 assert.equal(selectionKey(['b','a','b']),'combined--a--b');
 assert.equal(selectionKey(['a']),'a');
 assert.throws(()=>selectionKey([]));
});
test('Combined roster removes duplicate people and keeps pitching/catching eligibility',()=>{
 const result=combinedTeam([{id:'a',name:'A',players:[{id:'p1',name:'Grace Samuels',pitcher:false,catcher:true}]},{id:'b',name:'B',players:[{id:'other-id',name:' Grace  Samuels ',pitcher:true},{id:'p2',name:'Stella Utter',pitcher:true}]}],['b','a']);
 assert.equal(result.players.length,2);
 assert.equal(result.players[0].id,'p1');
 assert.equal(result.players[0].pitcher,true);
 assert.equal(result.players[0].catcher,true);
 assert.deepEqual(result.players[0].memberTeamIds,['a','b']);
});
test('Missing rosters are reported without inventing players',()=>{
 const result=combinedTeam([{id:'a',name:'A',players:[]},{id:'b',name:'B',players:[{id:'p',name:'Player'}]}],['a','b']);
 assert.deepEqual(result.missingRosters,['A']);
 assert.equal(result.players.length,1);
});
