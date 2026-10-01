export function settingsIssues(state){
 const issues=[];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(state.date)||!Number.isFinite(Date.parse(state.date)))issues.push('Choose a practice date.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(state.start))issues.push('Choose a valid start time.');
 if(!Number.isFinite(Number(state.durationMinutes))||Number(state.durationMinutes)<60||Number(state.durationMinutes)>360)issues.push('Choose a duration between 60 and 360 minutes.');
 if(![10,12,15].includes(Number(state.blockMinutes)))issues.push('Choose 10, 12 or 15 minute blocks.');
 if(state.facility!=='The Barn')issues.push('Choose The Barn; the other facilities will be configured later.');
 return issues;
}
export function attendanceIssues(state,players,coaches){
 const issues=[];
 const included=players.filter(p=>state.included.includes(p.id));
 if(included.length<3)issues.push('Include at least three hitters.');
 if(!coaches.some(c=>state.coachIds.includes(c.id)))issues.push('Include at least one coach.');
 for(const p of included){const a=state.adjustments[p.id]||{};if(a.arrival&&a.departure&&a.arrival>=a.departure)issues.push(p.name+': departure must be after arrival.');}
 return issues;
}
export function drillIssues(state,drills){
 const issues=[];
 for(const id of state.selectedDrills){const d=drills.find(d=>d.id===id);if(!d)issues.push('Remove an unknown drill.');else if(state.included.length>20&&d.tee)issues.push(d.name+': tee drills are unavailable above 20 hitters.');}
 return issues;
}
export function resetPractice(state,date){return {...state,date,started:true,included:[],coachIds:[],selectedDrills:[],adjustments:{},guests:[],allowReplacements:false,plan:null,clock:null,steps:{}};}
