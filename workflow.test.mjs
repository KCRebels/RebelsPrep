import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingsIssues,attendanceIssues,drillIssues,resetPractice} from './workflow.mjs';
import {players,coaches} from './roster.mjs';
import {drills} from './drills.mjs';
const draft={teamId:'kc-rebels-nationals',date:'2026-10-01',start:'17:30',durationMinutes:180,blockMinutes:12,facility:'The Barn',included:players.slice(0,12).map(p=>p.id),coachIds:[coaches[0].id],selectedDrills:['drill-28'],guests:[{id:'guest'}],adjustments:{},plan:{},clock:{},steps:{setup:true},history:[{date:'2026-09-30'}]};
test('new practice clears choices and temporary guests while retaining team and history',()=>{const fresh=resetPractice(draft,'2026-10-02');for(const key of ['included','coachIds','selectedDrills','guests'])assert.deepEqual(fresh[key],[]);assert.deepEqual(fresh.adjustments,{});assert.equal(fresh.plan,null);assert.equal(fresh.clock,null);assert.equal(fresh.teamId,draft.teamId);assert.deepEqual(fresh.history,draft.history);assert.deepEqual(draft.selectedDrills,['drill-28']);});
test('editing date or extending time retains drill and attendance choices',()=>{const changed={...draft,date:'2026-10-02',durationMinutes:210};assert.deepEqual(settingsIssues(changed),[]);assert.deepEqual(attendanceIssues(changed,players,coaches),[]);assert.deepEqual(drillIssues(changed,drills),[]);assert.deepEqual(changed.selectedDrills,draft.selectedDrills);assert.deepEqual(changed.included,draft.included);});
test('review explains unavailable tee drills and missing attendance',()=>{assert.match(drillIssues({...draft,included:players.map(p=>p.id),selectedDrills:['drill-0']},drills)[0],/above 20/);assert.equal(attendanceIssues({...draft,included:[],coachIds:[]},players,coaches).length,2);});
