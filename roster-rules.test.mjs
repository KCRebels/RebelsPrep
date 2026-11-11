import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';

test('team coaches may manage only their own roster in Firestore',async()=>{
 const env=await initializeTestEnvironment({
  projectId:'demo-rebelsprep-roster',
  firestore:{rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}
 });
 try{
  await env.withSecurityRulesDisabled(async ctx=>{
   const db=ctx.firestore();
   await setDoc(doc(db,'rpAccounts','coach-a'),{active:true,role:'team_coach',teamIds:['team-a'],coachId:'coach-a'});
   await setDoc(doc(db,'rpAccounts','coach-b'),{active:true,role:'team_coach',teamIds:['team-b'],coachId:'coach-b'});
   await setDoc(doc(db,'rpAccounts','admin'),{active:true,role:'org_admin',teamIds:[],coachId:'admin'});
   await setDoc(doc(db,'rpDirectoryTeams','team-a'),{name:'Team A',playerIds:[],active:true});
   await setDoc(doc(db,'rpDirectoryTeams','team-b'),{name:'Team B',playerIds:[],active:true});
  });
  const a=env.authenticatedContext('coach-a',{email:'coacha@example.test',email_verified:true}).firestore();
  const b=env.authenticatedContext('coach-b',{email:'coachb@example.test',email_verified:true}).firestore();
  const admin=env.authenticatedContext('admin',{email:'admin@example.test',email_verified:true}).firestore();
  const payload={
   name:'Player Test',teamIds:['team-a'],aliases:[],groupIds:[],
   pitcher:false,catcher:true,source:'coach',active:true,playerPortalEnabled:true,
   email:'',jerseyNumber:'8',createdAt:serverTimestamp(),createdBy:'coach-a'
  };
  await assertSucceeds(setDoc(doc(a,'rpPlayers','p1'),payload));
  assert.equal((await getDoc(doc(a,'rpPlayers','p1'))).data().name,'Player Test');
  await assertFails(getDoc(doc(b,'rpPlayers','p1')));
  await assertSucceeds(updateDoc(doc(a,'rpDirectoryTeams','team-a'),{playerIds:['p1']}));
  assert.deepEqual((await getDoc(doc(a,'rpDirectoryTeams','team-a'))).data().playerIds,['p1']);
  await assertFails(updateDoc(doc(a,'rpDirectoryTeams','team-b'),{playerIds:['p1']}));
  await assertFails(updateDoc(doc(a,'rpDirectoryTeams','team-a'),{active:false}));
  await assertFails(getDocs(collection(a,'rpPlayers')));
  await assertFails(setDoc(doc(a,'rpPlayers','p2'),{...payload,teamIds:['team-b']}));
  await assertFails(setDoc(doc(a,'rpPlayers','p3'),{...payload,teamIds:['team-a','team-b']}));
  await assertFails(updateDoc(doc(b,'rpPlayers','p1'),{name:'Hacked'}));
  await assertFails(updateDoc(doc(a,'rpPlayers','p1'),{teamIds:['team-b'],updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(a,'rpPlayers','p1'),{role:'org_admin',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(a,'rpPlayers','p1'),{name:'Player Updated',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(a,'rpPlayers','p1'),{teamIds:[],active:false,playerPortalEnabled:false,updatedAt:serverTimestamp()}));
  assert.equal((await getDoc(doc(admin,'rpPlayers','p1'))).data().active,false);
  await assertFails(deleteDoc(doc(a,'rpPlayers','p1')));
  await assertSucceeds(updateDoc(doc(admin,'rpPlayers','p1'),{teamIds:['team-b'],active:true,playerPortalEnabled:true}));
 }finally{await env.cleanup();}
});
