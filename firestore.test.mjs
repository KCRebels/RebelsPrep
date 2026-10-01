import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,writeBatch,onSnapshot} from 'firebase/firestore';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-rebelsprep',firestore:{rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
try{
 const coach=env.authenticatedContext('dan',{email:'Recruiting@rebelssoftball.org',email_verified:true}).firestore();
 const anonymous=env.unauthenticatedContext().firestore();
 const outsider=env.authenticatedContext('outside',{email:'other@example.com',email_verified:true}).firestore();
 const unverified=env.authenticatedContext('unverified',{email:'Recruiting@rebelssoftball.org',email_verified:false}).firestore();
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
 // Independent anonymous portal listener follows a coach's shared clock write.
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{stop();reject(Error('Clock listener timed out'));},8000);const stop=onSnapshot(doc(anonymous,'rpClocks',clock),s=>{if(s.data()?.clock.done){assert.equal(s.data().clock.running,false);clearTimeout(timeout);stop();resolve();}},reject);setDoc(doc(coach,'rpClocks',clock),{clock:{running:false,done:true}}).catch(reject);});
 console.log('PASS: coach permissions, bearer reads, no listing, denied unauthorized writes, synchronized Done listener');
}finally{await env.cleanup();}
