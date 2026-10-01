import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionKey,combinedTeam} from './team-selection.mjs';
import {teams} from './teams.mjs';
import {rosterPlayers} from './team-rosters.mjs';
import {players as confirmed} from './roster.mjs';
test('Imported roster preserves every confirmed player ID and position',()=>{
 assert.equal(rosterPlayers.length,242);
 assert.equal(new Set(rosterPlayers.map(p=>p.id)).size,242);
 for(const old of confirmed){const p=rosterPlayers.find(p=>p.id===old.id);assert.ok(p,old.name);assert.equal(p.pitcher,old.pitcher,old.name);assert.equal(p.catcher,old.catcher,old.name);}
 assert.equal(rosterPlayers.find(p=>p.id==='rp-p-29').name,'Ella Olson');
 assert.deepEqual(rosterPlayers.find(p=>p.name==='Addison Hull').aliases,['Addy Hull']);
});
test('All groups share canonical records with individual teams without double attendance',()=>{
 const nationals=teams.find(t=>t.id==='kc-rebels-nationals');
 const regional=teams.find(t=>t.id==='kc-rebels-all-regional');
 assert.equal(nationals.players.length,46);assert.equal(regional.players.length,25);
 const individual=teams.find(t=>t.id==='kc-rebels-16-national');
 assert.equal(individual.players.length,15);
 for(const p of individual.players)assert.ok(nationals.players.includes(p));
 assert.equal(combinedTeam(teams,[nationals.id,individual.id]).players.length,46);
 assert.equal(combinedTeam(teams,['kc-rebels-16-national','kc-rebels-16-frans']).players.length,24);
 assert.equal(teams.find(t=>t.id==='kc-rebels-18-regional').players.length,0);
 assert.equal(teams.find(t=>t.id==='kc-rebels-9-sherman').players.length,0);
 const sameName=combinedTeam([{id:'a',name:'A',players:[{id:'a1',name:'Same Name'},{id:'a2',name:'Same Name'}]}],['a']);assert.equal(sameName.players.length,2);
});
test('Combined practice key is stable regardless of selection order and retains single-team IDs',()=>{
 assert.equal(selectionKey(['b','a','b']),'combined--a--b');
 assert.equal(selectionKey(['a']),'a');
 assert.throws(()=>selectionKey([]));
});
test('Combined roster removes duplicate people and keeps pitching/catching eligibility',()=>{
 const result=combinedTeam([{id:'a',name:'A',players:[{id:'p1',name:'Grace Samuels',pitcher:false,catcher:true}]},{id:'b',name:'B',players:[{id:'p1',name:' Grace  Samuels ',pitcher:true},{id:'p2',name:'Stella Utter',pitcher:true}]}],['b','a']);
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
