import {coachAccounts,readAssignmentWrites,applyAssignmentWrites} from './practice-assignments-rp276.mjs?v=rp276';
// Current RebelsPrep shared-practice entry point.
// Keep the proven legacy helpers while live activation/control use practice-scoped
// concurrency, facility-capacity protection, and isolated completion cleanup.
import {services,allowed} from './shared-rp49.mjs?v=rp134';
export * from './shared-rp49.mjs?v=rp134';
export {activate} from './shared-live-rp276.mjs?v=rp276';
export {control} from './shared-control-rp134.mjs?v=rp134';

export async function completeLogin(email,url){const {A,auth}=await services();await A.setPersistence(auth,A.browserLocalPersistence);const cred=await A.signInWithEmailLink(auth,email,url);await cred.user.getIdToken(true);localStorage.removeItem('RebelsPrep:login-email');return cred.user;}
export async function signInCoach(email,password){const {A,auth}=await services();await A.setPersistence(auth,A.browserLocalPersistence);const cred=await A.signInWithEmailAndPassword(auth,email,password);return cred.user;}
export async function sendCoachPasswordEmail(email){const {A,auth}=await services();if(!allowed({email,emailVerified:true}))throw Error('That coach email is not enabled yet.');await A.sendPasswordResetEmail(auth,email);}
export async function refreshCoachAuth(){const {auth}=await services();if(!auth.currentUser)throw Error('Coach sign-in is required.');await auth.currentUser.reload();await auth.currentUser.getIdToken(true);return auth.currentUser;}
export async function ensureCoachAccount(teamIds=[]){const {F,db,auth}=await services(),user=auth.currentUser;if(!allowed(user))throw Error('Sign in with an enabled coach email.');const ref=F.doc(db,'rpAccounts',user.uid),snap=await F.getDocFromServer(ref);if(snap.exists())return snap.data();const data={role:'org_admin',active:true,coachId:'coach-'+user.uid,displayName:user.displayName||user.email||'Coach',email:user.email||'',teamIds:[...new Set(teamIds)].filter(Boolean),createdAt:F.serverTimestamp(),lastSeenAt:F.serverTimestamp()};await F.setDoc(ref,data);return data;}
export async function seedAccountDirectory(playerSeeds,teamSeeds){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');if(!Array.isArray(playerSeeds)||!Array.isArray(teamSeeds))throw Error('Account directory seed is invalid.');const marker=F.doc(db,'rpSystem','account-directory-v1'),markerSnap=await F.getDoc(marker);if(markerSnap.exists()&&markerSnap.data().complete===true&&markerSnap.data().players===playerSeeds.length&&markerSnap.data().teams===teamSeeds.length)return markerSnap.data();const writes=[...teamSeeds.map(x=>['rpDirectoryTeams',x]),...playerSeeds.map(x=>['rpPlayers',x])];for(let i=0;i<writes.length;i+=400){const batch=F.writeBatch(db);for(const [collectionName,item] of writes.slice(i,i+400))batch.set(F.doc(db,collectionName,item.id),item.data,{merge:true});await batch.commit();}const result={complete:true,players:playerSeeds.length,teams:teamSeeds.length,seededAt:F.serverTimestamp()};await F.setDoc(marker,result);return result;}

export async function syncPersonalAssignments(directory){
 if(!directory?.practiceId||!directory.clockToken||!directory.plan)return;
 const {F,db,auth}=await services();if(!allowed(auth.currentUser))return;
 const accounts=await coachAccounts(F,db);
 await F.runTransaction(db,async tx=>{
  const clock=await tx.get(F.doc(db,'rpClocks',directory.clockToken));
  const practice=await tx.get(F.doc(db,'rpPractices',directory.practiceId));
  if(!clock.exists()||!practice.exists()||clock.data().clock?.done||practice.data().status==='done')return;
  const current=practice.data(),future=clock.data().futurePlan;
  let plan=current.plan||directory.plan;
  if(future)plan={...plan,players:future.players,blocks:[...plan.blocks.slice(0,future.fromIndex),...future.blocks]};
  const writes=await readAssignmentWrites(tx,F,db,plan,{...current,clockToken:directory.clockToken,practiceId:directory.practiceId},accounts);
  applyAssignmentWrites(tx,writes);
 });
}
