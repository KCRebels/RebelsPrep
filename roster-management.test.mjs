import test from 'node:test';
import assert from 'node:assert/strict';
import {planAddPlayer,planRemovePlayer,planTransferPlayer,rosterForTeam,canManageTeam} from './roster-management.mjs';
test('add validates and avoids duplicate membership',()=>{
 const record=planAddPlayer({name:'  Katelyn   Example ',teamId:'team-a',pitcher:true,jerseyNumber:'9'});
 assert.equal(record.name,'Katelyn Example');assert.deepEqual(record.teamIds,['team-a']);assert.equal(record.pitcher,true);
 assert.throws(()=>planAddPlayer({name:'Katelyn Example',teamId:'team-a'},[record]),/already/);
 assert.throws(()=>planAddPlayer({name:'X',teamId:'team-a'}),/name/);
});
test('remove from only one team, preserving other memberships',()=>{
 const player={id:'p1',name:'Test',teamIds:['team-a','team-b'],active:true,playerPortalEnabled:true};
 assert.deepEqual(planRemovePlayer(player,'team-a').teamIds,['team-b']);
 const last=planRemovePlayer(player,'team-b');assert.equal(last.active,true);
 assert.equal(planRemovePlayer({...player,teamIds:['team-a']},'team-a').active,false);
 assert.deepEqual(player.teamIds,['team-a','team-b']);
});
test('transfer conserves player identity and remaining memberships',()=>{
 const p={id:'p1',name:'Test',teamIds:['team-a','team-c'],active:true};
 const next=planTransferPlayer(p,'team-a','team-b');
 assert.equal(next.id,'p1');assert.deepEqual(next.teamIds,['team-c','team-b']);
 assert.throws(()=>planTransferPlayer(p,'team-a','kc-rebels-nationals'),/individual/);
});
test('roster sorted and filtered',()=>{
 const players=[{id:'2',name:'Zoe',teamIds:['x']},{id:'1',name:'Abby',teamIds:['x']},{id:'3',name:'Out',teamIds:['x'],active:false}];
 assert.deepEqual(rosterForTeam(players,'x').map(p=>p.name),['Abby','Zoe']);
});
test('team coaches limited to assigned teams',()=>{
 const c={role:'team_coach',active:true,teamIds:['a']};
 assert.equal(canManageTeam(c,'a'),true);assert.equal(canManageTeam(c,'b'),false);
 assert.equal(canManageTeam({...c,active:false},'a'),false);
});
