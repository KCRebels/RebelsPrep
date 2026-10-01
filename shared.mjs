import {firebaseConfig,builderEmails} from './shared-config.mjs?v=rpbuild19';
import {portalAssignments,newClock,changeClock,clockState,portalURL} from './portal-model.mjs?v=rpbuild18';
let servicesPromise;
export const configured=Boolean(firebaseConfig?.projectId&&firebaseConfig?.apiKey&&firebaseConfig?.authDomain);
export async function services(){
 if(!configured)throw Error('Shared portals need the separate RebelsPrep Firebase project configured.');
 if(!servicesPromise)servicesPromise=(async()=>{const root='https://www.gstatic.com/firebasejs/12.19.0/';const [app,A,F]=await Promise.all(['app','auth','firestore'].map(s=>import(root+'firebase-'+s+'.js')));const project=app.initializeApp(firebaseConfig,'RebelsPrep');return {A,F,auth:A.getAuth(project),db:F.getFirestore(project)};})();
 return servicesPromise;
}
export function allowed(user){return Boolean(user?.emailVerified&&builderEmails.includes(user.email?.toLowerCase()));}
export async function sendLogin(email,base){if(!builderEmails.includes(email.toLowerCase()))throw Error('That coach email is not enabled yet.');const {A,auth}=await services();const url=new URL(base);url.hash='';url.search='';await A.sendSignInLinkToEmail(auth,email,{url:url.href,handleCodeInApp:true});localStorage.setItem('RebelsPrep:login-email',email);}
export async function completeLogin(email,url){const {A,auth}=await services();await A.signInWithEmailLink(auth,email,url);localStorage.removeItem('RebelsPrep:login-email');}
export async function isLoginLink(url){const {A,auth}=await services();return A.isSignInWithEmailLink(auth,url);}
export async function signOut(){const {A,auth}=await services();await A.signOut(auth);}
export async function observeAuth(fn){const {A,auth}=await services();return A.onAuthStateChanged(auth,fn);}
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function registry(teamId){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');const d=await F.getDocFromServer(F.doc(db,'rpTeams',teamId));return d.exists()?d.data():{portals:{}};}
export async function activate(plan,teamId,date,allPeople,base){
 if(!plan)throw Error('Build a practice first.');
 plan=JSON.parse(JSON.stringify(plan));
 const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Sign in with an enabled coach email.');
 if(plan.requiresAcceptance&&!plan.accepted)throw Error('Accept the listed shortfalls before activating.');
 const clockToken=token(),teamRef=F.doc(db,'rpTeams',teamId);
 return F.runTransaction(db,async tx=>{
  const old=await tx.get(teamRef),data=old.exists()?old.data():{portals:{}};
  if(data.clockToken){const previous=await tx.get(F.doc(db,'rpClocks',data.clockToken));if(previous.exists()&&!clockState(previous.data().clock)?.done)throw Error('Finish the active practice before activating another.');}
  const portals={...data.portals};for(const person of allPeople){portals[person.id]??={token:token(),name:person.name,role:person.role};}
  for(const [id,p] of Object.entries(portals)){const person=(p.role==='coach'?plan.coaches:plan.players).find(x=>x.id===id);tx.set(F.doc(db,'rpPortals',p.token),{name:p.name,role:p.role,active:Boolean(person),date,clockToken:person?clockToken:null,blocks:person?portalAssignments(plan,person,p.role):[]});}
  tx.set(F.doc(db,'rpClocks',clockToken),{clock:newClock(plan),date,teamId});
  const next={portals,clockToken,plan,date};tx.set(teamRef,next);return {...next,links:Object.entries(portals).map(([id,p])=>({id,...p,url:portalURL(base,p.token)}))};
 });
}
export async function control(clockToken,action){const {F,db,auth}=await services();if(!allowed(auth.currentUser))throw Error('Coach sign-in is required.');const ref=F.doc(db,'rpClocks',clockToken);await F.runTransaction(db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('The shared practice could not be found.');tx.update(ref,{clock:changeClock(s.data().clock,action)});});}
export async function watchClock(id,onValue,onError){const {F,db}=await services();return F.onSnapshot(F.doc(db,'rpClocks',id),{includeMetadataChanges:true},s=>onValue(s.exists()?s.data():null,s.metadata),onError);}
export async function watchPortal(id,onValue,onError){if(!/^[a-f0-9]{64}$/.test(id))throw Error('This portal link is invalid.');const {F,db}=await services();return F.onSnapshot(F.doc(db,'rpPortals',id),{includeMetadataChanges:true},s=>onValue(s.exists()?s.data():null,s.metadata),onError);}
