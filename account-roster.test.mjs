import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalPlayerRecords,rosterAudit,playerSeedDocuments,teamSeedDocuments,playerPortalPlayers} from './account-roster.mjs';

test('account roster has stable unique player identities',()=>{
 const players=canonicalPlayerRecords(),audit=rosterAudit();
 assert.equal(new Set(players.map(p=>p.id)).size,players.length);
 assert.equal(audit.playerCount,players.length);
 assert.ok(audit.problems.every(x=>!x.startsWith('Duplicate player ID: ')),audit.problems.join('; '));
 assert.ok(players.length>200,'roster must not be modeled as a small fixed list');
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


test('player portal rollout is limited to 14U, 16U, and 18U teams',()=>{
 const teams=teamSeedDocuments();
 for(const t of teams){
  if(t.data.virtual)continue;
  const age=Number((t.data.name.match(/KC Rebels (\d+)/)||[])[1]||0);
  assert.equal(t.data.playerPortalEnabled,[14,16,18].includes(age),t.data.name);
  assert.equal(t.data.archivedFromPlayerPortal,![14,16,18].includes(age),t.data.name);
 }
 const eligible=new Set(playerPortalPlayers().map(p=>p.id));
 for(const p of playerSeedDocuments())assert.equal(p.data.playerPortalEnabled,eligible.has(p.id),p.data.name);
});
