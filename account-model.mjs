import {firebaseConfig} from './shared-config.mjs?v=rpbuild19';

let servicesPromise;
async function services(){
 if(!servicesPromise)servicesPromise=(async()=>{
  const root='https://www.gstatic.com/firebasejs/12.19.0/';
  const [app,A,F]=await Promise.all(['app','auth','firestore'].map(x=>import(root+'firebase-'+x+'.js')));
  const project=app.initializeApp(firebaseConfig,'RebelsPrepAccounts');
  return {A,F,auth:A.getAuth(project),db:F.getFirestore(project)};
 })();
 return servicesPromise;
}

export const ACCOUNT_ROLES=Object.freeze(['org_admin','org_coach','team_coach','player']);
export function normalizeAccount(uid,data={}){
 const role=ACCOUNT_ROLES.includes(data.role)?data.role:'';
 const teamIds=[...new Set(Array.isArray(data.teamIds)?data.teamIds.filter(x=>typeof x==='string'&&x&&!x.includes('/')):[])];
 return {uid,role,active:data.active===true,playerId:typeof data.playerId==='string'?data.playerId:'',coachId:typeof data.coachId==='string'?data.coachId:'',displayName:typeof data.displayName==='string'?data.displayName:'',teamIds};
}
export function isOrgCoach(a){return Boolean(a?.active&&['org_admin','org_coach'].includes(a.role));}
export function isCoach(a){return Boolean(a?.active&&['org_admin','org_coach','team_coach'].includes(a.role));}
export function canAccessTeam(a,teamId){return Boolean(isOrgCoach(a)||(a?.active&&a.role==='team_coach'&&a.teamIds.includes(teamId)));}
export function isPlayer(a){return Boolean(a?.active&&a.role==='player'&&a.playerId);}
export async function currentAccount(){
 const {F,db,auth}=await services();
 if(!auth.currentUser)return null;
 const snap=await F.getDocFromServer(F.doc(db,'rpAccounts',auth.currentUser.uid));
 return snap.exists()?normalizeAccount(auth.currentUser.uid,snap.data()):null;
}
export async function watchAccount(onValue,onError){
 const {F,db,auth}=await services();
 if(!auth.currentUser){onValue(null);return ()=>{};}
 return F.onSnapshot(F.doc(db,'rpAccounts',auth.currentUser.uid),s=>onValue(s.exists()?normalizeAccount(auth.currentUser.uid,s.data()):null),onError);
}
export async function provisionLegacyCoach({role='org_admin',teamIds=[]}={}){
 const {F,db,auth}=await services();
 const user=auth.currentUser;
 if(!user?.emailVerified)throw Error('Verified coach sign-in required.');
 if(!['org_admin','org_coach','team_coach'].includes(role))throw Error('Invalid coach role.');
 const ref=F.doc(db,'rpAccounts',user.uid),snap=await F.getDoc(ref);
 if(snap.exists())return normalizeAccount(user.uid,snap.data());
 const coachId='coach-'+user.uid;
 await F.setDoc(ref,{role,active:true,coachId,displayName:user.displayName||user.email||'Coach',email:user.email||'',teamIds:[...new Set(teamIds)],createdAt:F.serverTimestamp(),lastSeenAt:F.serverTimestamp()});
 return normalizeAccount(user.uid,(await F.getDoc(ref)).data());
}
export async function accountContext(){const {auth}=await services();return {user:auth.currentUser,account:await currentAccount()};}
