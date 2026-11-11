import {test,expect} from '@playwright/test';
// Browser interaction coverage uses synthetic service responses. Actual Firestore
// writes and security rules are covered by roster-lifecycle.test.mjs in emulators.
const accountModule=`const account={active:true,role:'org_admin',teamIds:[]};
export const accountContext=async()=>({user:{uid:'synthetic-admin'},account});
export const isCoach=a=>!!a?.active;
export const isOrgCoach=a=>a?.role==='org_admin'&&a.active;`;
const storeModule=`let players=[];
export async function loadTeamRoster(a,t){return players.filter(p=>p.teamIds.includes(t));}
export async function addRosterPlayer(a,t,v){if(v.name==='Failure Test')throw Error('Synthetic save failure');players.push({...v,id:'synthetic-'+players.length,teamIds:[t]});}
export async function editRosterPlayer(a,t,id,v){Object.assign(players.find(p=>p.id===id),v);}
export async function removeRosterPlayer(a,t,id){players=players.filter(p=>p.id!==id);}
export async function transferRosterPlayer(a,f,t,id){players.find(p=>p.id===id).teamIds=[t];}`;
test.beforeEach(async({page})=>{
 await page.route('**/account-model-rp276.mjs*',r=>r.fulfill({contentType:'text/javascript',body:accountModule}));
 await page.route('**/roster-store.mjs',r=>r.fulfill({contentType:'text/javascript',body:storeModule}));
 await page.goto('/roster-manager.html');
});
test('coach adds, edits, transfers and removes a synthetic player',async({page})=>{
 await page.getByRole('button',{name:'+ Add Player'}).click();
 await page.getByLabel('Player name').fill('Synthetic Player');
 await page.getByLabel('Pitcher',{exact:true}).check();
 await page.getByRole('button',{name:'Save Player'}).click();
 await expect(page.getByText('Synthetic Player',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByLabel('Player name').fill('Synthetic Renamed');
 await page.getByRole('button',{name:'Save Player'}).click();
 await expect(page.getByText('Synthetic Renamed',{exact:true})).toBeVisible();
 page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Transfer',exact:true}).click();
 await page.getByLabel('Destination team').selectOption('kc-rebels-16-regional');
 await page.getByRole('button',{name:'Confirm Transfer',exact:true}).click();
 await expect(page.getByText('Player transferred.',{exact:true})).toBeVisible();
 await expect(page.locator('.rm-player')).toHaveCount(0);
 await page.getByLabel('Team',{exact:true}).selectOption('kc-rebels-16-regional');
 await expect(page.getByText('Synthetic Renamed',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Remove',exact:true}).click();
 await expect(page.locator('.rm-player')).toHaveCount(0);
});
test('failed save shows an error and restores controls',async({page})=>{
 await page.getByRole('button',{name:'+ Add Player'}).click();
 await page.getByLabel('Player name').fill('Failure Test');
 await page.getByRole('button',{name:'Save Player'}).click();
 await expect(page.getByRole('alert')).toHaveText('Synthetic save failure');
 await expect(page.getByRole('button',{name:'Save Player'})).toBeEnabled();
 await expect(page.getByLabel('Team',{exact:true})).toBeEnabled();
});

test('team coach sees only assigned team and no transfer controls',async({page})=>{
 await page.route('**/account-model-rp276.mjs*',r=>r.fulfill({contentType:'text/javascript',body:accountModule.replace("role:'org_admin',teamIds:[]","role:'team_coach',teamIds:['kc-rebels-16-regional']")}));
 await page.reload();
 await expect(page.locator('#rm-team option')).toHaveCount(1);
 await page.getByRole('button',{name:'+ Add Player'}).click();
 await page.getByLabel('Player name').fill('Synthetic Coach Player');
 await page.getByRole('button',{name:'Save Player'}).click();
 await expect(page.getByText('Synthetic Coach Player',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Transfer',exact:true})).toHaveCount(0);
});

test('fourth dashboard card and mobile bottom menu open the same roster screen',async({page})=>{
 const adapter=accountModule+`
export const canAccessTeam=()=>true;
export const services=async()=>({auth:{currentUser:{uid:'synthetic-admin'},authStateReady:async()=>{}},A:{isSignInWithEmailLink:()=>false},F:{doc:()=>({}),getDoc:async()=>({exists:()=>true,data:()=>({playerIds:[]})})},db:{}});
export const sendPlayerSignInLink=async()=>{};
export const finishPlayerSignIn=async()=>{};
export const ensurePersonalCoachAccount=async()=>{};
export const registerPendingPlayerLogin=async()=>{};
export const signOutAccount=async()=>{};
export const watchAccount=async()=>()=>{};`;
 await page.route('**/account-model-rp276.mjs*',r=>r.fulfill({contentType:'text/javascript',body:adapter}));
 await page.route('**/dashboard-preview.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./coach-portal-rp317.css"><link rel="stylesheet" href="./coach-portal-scale-rp321.css"><div id="app"></div><script type="module" src="./coach-portal-rp317.mjs"></script><script type="module" src="./coach-nav-rp321.mjs"></script>`}));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/dashboard-preview.html');
 await expect(page.locator('.coach-card-stack > .coach-card')).toHaveCount(4);
 await expect(page.locator('.coach-card-stack > .coach-card').nth(3).getByRole('heading')).toHaveText('Roster');
 const nav=page.locator('.coach-bottom-nav');
 await expect(nav.locator('button:visible')).toHaveCount(5);
 await expect(nav.locator('button:visible')).toHaveText(['Home','Practice','Focus','Drills','Roster']);
 const box=await nav.boundingBox();expect(box.width).toBeLessThanOrEqual(390);
 await page.locator('.coach-card-stack').getByRole('button',{name:/Roster/}).click();
 await expect(page).toHaveURL(/roster-manager.html/);
 await expect(page.getByRole('heading',{name:'Roster',exact:true})).toBeVisible();
 await expect(page.locator('.coach-bottom-nav [aria-current="page"]')).toHaveText('Roster');
 await page.goto('/dashboard-preview.html');
 await page.locator('.coach-bottom-nav').getByRole('button',{name:'Roster',exact:true}).click();
 await expect(page).toHaveURL(/roster-manager.html/);
});
