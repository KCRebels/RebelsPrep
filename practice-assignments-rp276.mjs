import {portalAssignments} from './portal-model.mjs?v=rp129';
import {coachIdentity} from './coach-identity-rp276.mjs?v=rp276';
export function assignmentRecord(plan,person,role,session){
 return {practiceId:session.practiceId,personId:person.id,name:person.name,role,date:session.date,start:plan.start,facility:plan.facility,teamId:session.teamId,teamIds:session.teamIds||[session.teamId],clockToken:session.clockToken,blocks:portalAssignments(plan,person,role)};
}
export function mergeAssignments(existing,record){
 const all={...(existing&&typeof existing==='object'?existing:{}),[record.practiceId]:record};
 return Object.fromEntries(Object.entries(all).sort(([,a],[,b])=>String(b.date||'').localeCompare(String(a.date||''))||String(b.start||'').localeCompare(String(a.start||''))).slice(0,30));
}
export async function coachAccounts(F,db){
 try{const snap=await F.getDocs(F.collection(db,'rpAccounts'));return snap.docs.map(d=>({uid:d.id,...d.data()}));}
 catch(e){if(String(e.code||'').includes('permission-denied'))return [];throw e;}
}
// All reads finish before callers begin transaction writes.
export async function readAssignmentWrites(tx,F,db,plan,session,accounts=[]){
 if(!session.practiceId||!session.clockToken)throw Error('This practice needs a permanent identity before publishing assignments.');
 const writes=[];
 for(const person of plan.players){
  const ref=F.doc(db,'rpPlayers',person.id),snap=await tx.get(ref);
  writes.push({ref,data:{practiceAssignments:mergeAssignments(snap.exists()?snap.data().practiceAssignments:null,assignmentRecord(plan,person,'player',session))},merge:true});
 }
 for(const person of plan.coaches){
  const mirror=F.doc(db,'rpSystem','coach-assignments--'+person.id),cached=await tx.get(mirror);
  writes.push({ref:mirror,data:{sessions:mergeAssignments(cached.exists()?cached.data().sessions:null,assignmentRecord(plan,person,'coach',session))},merge:true});
  const matches=accounts.filter(a=>a.active===true&&['org_admin','org_coach','team_coach'].includes(a.role)&&(a.coachId===person.id||(/^coach-/.test(a.coachId||'')&&coachIdentity(a.email)?.id===person.id)));
  for(const account of matches){
   const ref=F.doc(db,'rpAccounts',account.uid),snap=await tx.get(ref);
   if(!snap.exists())continue;
   const data=snap.data();
   // Recheck identity inside the transaction so an admin reassignment cannot leak data.
   if(data.active!==true||!['org_admin','org_coach','team_coach'].includes(data.role)||(data.coachId!==person.id&&!( /^coach-/.test(data.coachId||'')&&coachIdentity(data.email)?.id===person.id)))continue;
   writes.push({ref,data:{practiceAssignments:mergeAssignments(data.practiceAssignments,assignmentRecord(plan,person,'coach',session))},merge:true});
  }
 }
 return writes;
}
export function applyAssignmentWrites(tx,writes){for(const w of writes)tx.set(w.ref,w.data,{merge:w.merge});}
