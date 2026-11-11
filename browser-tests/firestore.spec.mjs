import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc} from 'firebase/firestore';

test('browser roster lifecycle reaches Firestore through production store and rules',async({page})=>{
 test.skip(!process.env.FIRESTORE_EMULATOR_HOST,'Run with the Firestore emulator; never production.');
 const projectId='demo-rebelsprep-roster';
 const env=await initializeTestEnvironment({projectId,firestore:{rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
 const account={active:true,role:'org_admin',teamIds:[]};
 const source='kc-rebels-18-national',target='kc-rebels-16-regional';
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c=>{
   await setDoc(doc(c.firestore(),'rpAccounts','synthetic-browser-admin'),account);
   for(const id of [source,target])await setDoc(doc(c.firestore(),'rpDirectoryTeams',id),{active:true,playerIds:[]});
  });
  const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');
  const adapter=`import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import * as F from '/node_modules/firebase/firebase-firestore.js';
const db=F.getFirestore(initializeApp({projectId:${JSON.stringify(projectId)},apiKey:'synthetic-test-key'}));
F.connectFirestoreEmulator(db,${JSON.stringify(host)},${Number(port)},{mockUserToken:{sub:'synthetic-browser-admin',email:'synthetic@example.test',email_verified:true}});
const account=${JSON.stringify(account)},user={uid:'synthetic-browser-admin'};
export const services=async()=>({F,db,auth:{currentUser:user}});
export const accountContext=async()=>({user,account});
export const isOrgCoach=a=>a?.active&&['org_admin','org_coach'].includes(a.role);
export const isCoach=a=>isOrgCoach(a)||a?.active&&a.role==='team_coach';
export const canAccessTeam=(a,t)=>isOrgCoach(a)||a?.active&&a.teamIds?.includes(t);`;
  await page.route('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js',async r=>r.fulfill({contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:await readFile(new URL('../node_modules/firebase/firebase-app.js',import.meta.url),'utf8')}));
  await page.route('**/account-model-rp276.mjs*',r=>r.fulfill({contentType:'text/javascript',body:adapter}));
  await page.goto('/roster-manager.html');
  await page.getByRole('button',{name:'+ Add Player'}).click();
  await page.getByLabel('Player name').fill('Synthetic Browser Player');
  await page.getByRole('button',{name:'Save Player'}).click();
  await expect(page.getByText('Synthetic Browser Player',{exact:true})).toBeVisible();
  const db=env.authenticatedContext('synthetic-browser-admin').firestore();
  const before=(await getDoc(doc(db,'rpDirectoryTeams',source))).data();
  expect(before.playerIds).toHaveLength(1);const id=before.playerIds[0];
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Player name').fill('Synthetic Browser Renamed');
  await page.getByRole('button',{name:'Save Player'}).click();
  await expect(page.getByText('Synthetic Browser Renamed',{exact:true})).toBeVisible();
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Transfer',exact:true}).click();
  await page.getByLabel('Destination team').selectOption(target);
  await page.getByRole('button',{name:'Confirm Transfer',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Player transferred.');
  await page.getByLabel('Team',{exact:true}).selectOption(target);
  await expect(page.getByText('Synthetic Browser Renamed',{exact:true})).toBeVisible();
  expect((await getDoc(doc(db,'rpPlayers',id))).data().teamIds).toEqual([target]);
  expect((await getDoc(doc(db,'rpDirectoryTeams',source))).data().playerIds).toEqual([]);
  await page.getByRole('button',{name:'Remove',exact:true}).click();
  await expect(page.locator('.rm-player')).toHaveCount(0);
  expect((await getDoc(doc(db,'rpPlayers',id))).data().active).toBe(false);
  expect((await getDoc(doc(db,'rpDirectoryTeams',target))).data().playerIds).toEqual([]);
 }finally{await env.cleanup();}
});
