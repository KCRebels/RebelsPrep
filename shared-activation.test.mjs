import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import * as F from 'firebase/firestore';
import {newClock,clockState,portalAssignments,portalURL} from './portal-model.mjs';
const env=await initializeTestEnvironment({projectId:'demo-rebelsprep',firestore:{rules:await readFile(new URL('./firestore.rules',import.meta.url),'utf8')}});
try{
 const db=env.authenticatedContext('multi-coach',{email:'Recruiting@rebelssoftball.org',email_verified:true}).firestore();
 let seq=100;const token=()=> (++seq).toString(16).padStart(64,'0');
 const services=async()=>({F,db,auth:{currentUser:{emailVerified:true}}});
 const src=await readFile(new URL('./shared.mjs',import.meta.url),'utf8');
 const body=src.slice(src.indexOf('export async function activate('),src.indexOf('export async function control')).replace('export async function','async function');
 const activate=new Function('services','allowed','token','newClock','clockState','portalAssignments','portalURL','checkinURL',body+'return activate;')(services,()=>true,token,newClock,clockState,portalAssignments,portalURL,(base,t)=>new URL('?checkin=1&session='+t,base).href);
 const p={id:'p1',name:'Grace Samuels',memberTeamIds:['multi-a','multi-b']},p2={id:'p2',name:'Stella Utter',memberTeamIds:['multi-b']},coach={id:'c1',name:'Coach One'};
 const plan={practiceType:'Hitting',facility:'The Barn',start:'17:30',players:[p,p2],coaches:[coach],blocks:[{number:1,start:1050,end:1062,stations:[{kind:'machine',drill:'Machine',resource:'Machine',players:['p1','p2'],coach:'c1'}],coaching:[]}],blockMinutes:12,durationMinutes:12,replacements:[]};
 const permanent='d'.repeat(64),alternate='e'.repeat(64);
 await F.setDoc(F.doc(db,'rpTeams','multi-a'),{portals:{p1:{name:p.name,role:'player',token:permanent}}});
 await F.setDoc(F.doc(db,'rpTeams','multi-b'),{portals:{p1:{name:p.name,role:'player',token:alternate}}});
 const people=[{...p,role:'player'},{...p2,role:'player'},{...coach,role:'coach'}];
 await assert.rejects(()=>activate({...plan,practiceType:''},'multi-a','2026-10-01',people,'https://kcrebels.github.io/RebelsPrep/'),/Choose Hitting/);
 const result=await activate(plan,'combined--multi-a--multi-b','2026-10-01',people,'https://kcrebels.github.io/RebelsPrep/',['multi-a','multi-b']);
 assert.equal(result.portals.p1.token,permanent);
 assert.match(result.checkinToken,/^[a-f0-9]{64}$/);
 assert.ok(result.checkinURL.includes('?checkin=1&session='));
 const sessionDoc=await F.getDoc(F.doc(db,'rpCheckinSessions',result.checkinToken));assert.equal(sessionDoc.data().active,true);assert.equal(sessionDoc.data().clockToken,result.clockToken);assert.deepEqual(sessionDoc.data().playerIds,['p1','p2']);assert.deepEqual(sessionDoc.data().playerNames,{p1:'Player One',p2:'Player Two'});
 const barnDoc=await F.getDoc(F.doc(db,'rpCheckinLocations','barn'));assert.ok(barnDoc.data().sessions.some(x=>x.checkinToken===result.checkinToken&&x.clockToken===result.clockToken&&x.start===plan.start));

 const first=await F.getDoc(F.doc(db,'rpPortals',permanent)),second=await F.getDoc(F.doc(db,'rpPortals',alternate));
 assert.equal(first.data().clockToken,result.clockToken);
 assert.equal(second.data().clockToken,result.clockToken);
 for(const id of ['multi-a','multi-b']){
  const data=(await F.getDoc(F.doc(db,'rpTeams',id))).data();
  assert.equal(data.practiceKey,'combined--multi-a--multi-b');
  assert.deepEqual(data.teamIds,['multi-a','multi-b']);
 }
 await assert.rejects(()=>activate(plan,'multi-b','2026-10-01',people,'https://kcrebels.github.io/RebelsPrep/',['multi-b']),/Finish the active/);
 await F.updateDoc(F.doc(db,'rpClocks',result.clockToken),{clock:{...newClock(plan),done:true}});
 const next=await activate(plan,'multi-b','2026-10-01',people,'https://kcrebels.github.io/RebelsPrep/',['multi-b']);
 assert.equal(next.portals.p1.token,permanent);
 assert.equal((await F.getDoc(F.doc(db,'rpPortals',permanent))).data().clockToken,next.clockToken);
 assert.equal((await F.getDoc(F.doc(db,'rpPortals',alternate))).data().clockToken,next.clockToken);
 await F.updateDoc(F.doc(db,'rpClocks',next.clockToken),{clock:{...newClock(plan),done:true}});
 const ella={id:'ella',name:'Ella Olson',aliases:['Ella Olsen'],memberTeamIds:['nationals','individual']};
 const ellaToken='f'.repeat(64);
 await F.setDoc(F.doc(db,'rpTeams','nationals'),{portals:{legacy:{name:'Ella Olsen',role:'player',token:ellaToken}}});
 const ellaPlan={...plan,players:[ella],coaches:[]};
 const individual=await activate(ellaPlan,'individual','2026-10-01',[{...ella,role:'player'}],'https://kcrebels.github.io/RebelsPrep/',['individual']);
 assert.equal(individual.portals.ella.token,ellaToken);
 assert.equal((await F.getDoc(F.doc(db,'rpPortals',ellaToken))).data().name,'Ella Olson');
 assert.equal((await F.getDoc(F.doc(db,'rpTeams','nationals'))).data().portals.legacy.token,ellaToken);
 console.log('Combined activation: permanent and alternate links preserved, team directories share one clock, conflicts rejected, solo restart verified.');
}finally{await env.cleanup();}
