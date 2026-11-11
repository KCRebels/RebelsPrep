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
