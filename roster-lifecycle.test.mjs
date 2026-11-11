import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import * as F from 'firebase/firestore';
import {addRosterPlayer,editRosterPlayer,loadTeamRoster,transferRosterPlayer,removeRosterPlayer} from './roster-store.mjs';
import {applyRosterSnapshot} from './roster-cache.mjs';
test('synthetic roster lifecycle uses production store and enforced Firestore rules',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-rebelsprep-roster',firestore:{rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
 const source='kc-rebels-14-national',target='kc-rebels-16-regional';
 const coach={active:true,role:'team_coach',teamIds:[source]};
 const admin={active:true,role:'org_admin',teamIds:[]};
 const client=uid=>async()=>({F,db:env.authenticatedContext(uid,{email:uid+'@example.test',email_verified:true}).firestore(),auth:{currentUser:{uid}}});
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c=>{
   for(const [uid,data] of [['synthetic-coach',coach],['synthetic-admin',admin]])await F.setDoc(F.doc(c.firestore(),'rpAccounts',uid),data);
   for(const id of [source,target])await F.setDoc(F.doc(c.firestore(),'rpDirectoryTeams',id),{active:true,playerIds:[]});
  });
  const asCoach=client('synthetic-coach'),asAdmin=client('synthetic-admin');
  const id=await addRosterPlayer(coach,source,{name:'Synthetic Test Player'},asCoach);
  await editRosterPlayer(coach,source,id,{name:'Synthetic Renamed',pitcher:true},asCoach);
  let rows=await loadTeamRoster(coach,source,asCoach);
  assert.equal(rows[0].name,'Synthetic Renamed');assert.equal(rows[0].pitcher,true);
  await assert.rejects(transferRosterPlayer(coach,source,target,id,asCoach),/permission|admin/);
  await env.withSecurityRulesDisabled(async c=>{
   await F.setDoc(F.doc(c.firestore(),'rpAccounts','synthetic-login'),{active:true,role:'player',playerId:id,teamIds:[source]});
  });
  const playerDb=env.authenticatedContext('synthetic-login').firestore();
  await assertSucceeds(F.getDoc(F.doc(playerDb,'rpDirectoryTeams',source)));
  await transferRosterPlayer(admin,source,target,id,asAdmin);
  // Authorization follows the live roster even when the account still caches the old team.
  await assertFails(F.getDoc(F.doc(playerDb,'rpDirectoryTeams',source)));
  await assertSucceeds(F.getDoc(F.doc(playerDb,'rpDirectoryTeams',target)));
  assert.deepEqual(await loadTeamRoster(coach,source,asCoach),[]);
  rows=await loadTeamRoster(admin,target,asAdmin);assert.equal(rows[0].id,id);
  const players=[],teams=[source,target,'kc-rebels-all-regional'].map(id=>({id,players:[]}));
  applyRosterSnapshot(players,teams,target,rows);assert.equal(teams[2].players[0].id,id);
  await assert.rejects(editRosterPlayer(coach,source,id,{name:'Unauthorized'},asCoach));
  await removeRosterPlayer(admin,target,id,asAdmin);
  assert.deepEqual(await loadTeamRoster(admin,target,asAdmin),[]);
  const {db}=await asAdmin();const archived=(await F.getDoc(F.doc(db,'rpPlayers',id))).data();
  await assertFails(F.getDoc(F.doc(playerDb,'rpPlayers',id)));
  await assertFails(F.getDoc(F.doc(playerDb,'rpDirectoryTeams',target)));
  assert.equal(archived.active,false);assert.equal(archived.playerPortalEnabled,false);
 }finally{await env.cleanup();}
});
