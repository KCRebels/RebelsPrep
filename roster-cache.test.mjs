import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRosterSnapshot} from './roster-cache.mjs';
import {teams} from './teams.mjs';
import {rosterPlayers} from './team-rosters.mjs';
test('practice team arrays share canonical player identities',()=>{
 for(const team of teams)for(const player of team.players)assert.equal(player,rosterPlayers.find(p=>p.id===player.id));
});
function fixture(){
 const players=[{id:'synthetic-1',name:'Test Player',memberTeamIds:['a-national','kc-rebels-nationals']}];
 const teams=['a-national','b-regional','kc-rebels-nationals','kc-rebels-all-regional'].map(id=>({id,players:players.filter(p=>p.memberTeamIds.includes(id))}));
 return {players,teams};
}
test('empty team clears individual and combined practice rosters',()=>{
 const {players,teams}=fixture();const original=teams[0].players;
 applyRosterSnapshot(players,teams,'a-national',[]);
 assert.equal(teams[0].players,original);assert.equal(original.length,0);
 assert.equal(teams[2].players.length,0);
});
test('transfer refresh removes old memberships and preserves identity',()=>{
 const {players,teams}=fixture();const original=players[0];
 applyRosterSnapshot(players,teams,'b-regional',[{id:'synthetic-1',name:'Renamed Test',active:true,teamIds:['b-regional'],groupIds:['kc-rebels-nationals'],pitcher:true}]);
 assert.equal(players[0],original);assert.equal(original.pitcher,true);
 assert.deepEqual(original.memberTeamIds,['b-regional','kc-rebels-all-regional']);
 assert.equal(teams[0].players.length,0);assert.equal(teams[2].players.length,0);
 assert.equal(teams[3].players[0],original);
});
test('new player appears in individual and combined rosters without duplicates',()=>{
 const {players,teams}=fixture();const record={id:'synthetic-2',name:'Added Test',teamIds:['a-national'],active:true};
 applyRosterSnapshot(players,teams,'a-national',[record]);
 applyRosterSnapshot(players,teams,'a-national',[record]);
 assert.deepEqual(teams[0].players.map(p=>p.id),['synthetic-2']);
 assert.deepEqual(teams[2].players.map(p=>p.id),['synthetic-2']);
});
