import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingsIssues,attendanceIssues,drillIssues,resetPractice,teeRequirement} from './workflow.mjs';
import {players,coaches} from './roster.mjs';
import {drills} from './drills.mjs';
const draft={practiceType:'Hitting',teamId:'kc-rebels-nationals',date:'2026-10-01',start:'17:30',durationMinutes:180,blockMinutes:12,facility:'The Barn',included:players.slice(0,12).map(p=>p.id),coachIds:[coaches[0].id],selectedDrills:['drill-28'],guests:[{id:'guest'}],adjustments:{},plan:{},clock:{},steps:{setup:true},history:[{date:'2026-09-30'}]};
test('new practice clears choices and temporary guests while retaining team and history',()=>{const fresh=resetPractice(draft,'2026-10-02');for(const key of ['included','coachIds','selectedDrills','guests'])assert.deepEqual(fresh[key],[]);assert.deepEqual(fresh.adjustments,{});assert.equal(fresh.plan,null);assert.equal(fresh.clock,null);assert.equal(fresh.teamId,draft.teamId);assert.deepEqual(fresh.history,draft.history);assert.deepEqual(draft.selectedDrills,['drill-28']);});
test('editing date or extending time retains drill and attendance choices',()=>{const changed={...draft,date:'2026-10-02',durationMinutes:210};assert.deepEqual(settingsIssues(changed),[]);assert.deepEqual(attendanceIssues(changed,players,coaches),[]);assert.deepEqual(drillIssues(changed,drills),[]);assert.deepEqual(changed.selectedDrills,draft.selectedDrills);assert.deepEqual(changed.included,draft.included);});
test('tee choices remain selectable for 45 hitters and warnings count selected equipment',()=>{const ids=drills.filter(d=>d.tees===1).slice(0,9).map(d=>d.id);assert.equal(ids.length,9);assert.deepEqual(drillIssues({...draft,included:players.map(p=>p.id),selectedDrills:ids},drills),[]);assert.equal(teeRequirement(ids,drills),9);assert.equal(teeRequirement([],drills),0);assert.equal(teeRequirement([...ids,ids[0]],drills),9);assert.equal(teeRequirement([drills.find(d=>d.tees===2).id],drills),2);assert.equal(attendanceIssues({...draft,included:[],coachIds:[]},players,coaches).length,2);});

test('practice type must be selected and only Hitting is currently supported',()=>{
 for(const practiceType of ['',undefined,'Fielding','Full Practice'])assert.ok(settingsIssues({...draft,practiceType}).some(x=>x.includes('Choose a practice type')));
 assert.deepEqual(settingsIssues({...draft,practiceType:'Hitting'}),[]);
 assert.equal(resetPractice(draft,'2026-10-02').practiceType,'');
});
