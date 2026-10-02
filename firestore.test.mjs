import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,writeBatch,onSnapshot,updateDoc,serverTimestamp} from 'firebase/firestore';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-rebelsprep',firestore:{rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
try{
 const coach=env.authenticatedContext('dan',{email:'recruiting@rebelssoftball.org',email_verified:true}).firestore();
 const anonymous=env.unauthenticatedContext().firestore();
 const outsider=env.authenticatedContext('outside',{email:'other@example.com',email_verified:true}).firestore();
 const unverified=env.authenticatedContext('unverified',{email:'recruiting@rebelssoftball.org',email_verified:false}).firestore();
 for(const [i,email] of ['chrisolsen@finditds.com','halley.rindom@gmail.com','dmayhugh425511@gmail.com'].entries()){const db=env.authenticatedContext('coach'+i,{email,email_verified:true}).firestore();await assertSucceeds(setDoc(doc(db,'rpTeams','allowlist-'+i),{ok:true}));}
 const player='a'.repeat(64),clock='b'.repeat(64);
 const batch=writeBatch(coach);batch.set(doc(coach,'rpTeams','nationals'),{portals:{one:{token:player}}});batch.set(doc(coach,'rpPortals',player),{name:'Player One',clockToken:clock,blocks:[]});batch.set(doc(coach,'rpClocks',clock),{clock:{running:false,done:false}});await assertSucceeds(batch.commit());
 await assertSucceeds(getDoc(doc(anonymous,'rpPortals',player)));
 await assertSucceeds(getDoc(doc(anonymous,'rpClocks',clock)));
 for(const db of [anonymous,outsider,unverified]){
  await assertFails(getDoc(doc(db,'rpTeams','nationals')));
  await assertFails(setDoc(doc(db,'rpPortals',player),{name:'tampered'}));
  await assertFails(setDoc(doc(db,'rpClocks',clock),{clock:{running:true}}));
 }
 await assertFails(getDocs(collection(anonymous,'rpPortals')));
 await assertFails(getDocs(collection(coach,'rpPortals')));
 await assertFails(getDocs(collection(anonymous,'rpClocks')));
 await assertFails(getDoc(doc(anonymous,'rpPortals','guess')));
 await assertSucceeds(getDoc(doc(coach,'rpTeams','nationals')));

 // Public check-in: only an active, matching sanitized session can accept writes.
 const session='c'.repeat(64);await setDoc(doc(coach,'rpCheckinSessions',session),{active:true,clockToken:clock,date:'2026-10-01',start:'17:30',players:[{id:'p1',name:'Player One'}],playerIds:['p1'],playerNames:{p1:'Player One'},teamId:'nationals',teamIds:['nationals'],facility:'barn'});
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-player'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','missing-date'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-guest'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','guest-unpaired'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session,session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','fake-timestamp'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:new Date('2020-01-01'),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','extra-field'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in',admin:true}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-name'),{kind:'player',name:'Someone Else',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-player'),{kind:'player',name:'Fake Player',playerId:'not-on-roster',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-player'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-guest'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await env.withSecurityRulesDisabled(async ctx=>{await updateDoc(doc(ctx.firestore(),'rpCheckins','valid-player'),{status:'corrected'});await updateDoc(doc(ctx.firestore(),'rpCheckins','valid-guest'),{status:'approved'});});
 await assertFails(setDoc(doc(anonymous,'rpCheckins','valid-player'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','valid-guest'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','guest-name-too-long'),{kind:'guest-request',name:'x'.repeat(101),sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','guest-name-not-string'),{kind:'guest-request',name:123,sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','guest-missing-primary'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:['d'.repeat(64)],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','player-pending'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','guest-checked-in'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-session'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:'d'.repeat(64),clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-clock'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:'e'.repeat(64),teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','extra-team'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals','other-team'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await updateDoc(doc(coach,'rpCheckinSessions',session),{teamIds:['nationals','partner-team']});
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-team-subset'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertSucceeds(setDoc(doc(anonymous,'rpCheckins','valid-team-full'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals','partner-team'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await updateDoc(doc(coach,'rpCheckinSessions',session),{teamIds:['nationals']});
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-team'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'other-team',teamIds:['other-team'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-facility'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'shed',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-date'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-02',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','wrong-time'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'19:00',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-time-format'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30:00',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-time-type'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:1730,practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-date-type'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:20261001,facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-date-format'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'10/01/2026',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','bad-clock-format'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:'bad',teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await updateDoc(doc(coach,'rpClocks',clock),{clock:{running:false,done:true}});
 await assertFails(setDoc(doc(anonymous,'rpCheckins','done-clock'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(setDoc(doc(anonymous,'rpCheckins','done-clock-guest'),{kind:'guest-request',name:'Guest One',sessionToken:session,sessionTokens:[session],clockToken:clock,clockTokens:[clock],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'pending'}));
 await updateDoc(doc(coach,'rpClocks',clock),{clock:{running:false,done:false}});
 await updateDoc(doc(coach,'rpCheckinSessions',session),{active:false});
 await assertFails(setDoc(doc(anonymous,'rpCheckins','closed-session'),{kind:'player',name:'Player One',playerId:'p1',sessionToken:session,clockToken:clock,teamId:'nationals',teamIds:['nationals'],practiceTime:'17:30',practiceDate:'2026-10-01',facility:'barn',createdAt:serverTimestamp(),status:'checked-in'}));
 await assertFails(getDocs(collection(anonymous,'rpCheckinSessions')));
 await assertSucceeds(getDocs(collection(coach,'rpCheckinSessions')));
 // Permanent account authorization: org-wide coaches, assigned team coaches, and private players.
 await assertSucceeds(setDoc(doc(coach,'rpPlayers','player-1'),{name:'Player One',teamIds:['team-b'],playerPortalEnabled:true}));
 await assertSucceeds(setDoc(doc(coach,'rpPlayers','player-2'),{name:'Player Two',teamIds:['team-c'],playerPortalEnabled:true}));
 await assertSucceeds(setDoc(doc(coach,'rpPlayers','younger-player'),{name:'Younger Player',teamIds:['team-12u'],playerPortalEnabled:false}));
 await assertSucceeds(setDoc(doc(coach,'rpAccounts','org-admin'),{role:'org_admin',active:true,coachId:'coach-admin',displayName:'Admin',teamIds:[]}));
 await assertSucceeds(setDoc(doc(coach,'rpAccounts','team-coach'),{role:'team_coach',active:true,coachId:'coach-team',displayName:'Team Coach',teamIds:['team-a','team-b']}));
 await assertSucceeds(setDoc(doc(coach,'rpAccounts','player-user'),{role:'player',active:true,playerId:'player-1',displayName:'Player One',teamIds:['team-b']}));
 await assertFails(setDoc(doc(coach,'rpAccounts','younger-player-user'),{role:'player',active:true,playerId:'younger-player',displayName:'Younger Player',teamIds:['team-12u']}));
 const orgDb=env.authenticatedContext('org-admin',{email:'admin@example.com',email_verified:true}).firestore();
 const teamDb=env.authenticatedContext('team-coach',{email:'team@example.com',email_verified:true}).firestore();
 const playerDb=env.authenticatedContext('player-user',{email:'player@example.com',email_verified:true}).firestore();
 await assertSucceeds(getDoc(doc(orgDb,'rpPlayers','player-2')));
 await assertSucceeds(getDoc(doc(teamDb,'rpPlayers','player-1')));
 await assertFails(getDoc(doc(teamDb,'rpPlayers','player-2')));
 await assertSucceeds(getDoc(doc(playerDb,'rpPlayers','player-1')));
 await assertFails(getDoc(doc(playerDb,'rpPlayers','player-2')));
 await assertFails(getDoc(doc(playerDb,'rpAccounts','team-coach')));
 await assertSucceeds(setDoc(doc(teamDb,'rpFeedback','feedback-1'),{playerId:'player-1',teamId:'team-b',authorUid:'team-coach',authorCoachId:'coach-team',authorName:'Team Coach',body:'Keep working',createdAt:serverTimestamp()}));
 await assertSucceeds(getDoc(doc(playerDb,'rpFeedback','feedback-1')));
 await assertFails(setDoc(doc(playerDb,'rpFeedback','feedback-2'),{playerId:'player-1',teamId:'team-b',authorUid:'player-user',authorCoachId:'fake',authorName:'Fake',body:'No',createdAt:serverTimestamp()}));
 await assertSucceeds(setDoc(doc(coach,'rpFacilities','barn'),{name:'The Barn',active:true}));
 await assertSucceeds(getDoc(doc(playerDb,'rpFacilities','barn')));
 await assertFails(getDoc(doc(anonymous,'rpFacilities','barn')));
 // Independent anonymous portal listener follows a coach's shared clock write.
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{stop();reject(Error('Clock listener timed out'));},8000);const stop=onSnapshot(doc(anonymous,'rpClocks',clock),s=>{if(s.data()?.clock.done){assert.equal(s.data().clock.running,false);clearTimeout(timeout);stop();resolve();}},reject);setDoc(doc(coach,'rpClocks',clock),{clock:{running:false,done:true}}).catch(reject);});
 console.log('PASS: coach permissions, bearer reads, no listing, denied unauthorized writes, synchronized Done listener');
}finally{await env.cleanup();}
