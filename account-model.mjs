import {firebaseConfig} from './shared-config.mjs?v=rpbuild19';

let servicesPromise;
async function services(){
 if(!servicesPromise)servicesPromise=(async()=>{
  const root='https://www.gstatic.com/firebasejs/12.19.0/';
  const [app,A,F]=await Promise.all(['app','auth','firestore'].map(x=>import(root+'firebase-'+x+'.js')));
  const project=app.getApps().find(x=>x.name==='RebelsPrep')||app.initializeApp(firebaseConfig,'RebelsPrep');
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


export async function sendPlayerSignInLink(email){
 const {A,auth}=await services();
 const clean=String(email||'').trim().toLowerCase();
 if(!clean||!clean.includes('@'))throw Error('Enter a valid email address.');
 const url=new URL(location.href);url.search='?player=1';url.hash='';
 await A.sendSignInLinkToEmail(auth,clean,{url:url.href,handleCodeInApp:true});
 localStorage.setItem('RebelsPrep:player-signin-email',clean);
 return clean;
}
export async function finishPlayerSignIn(link=location.href){
 const {A,auth}=await services();
 if(!A.isSignInWithEmailLink(auth,link))throw Error('Paste the complete RebelsPrep sign-in link.');
 let email=localStorage.getItem('RebelsPrep:player-signin-email')||'';
 if(!email)throw Error('Enter the same email address that received this sign-in link.');
 const result=await A.signInWithEmailLink(auth,email,link);
 localStorage.removeItem('RebelsPrep:player-signin-email');
 return result.user;
}
export async function signOutAccount(){const {A,auth}=await services();await A.signOut(auth);}


export async function eligiblePlayerDirectory(){
 const {F,db}=await services();
 const q=F.query(F.collection(db,'rpPlayers'),F.where('playerPortalEnabled','==',true));
 const snap=await F.getDocs(q);
 return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
}
export async function accountDirectory(){
 const {F,db}=await services();
 const snap=await F.getDocs(F.collection(db,'rpAccounts'));
 return snap.docs.map(d=>({uid:d.id,...d.data()}));
}
export async function activatePlayerAccount(uid,player){
 const {F,db,auth}=await services();
 if(!auth.currentUser)throw Error('Coach sign-in is required.');
 if(!uid||!player?.id||player.playerPortalEnabled!==true)throw Error('Choose an eligible 14U, 16U or 18U player.');
 const ref=F.doc(db,'rpAccounts',uid),snap=await F.getDoc(ref);
 if(!snap.exists())throw Error('That login has not signed into RebelsPrep yet.');
 const current=snap.data();
 if(current.role==='player'&&current.playerId&&current.playerId!==player.id)throw Error('That login is already connected to another player.');
 const teamIds=[...new Set(player.teamIds||[])];
 await F.setDoc(ref,{...current,role:'player',active:true,playerId:player.id,coachId:'',displayName:player.name||current.displayName||'',teamIds,activatedAt:F.serverTimestamp(),activatedBy:auth.currentUser.uid},{merge:true});
 return {uid,playerId:player.id,name:player.name,teamIds};
}
