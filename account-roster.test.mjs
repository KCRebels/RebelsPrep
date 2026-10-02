import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalPlayerRecords,rosterAudit,playerSeedDocuments,teamSeedDocuments} from './account-roster.mjs';

test('account roster has stable unique player identities',()=>{
 const players=canonicalPlayerRecords(),audit=rosterAudit();
 assert.equal(new Set(players.map(p=>p.id)).size,players.length);
 assert.equal(audit.playerCount,players.length);
 assert.ok(audit.problems.every(x=>x.startsWith('No individual team: ')||x.startsWith('Unknown team ')),audit.problems.join('; '));
 assert.ok(players.length>250,'roster must not be modeled as a small fixed list');
});

test('combined teams do not duplicate permanent player membership',()=>{
 const players=canonicalPlayerRecords();
 for(const p of players){
  assert.ok(!p.teamIds.includes('kc-rebels-nationals'));
  assert.ok(!p.teamIds.includes('kc-rebels-all-regional'));
 }
 const seeds=playerSeedDocuments();
 assert.equal(seeds.length,players.length);
 assert.equal(new Set(seeds.map(x=>x.id)).size,seeds.length);
});

test('team seeds preserve virtual groups separately',()=>{
 const teams=teamSeedDocuments();
 assert.equal(teams.find(x=>x.id==='kc-rebels-nationals').data.virtual,true);
 assert.equal(teams.find(x=>x.id==='kc-rebels-all-regional').data.virtual,true);
 assert.ok(teams.some(x=>x.data.virtual===false));
});
