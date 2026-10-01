import {selectionKey,combinedTeam} from './team-selection.mjs?v=rpbuild33';
import * as shared from './shared.mjs?v=rpcheckin48';
import {clockState} from './portal-model.mjs?v=rpbuild18';
import {openPortal} from './portal.mjs?v=rpbuild33';
import {players as roster,coaches,rosterReview} from './roster.mjs?v=rpbuild33';
import {drills} from './drills.mjs?v=rpbuild16';
import {timeLabel,clockMinutes,validatePractice} from './scheduler.mjs?v=rpbuild16';
import {teams} from './teams.mjs?v=rpbuild34';
import {settingsIssues,attendanceIssues,drillIssues,resetPractice,teeRequirement} from './workflow.mjs?v=rpbuild32';
const KEY='RebelsPrep:coach-pilot:1';
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const blank=(teamId=teams[0].id)=>({teamId,teamIds:[teamId],started:false,practiceType:'',steps:{},date:today(),start:'17:30',durationMinutes:180,blockMinutes:12,facility:'The Barn',included:[],coachIds:[],selectedDrills:[],adjustments:{},guests:[],allowReplacements:false,plan:null,history:[],clock:null});
let state,view='home',busy=false,error='',worker=null,timer=null,sound=false,lastAnnouncement='',drillSearch='',drillCategory='All Drills',recommendation=null,recommendationWorker=null,replacementOffer=null,drillPickerOpen=false;
let historyTeamId=null,homeTeamIds=[],directoryVersion=0;
let sharedUser=null,sharedDirectory=null,sharedData=null,sharedStop=null,sharedBusy=false,sharedMessage='',checkins=[],checkinStop=null;
const teamKey=id=>KEY+':team:'+id;
try{const id=localStorage.getItem(KEY+':active-team')||teams[0].id;const saved=localStorage.getItem(teamKey(id))||localStorage.getItem(KEY);state={...blank(id),...JSON.parse(saved||'{}')};if(saved&&JSON.parse(saved).started===undefined)state.started=true;state.teamIds=(state.teamIds||[state.teamId]).filter(id=>teams.some(t=>t.id===id));if(!state.teamIds.length)state.teamIds=[teams[0].id];state.teamId=selectionKey(state.teamIds);}catch{state=blank();error='Saved preview could not be read. Your original saved value has not been overwritten.';}
if(state.plan&&validatePractice(state.plan).length){state.plan=null;state.clock=null;error='The saved practice needs to be rebuilt with the updated station checks. Attendance and settings were kept.';}
const team=()=>combinedTeam(teams,state.teamIds||[state.teamId]);
state.selectedDrills=state.selectedDrills.filter(id=>id!=='drill-0');
const expandedDrills=new Set();
const allPlayers=()=>[...team().players,...state.guests];
const name=id=>allPlayers().find(p=>p.id===id)?.name||coaches.find(c=>c.id===id)?.name||id;
function save(){try{localStorage.setItem(teamKey(state.teamId),JSON.stringify(state));localStorage.setItem(KEY+':active-team',state.teamId);for(const id of state.teamIds||[state.teamId]){if(state.started)localStorage.setItem(KEY+':resume:'+id,state.teamId);else if(localStorage.getItem(KEY+':resume:'+id)===state.teamId)localStorage.removeItem(KEY+':resume:'+id);}}catch{error='This device could not save the draft. Keep this page open or free storage before closing.';}}
function dirty(scope='drills'){if(sharedData&&!clockState(sharedData.clock)?.done){error='Finish the active shared practice before changing this draft.';return false;}if(state.clock?.running){error='Pause or finish the local clock before changing this practice.';return false;}if(busy){error='Wait for this build to finish before changing the practice.';return false;}replacementOffer=null;state.started=true;state.plan=null;state.clock=null;const invalid=scope==='setup'?['setup','attendance','drills']:scope==='attendance'?['attendance','drills']:['drills'];for(const step of invalid)delete state.steps[step];save();return true;}
function flushSetup(){if(view!=='setup')return true;const values={};for(const id of ['date','start','facility','durationMinutes','blockMinutes']){const el=$('#'+id);if(el)values[id]=['durationMinutes','blockMinutes'].includes(id)?Number(el.value):el.value;}if(Object.entries(values).some(([id,value])=>state[id]!==value)){if(!dirty('setup'))return false;Object.assign(state,values);save();}return true;}
function setView(v){if(!flushSetup()){render();return;}view=v;error='';render();window.scrollTo(0,0);}
function issues(){return [...settingsIssues(state),...attendanceIssues(state,allPlayers(),coaches),...drillIssues(state,drills)];}
function nav(){const active=['plan','review'].includes(view)?'review':view;return '<nav class="bottom-nav" aria-label="Practice planner">'+[['home','Home'],['setup','1 Setup'],['attendance','2 Attendance'],['drills','3 Drills'],['review','Build']].map(([v,label])=>'<button data-view="'+v+'" '+(v===active?'aria-current="page"':'')+'><span>'+label+'</span>'+(state.steps[v]?' <span class="step-check" aria-label="complete">✓</span>':'')+'</button>').join('')+'</nav>';}
function savedTeamState(id){
 const draftId=localStorage.getItem(KEY+':resume:'+id)||id;
 if(draftId===state.teamId)return state;
 try{return {...blank(id),...JSON.parse(localStorage.getItem(teamKey(draftId))||'{}')};}catch{return blank(id);}
}
function home(){
 const selected=homeTeamIds.length?combinedTeam(teams,homeTeamIds):null;
 return heading('Teams','Select the teams practicing together.')+'<div class="team-list">'+teams.map(t=>{
 const draft=savedTeamState(t.id),checked=homeTeamIds.includes(t.id);
 return '<section class="panel team-card selectable-team '+(checked?'selected-team':'')+'"><label class="team-choice"><input type="checkbox" data-team-check="'+t.id+'" '+(checked?'checked':'')+'><span><strong>'+esc(t.name)+'</strong><small>'+t.players.length+' players</small></span></label><div class="actions team-card-actions"><button data-history-team="'+t.id+'">History</button>'+(draft.started?'<button class="primary" data-resume-team="'+t.id+'">Resume</button>':'')+'</div></section>';
 }).join('')+'</div><div class="actions step-actions"><button class="primary" id="build-selected-teams" '+(!selected||selected.missingRosters.length?'disabled':'')+'>Continue</button></div>'+(selected?.missingRosters.length?'<p class="status">Rosters needed: '+selected.missingRosters.map(esc).join(', ')+'.</p>':'');
}
function resumeTeam(id){
 const draft=savedTeamState(id);homeTeamIds=draft.teamIds||[id];
 if(!loadSelection(homeTeamIds))return;
 setView(state.plan?'plan':state.steps.drills?'review':state.steps.attendance?'drills':state.steps.setup?'attendance':'setup');
}
function loadSelection(ids){
 const id=selectionKey(ids);
 if(id!==state.teamId){
  if(sharedData&&!clockState(sharedData.clock)?.done||state.clock&&!state.clock.done){error='Finish the active practice before changing teams.';render();return false;}
  if(busy){error='Wait for the build to finish before changing teams.';render();return false;}
  save();sharedStop?.();directoryVersion++;sharedDirectory=null;sharedData=null;sharedMessage='';
  try{state={...blank(id),...JSON.parse(localStorage.getItem(teamKey(id))||'{}'),teamId:id,teamIds:[...ids]};}catch{state={...blank(id),teamIds:[...ids]};}
  recommendationWorker?.terminate();recommendation=null;drillSearch='';drillCategory='All Drills';
  if(shared.allowed(sharedUser))connectDirectory().catch(e=>{sharedMessage=e.message;render();});
 }
 state.teamIds=[...ids];return true;
}
function chooseSelectedTeams(){
 if(!homeTeamIds.length)return;
 const selected=combinedTeam(teams,homeTeamIds);
 if(selected.missingRosters.length){error='Add the selected teams’ rosters before building.';render();return;}
 if(!loadSelection(homeTeamIds))return;
 state.started=true;save();setView('setup');
}
function stepActions(next,label){return '<div class="actions step-actions">'+startOverButton()+'<button id="save-draft">Save draft</button><button class="primary" data-next="'+next+'">'+label+'</button></div>';}
function nextStep(next){if(!flushSetup()){render();return;}const errors=view==='setup'?settingsIssues(state):view==='attendance'?attendanceIssues(state,allPlayers(),coaches):drillIssues(state,drills);if(errors.length){error=errors.join(' ');render();window.scrollTo(0,0);return;}state.steps[view]=true;state.started=true;save();setView(next);}
function review(){const problems=issues(),chosen=drills.filter(d=>state.selectedDrills.includes(d.id));return heading('Review Practice',esc(team().name))+'<section class="panel"><h2>Practice settings</h2><p>'+esc(state.date)+' · '+esc(state.facility)+' · '+timeLabel(clockMinutes(state.start))+'–'+timeLabel(clockMinutes(state.start)+Number(state.durationMinutes))+'</p><p>'+state.durationMinutes+' minutes · '+state.blockMinutes+' minute blocks</p><button data-view="setup">Edit Setup</button></section><section class="panel"><h2>Attendance</h2><p>'+state.included.length+' hitters · '+state.coachIds.length+' coaches</p><p class="muted">'+coaches.filter(c=>state.coachIds.includes(c.id)).map(c=>esc(c.name)).join(' · ')+'</p><button data-view="attendance">Edit Attendance</button></section><section class="panel"><h2>Drills</h2><p>'+chosen.length+' selected</p>'+(chosen.length?'<ul class="review-list">'+chosen.map(d=>'<li>'+esc(d.name)+'</li>').join(''):'<p class="muted">No additional drills selected.</p>')+'<p class="muted">Required: Warm Up · '+'Machine · Front Toss. '+'Live is the priority.'+'</p>'+equipmentWarning()+'<button data-view="drills">Edit Drills</button></section>'+(problems.length?'<div class="notice"><strong>Finish these choices</strong><ul>'+problems.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'')+replacementOfferHTML()+'<div class="actions step-actions">'+startOverButton()+'<button id="save-draft">Save draft</button>'+(state.plan?'<button data-view="plan">View Practice</button>':'')+'<button id="build" class="primary" '+(busy||problems.length?'disabled':'')+'>'+(busy?'Building…':'Build Practice')+'</button></div>';}
function options(vals,current){return vals.map(([v,label,disabled])=>'<option value="'+v+'" '+(String(v)===String(current)?'selected':'')+' '+(disabled?'disabled':'')+'>'+label+'</option>').join('');}
function heading(title,sub){return '<h1>'+title+'</h1><p class="muted">'+sub+'</p>';}
function setting(label,html){return '<label>'+label+html+'</label>';}
function setup(){
 const end=timeLabel(clockMinutes(state.start)+Number(state.durationMinutes));
 return heading('Setup',esc(team().name))+'<section class="panel"><h2>Practice settings</h2><div class="grid settings-grid">'+
 '<div class="setup-primary-row" style="grid-column:1/-1;display:grid;grid-template-columns:1.45fr .75fr;gap:12px;width:100%">'+
 '<label style="min-width:0">Date<input id="date" type="date" value="'+state.date+'" style="box-sizing:border-box;width:100%;height:48px;font-size:16px;line-height:48px;padding:0 10px"></label>'+
 '<label style="min-width:0">Facility<select id="facility" style="box-sizing:border-box;width:100%;height:48px;font-size:16px;line-height:48px;padding:0 10px">'+options([['The Barn','The Barn'],['The Shed','The Shed — setup later',true],['Lone Elm','Lone Elm — setup later',true],['The Fields','The Fields — setup later',true]],state.facility)+'</select></label>'+
 '</div>'+
 '<div class="practice-type-field"><span>Practice type</span><div class="practice-type-buttons" role="group" aria-label="Practice type"><button type="button" data-practice-type="Hitting" aria-pressed="'+(state.practiceType==='Hitting')+'">Hitting</button><button type="button" disabled aria-disabled="true">Fielding</button><button type="button" disabled aria-disabled="true">Full</button></div></div>'+
 '<div class="practice-timing-row" style="grid-column:1/-1;display:flex;gap:8px;width:100%;align-items:flex-start">'+
 '<label style="flex:1 1 0;width:0;min-width:0;font-size:13px;line-height:1.2;white-space:nowrap">Start time<input id="start" type="time" value="'+state.start+'" style="box-sizing:border-box;display:block;width:100%;min-width:0;height:50px;min-height:50px;margin:8px 0 0;padding:0 8px;font-size:16px;font-weight:700;line-height:50px"></label>'+
 '<label style="flex:1 1 0;width:0;min-width:0;font-size:13px;line-height:1.2;white-space:nowrap">Duration<input id="durationMinutes" type="number" min="60" max="360" step="1" value="'+state.durationMinutes+'" style="box-sizing:border-box;display:block;width:100%;min-width:0;height:50px;min-height:50px;margin:8px 0 0;padding:0 8px;font-size:16px;font-weight:700;line-height:50px"></label>'+
 '<label style="flex:1 1 0;width:0;min-width:0;font-size:13px;line-height:1.2;white-space:nowrap">Block<select id="blockMinutes" style="box-sizing:border-box;display:block;width:100%;min-width:0;height:50px;min-height:50px;margin:8px 0 0;padding:0 8px;font-size:16px;font-weight:700;line-height:50px">'+options([[10,'10 min'],[12,'12 min'],[15,'15 min']],state.blockMinutes)+'</select></label>'+
 '</div>'+
 '</div><p class="muted">Ends at <strong id="practice-end">'+end+'</strong>. Each block includes one minute to rotate. Extra time is added only when you change the duration.</p></section>'+stepActions('attendance','Next: Attendance');

}
function resetDrillChoices(){state.selectedDrills=[];drillSearch='';drillCategory='All Drills';recommendationWorker?.terminate();recommendation=null;}
function startOverDraft(){
 if(sharedData&&!clockState(sharedData.clock)?.done||state.clock&&!state.clock.done){error='Finish the active practice before starting over.';render();return;}
 if(busy)return;
 replacementOffer=null;drillPickerOpen=false;error='';
 state={...resetPractice({...blank(state.teamId),teamIds:state.teamIds,history:state.history},today()),started:false};homeTeamIds=[];
 resetDrillChoices();view='setup';save();render();window.scrollTo(0,0);
}
function startOverButton(){
 const active=Boolean(sharedData&&!clockState(sharedData.clock)?.done||state.clock&&!state.clock.done);
 return !active&&['setup','attendance','drills','review','plan'].includes(view)?'<button id="start-over" '+(busy?'disabled':'')+'>Start Over</button>':'';
}
function newPractice(){
 if(sharedData&&!clockState(sharedData.clock)?.done){error='Finish the active shared practice before starting a new practice.';render();return;}
 if(busy||state.clock?.running){error='Pause the clock or finish the build before starting a new practice.';render();return;}
 replacementOffer=null;drillPickerOpen=false;state=resetPractice(state,today());drillSearch='';drillCategory='All Drills';recommendationWorker?.terminate();recommendation=null;save();setView('setup');
}
function person(p,coach=false){
 const inList=coach?state.coachIds:state.included,adjust=state.adjustments[p.id]||{},parts=[];
 if(p.pitcher)parts.push('Pitcher'+(p.roleSource==='written'?' · updated':''));
 if(p.catcher)parts.push('Catcher'+(p.roleSource==='written'?' · updated':''));
 if(adjust.arrival)parts.push('Arrives '+timeLabel(clockMinutes(adjust.arrival)));
 if(adjust.departure)parts.push('Leaves '+timeLabel(clockMinutes(adjust.departure)));
 if(adjust.noPitchWarmup)parts.push('No pitching warm-up');
 if(adjust.canPitch===false)parts.push('Not pitching');
 if(adjust.canCatch===false)parts.push('Not catching');
 return '<div class="person '+(inList.includes(p.id)?'included':'')+'"><label class="check"><input type="checkbox" data-include="'+p.id+'" '+(coach?'data-coach ':'')+(inList.includes(p.id)?'checked':'')+'><span>'+esc(p.name)+'<small>'+esc(parts.join(' | ')||(coach?'Coach':'Hitter'))+'</small></span></label>'+(!coach?'<button data-adjust="'+p.id+'">Adjust</button>':'')+'</div>';
}
function attendance(){
 return heading('Attendance','Only included players and coaches will enter this draft.')+
 '<section class="panel"><h2>Players <span class="count">'+state.included.length+' / '+allPlayers().length+'</span></h2><p class="status">'+esc(rosterReview.message)+'</p><div class="actions attendance-actions"><button id="include-all">Select All</button><button id="clear-players">Clear All</button><button id="add-guest">Add Guest</button></div><p class="muted">No shared responses are connected yet. These checkboxes are your manual attendance choices for this device.</p><div class="people">'+allPlayers().map(p=>person(p)).join('')+'</div></section>'+
 '<section class="panel"><h2>Coaches <span class="count">'+state.coachIds.length+' / '+coaches.length+'</span></h2><div class="actions"><button id="all-coaches">Select All</button><button id="clear-coaches">Clear All</button></div><p class="muted">Each Front Toss station needs its own coach. Machine and Live do not require a coach.</p><div class="people">'+coaches.map(c=>person(c,true)).join('')+'</div></section>'+
 stepActions('drills','Next: Drills');
}
function practiceInput(){return {players:allPlayers().filter(p=>state.included.includes(p.id)).map(p=>({...p,...state.adjustments[p.id]})),coaches:coaches.filter(c=>state.coachIds.includes(c.id)),drills:state.selectedDrills.map(id=>drills.find(d=>d.id===id)).filter(Boolean),facility:state.facility,start:state.start,durationMinutes:state.durationMinutes,blockMinutes:state.blockMinutes,allowReplacements:state.allowReplacements,previousReplacements:state.history.at(-1)?.replacementIds||[]};}
function recommendationKey(){const input=practiceInput();return JSON.stringify({...input,drills:input.drills.filter(d=>d.kind!=='drill'||d.name==='Basic Tee Work')});}
function drillGuidance(){
 if(state.included.length<3||!state.coachIds.length)return 'Choose attendance to see the suggested drill count.';
 const r=recommendation;
 if(!r||r.key!==recommendationKey()||r.pending)return 'Calculating drill count…';
 if(r.error)return 'Suggested drill count unavailable.';
 return r.total+' hitting stations total · '+r.frontCount+' additional with Front Toss'+(r.liveCount?' · '+r.liveCount+' additional with Live':'');
}
function drillChoiceTitle(){const r=recommendation;return r&&r.key===recommendationKey()&&!r.pending&&!r.error?'Set Up '+r.count+' Drill '+(r.count===1?'Station':'Stations'):'Choose Practice Drills';}
function updateDrillGuidance(){
 const el=$('#drill-guidance');if(el)el.textContent=drillGuidance();
 const title=$('#drill-choice-title');if(title)title.textContent=drillChoiceTitle();
 const summary=$('#selection-summary');if(summary)summary.innerHTML=selectionSummary();const pickerHeading=$('#picker-title');if(pickerHeading)pickerHeading.textContent=pickerTitle();const warning=$('#equipment-warning');if(warning)warning.innerHTML=equipmentWarning();
 updatePickerAvailability();
 const count=$('#drill-choice-count');if(count)count.textContent=extraDrills().filter(d=>state.selectedDrills.includes(d.id)).length+' selected';
}
function focusOptions(kind){const choices=drills.filter(d=>d.kind===kind),selected=choices.filter(d=>state.selectedDrills.includes(d.id));const value=selected.length>1?'multiple':selected[0]?.id||'';return options([['','Standard'],...(selected.length>1?[['multiple','Selected library drills',true]]:[]),...choices.map(d=>[d.id,esc(d.name),false])],value);}
function focusCards(){return '<section class="panel focus-card"><p class="drill-category">Built-in Hitting</p><h2>Machine + Front Toss Focus</h2><p class="muted">Use Standard or choose a library drill for these sessions.</p><div class="focus-fields">'+setting('Machine','<select id="machine-focus">'+focusOptions('machine')+'</select>')+setting('Front Toss','<select id="front-focus">'+focusOptions('front')+'</select>')+'</div></section><section class="panel focus-card"><p class="drill-category">Drill Stations</p><h2 id="drill-choice-title">'+drillChoiceTitle()+'</h2><p id="drill-guidance" class="drill-guidance-simple" aria-live="polite">'+drillGuidance()+'</p><p id="drill-choice-count" class="status">'+extraDrills().filter(d=>state.selectedDrills.includes(d.id)).length+' selected</p><button class="primary choose-drills-button" id="open-drill-picker">Choose Drills</button></section>';}
function calculateDrillCount(){
 if(view!=='drills'||busy)return;
 const key=recommendationKey();
 if(recommendation?.key===key){updateDrillGuidance();return;}
 recommendationWorker?.terminate();
 if(state.included.length<3||!state.coachIds.length){recommendation=null;updateDrillGuidance();return;}
 recommendation={key,pending:true};updateDrillGuidance();
 try{
  const w=new Worker('./worker.mjs?v=rpbuild16',{type:'module'});recommendationWorker=w;
  w.onmessage=e=>{
   if(recommendation?.key===key){
    recommendation=e.data.error?{key,error:e.data.error}:{key,...e.data.recommendation};
    updateDrillGuidance();
   }
   w.terminate();
  };
  w.onerror=()=>{if(recommendation?.key===key){recommendation={key,error:'The count calculator could not load. Refresh and retry.'};updateDrillGuidance();}w.terminate();};
  w.postMessage({mode:'recommend',input:{...practiceInput(),allowReplacements:true,drills:[...extraDrills(),...practiceInput().drills.filter(d=>d.kind!=='drill'||d.name==='Basic Tee Work')]}});
 }catch(e){recommendation={key,error:e.message};updateDrillGuidance();}
}
function availableDrills(){return drills;}
function extraDrills(){return availableDrills().filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work');}
function drillInstructions(d){return [['Purpose',d.primaryPurpose],['Set Up',d.spaceSetup],['Equipment',d.equipment],['How To Do It',d.howItWorks],['Coaching Cues',d.coachingCues],['What Good Looks Like',d.success],['Best Used For',d.bestUsedFor],['Notes',d.notes]].filter(([,text])=>text).map(([label,text])=>'<section><h4>'+label+'</h4><p>'+esc(text)+'</p></section>').join('');}
function equipmentWarning(){const n=teeRequirement(state.selectedDrills,drills);return n>6?'<p class="notice equipment-warning" role="status">These choices call for '+n+' tees. You have 6. The drills may need to run in different blocks.</p>':'';}
function stationLimit(){const r=recommendation;return r&&r.key===recommendationKey()&&!r.pending&&!r.error?r.count:null;}
function pickerLocked(){const limit=stationLimit();return limit===null||extraDrills().filter(d=>state.selectedDrills.includes(d.id)).length>=limit;}
function updatePickerAvailability(){const locked=pickerLocked();document.querySelectorAll('[data-select-drill]').forEach(el=>{const disabled=locked&&!state.selectedDrills.includes(el.dataset.selectDrill);el.disabled=disabled;el.closest('.drill-row').classList.toggle('unavailable',disabled);});const all=$('#all-drills');if(all)all.disabled=locked;}
function pickerTitle(){const r=recommendation;return r&&r.key===recommendationKey()&&!r.pending&&!r.error?'Choose '+r.count+' Station '+(r.count===1?'Drill':'Drills'):'Choose Station Drills';}
function selectionSummary(){const selected=practiceInput().drills,r=recommendation,target=r&&r.key===recommendationKey()&&!r.pending&&!r.error?r.count:null,stationChoices=selected.filter(d=>d.kind==='drill').length;let station=0;return '<strong>'+stationChoices+(target!==null?' of '+target:'')+' station drills selected</strong>'+(selected.length?'<ol>'+selected.map(d=>'<li>'+(d.kind==='drill'?++station+'. ':d.kind==='machine'?'Machine focus: ':'Front Toss focus: ')+esc(d.name)+'</li>').join('')+'</ol>':'<p>No drills selected yet</p>');}
function drillResults(){
 const query=drillSearch.trim().toLowerCase();
 const matches=drills.filter(d=>(drillCategory==='All Drills'||d.category===drillCategory)&&(!query||[d.name,d.category,d.primaryPurpose,d.hittingMethod,d.equipment].join(' ').toLowerCase().includes(query)));
 return '<div class="drill-rows">'+matches.map(d=>{const selected=state.selectedDrills.includes(d.id),expanded=expandedDrills.has(d.id),disabled=!selected&&pickerLocked();return '<article class="drill-row'+(selected?' selected':'')+(disabled?' unavailable':'')+'"><div class="drill-row-head"><button class="drill-row-select" data-select-drill="'+d.id+'" '+(disabled?'disabled ':'')+'aria-pressed="'+selected+'" aria-label="'+(selected?'Deselect ':'Select ')+esc(d.name)+'"><span class="drill-row-mark" aria-hidden="true">'+(selected?'✓':'+')+'</span><span class="drill-row-label"><strong>'+esc(d.name)+'</strong><small>'+esc(d.category)+' · '+esc(d.hittingMethod)+'</small></span></button><button class="drill-row-details" data-drill-details="'+d.id+'" aria-expanded="'+expanded+'" aria-controls="detail-'+d.id+'">Details</button></div><div class="drill-row-instructions" id="detail-'+d.id+'" '+(expanded?'':'hidden')+'>'+drillInstructions(d)+'</div></article>';}).join('')+'</div>'+(matches.length?'':'<p class="empty">No drills match. Try another search or category.</p>');
}
function bindDrillCards(){
 document.querySelectorAll('[data-select-drill]').forEach(el=>el.onclick=()=>{
  const id=el.dataset.selectDrill;
  if(!state.selectedDrills.includes(id)&&pickerLocked())return;
  if(!dirty()){render();return;}
  state.selectedDrills=state.selectedDrills.includes(id)?state.selectedDrills.filter(x=>x!==id):[...state.selectedDrills,id];
  save();refreshDrills();calculateDrillCount();
 });
 document.querySelectorAll('[data-drill-details]').forEach(el=>el.onclick=()=>{const id=el.dataset.drillDetails;if(expandedDrills.has(id))expandedDrills.delete(id);else expandedDrills.add(id);el.setAttribute('aria-expanded',String(expandedDrills.has(id)));$('#detail-'+id).hidden=!expandedDrills.has(id);});
}
function refreshDrills(){
 document.querySelector('.bottom-nav').outerHTML=nav();document.querySelectorAll('.bottom-nav [data-view]').forEach(el=>el.onclick=()=>setView(el.dataset.view));$('#drill-results').innerHTML=drillResults();bindDrillCards();updateDrillGuidance();
 document.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.category===drillCategory)));
}
function drillPage(){
 const categories=['All Drills',...new Set(drills.map(d=>d.category))];
 if(!categories.includes(drillCategory))drillCategory='All Drills';
 if(!drillPickerOpen)return '<h1>Choose Drills</h1>'+focusCards()+'<div id="equipment-warning">'+equipmentWarning()+'</div>'+stepActions('review','Next: Review');
 return '<div class="picker-screen"><button class="picker-back" id="close-drill-picker">‹ Back To Practice</button><section class="panel picker-intro"><p class="drill-category">Practice Drills</p><h1 id="picker-title">'+pickerTitle()+'</h1><p>Select drills in the order you want their stations listed.</p></section><section class="selection-summary" id="selection-summary" aria-live="polite">'+selectionSummary()+'</section><div id="equipment-warning">'+equipmentWarning()+'</div><section class="drill-library" id="drill-picker"><input id="drill-search" type="search" aria-label="Search drills" placeholder="Search drills" value="'+esc(drillSearch)+'"><div class="drill-categories" aria-label="Drill categories">'+categories.map(c=>'<button data-category="'+esc(c)+'" aria-pressed="'+(c===drillCategory)+'">'+esc(c)+'</button>').join('')+'</div><div class="actions picker-actions"><button id="all-drills">Select All</button><button id="clear-drills">Clear All</button></div><div id="drill-results">'+drillResults()+'</div></section>'+stepActions('review','Next: Review')+'</div>';
}
function stationsFor(block,filter){
 return block.stations.filter(s=>!filter||[...s.players,s.pitcher,s.catcher,s.coach].includes(filter)).map(s=>'<div class="station"><strong>'+esc(s.drill)+' <span class="muted">· '+esc(s.resource)+'</span></strong>'+s.players.map(id=>esc(name(id))).join(' · ')+
 (s.pitcher?'<div class="role">Pitching: '+esc(name(s.pitcher))+'</div>':'')+
 (s.catcher?'<div class="role">Catching: '+esc(name(s.catcher))+'</div>':'')+
 (s.coach?'<div class="role">Coach: '+esc(name(s.coach))+'</div>':'')+
 (s.equipment?'<div class="muted">'+esc(s.equipment)+'</div>':'')+(s.drillId?'<details><summary>Drill instructions</summary>'+drillInstructions(drills.find(d=>d.id===s.drillId)||s)+'</details>':'')+'</div>').join('')+
 ((!filter||block.coaching.includes(filter))?'<div class="station"><strong>Coaching</strong>'+block.coaching.filter(id=>!filter||id===filter).map(id=>esc(name(id))).join(' · ')+'</div>':'');
}
function planPage(){
 if(!state.plan)return heading('Practice Plan','Build a practice after choosing attendance and drills.')+'<section class="panel"><p class="empty">No practice is built yet.</p><div class="actions"><button class="primary" data-view="drills">Continue building</button></div></section>';
 const p=state.plan,filter=$('#assignment-filter')?.value||'',sharedClock=clockState(sharedData?.clock),active=Boolean(sharedClock&&!sharedClock.done||state.clock&&!state.clock.done);
 return heading('Practice Plan',state.date+' · '+p.facility+' · '+timeLabel(clockMinutes(p.start))+'–'+timeLabel(clockMinutes(p.start)+p.durationMinutes))+
 '<section class="panel"><div class="stat-line"><strong>'+p.players.length+' hitters</strong><strong>'+p.blocks.length+' blocks</strong><strong>'+p.blockMinutes+' minutes per block</strong></div>'+
 (p.warnings.length?'<div class="notice"><strong>Review this plan</strong><ul>'+p.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>'+(p.replacements.length?'<p><strong>Live replaced by Front Toss:</strong> '+p.replacements.map(id=>esc(name(id))).join(', ')+'</p>':'')+'</div>':'<p class="ready">Every hitter has Machine, Front Toss and Live. All eligible pitchers/catchers have at least one Live role.</p>')+
 (p.requiresAcceptance&&!p.accepted?'<label class="check" style="margin-top:18px"><input id="accept-plan" type="checkbox">Continue with the listed pitching/catching shortfalls</label>':'')+
 '<div class="actions">'+startOverButton()+(active?'':'<button data-view="review">Review / Rebuild</button>')+(shared.configured?'':'<button class="primary" id="run-local" '+(p.requiresAcceptance&&!p.accepted?'disabled':'')+'>Run on this device</button>')+'</div>'+
 '<p class="status">'+(active?'':shared.configured?'Activate Practice to publish assignments.':'Running here does not publish assignments to players or other coaches.')+'</p></section>'+sharedPanel()+
 (p.unusedSelectedDrills?.length?'<p class="notice">Selected drills that did not fit this plan: '+p.unusedSelectedDrills.map(esc).join(' · ')+'</p>':'')+(state.clock?clockHTML():'')+
 '<section class="panel">'+setting('View assignments','<select id="assignment-filter">'+options([['','All stations'],...p.players.map(x=>[x.id,x.name]),...p.coaches.map(x=>[x.id,x.name+' (coach)'])],filter)+'</select>')+'</section>'+
 '<div id="blocks">'+blocksHTML(filter)+'</div>';
}
function blocksHTML(filter){return state.plan.blocks.map((b,i)=>'<article class="block" id="block-'+i+'"><header><strong>Block '+b.number+' · '+timeLabel(b.start)+'–'+timeLabel(b.end)+'</strong></header>'+stationsFor(b,filter)+'</article>').join('');}
function clockHTML(){
 const c=state.clock,block=state.plan.blocks[c.index];
 return '<section class="panel" id="clock"><h2>Local practice clock</h2><p class="clock-label" id="clock-label">'+(c.done?'Practice finished':'Block '+block.number+' · '+(c.phase==='rotate'?'Rotate':'Work'))+'</p><div class="large-time" id="clock-time"></div><div class="actions"><button id="pause" '+(c.done?'disabled':'')+'>'+(c.running?'Pause':'Resume')+'</button><button id="skip" '+(c.done||c.phase==='rotate'?'disabled':'')+'>Skip</button><button id="done" '+(c.done?'disabled':'')+'>Done</button></div><label class="check" style="margin-top:16px"><input id="sound" type="checkbox" '+(sound?'checked':'')+'>Voice announcements on this device</label><p class="status">This clock is local. Shared player/coach clocks are not connected yet.</p></section>';
}
function teamHistory(id){
 let original=[],completed=[];
 try{original=JSON.parse(localStorage.getItem(teamKey(id))||'{}').history||[];completed=JSON.parse(localStorage.getItem(KEY+':history:'+id)||'[]');}catch{}
 const unique=new Map([...original,...completed].map(h=>[h.practiceId||h.completedAt,h]));
 return [...unique.values()].sort((a,b)=>String(a.completedAt).localeCompare(String(b.completedAt)));
}
function recordSharedCompletion(value){
 const c=clockState(value?.clock);if(!c?.done||!sharedDirectory?.plan)return;
 const p=sharedDirectory.plan,practiceId=sharedDirectory.clockToken,ids=sharedDirectory.teamIds||state.teamIds;
 const record={practiceId,date:sharedDirectory.date,players:p.players.length,durationMinutes:p.durationMinutes,blockMinutes:p.blockMinutes,replacements:p.replacements.length,replacementIds:p.replacements,completedAt:new Date().toISOString(),teamIds:ids};
 for(const id of ids){const entries=teamHistory(id);if(!entries.some(h=>h.practiceId===practiceId)){entries.push(record);try{localStorage.setItem(KEY+':history:'+id,JSON.stringify(entries));}catch{error='This device could not save practice history.';}}}
}
function historyPage(){
 const selected=teams.find(t=>t.id===historyTeamId)||teams.find(t=>t.id===state.teamIds[0]),entries=teamHistory(selected.id);
 return heading('Practice History',esc(selected.name))+'<section class="panel">'+(entries.length?entries.slice().reverse().map(h=>'<div class="history"><strong>'+esc(h.date)+' · '+h.players+' hitters</strong><p class="status">'+h.durationMinutes+' minutes · '+h.blockMinutes+' minute blocks · '+h.replacements+' Live replacements</p></div>').join(''):'<p class="empty">No completed practices for this team on this device.</p>')+'</section>';
}
function render(){
 const preview=document.querySelector('.preview');preview.hidden=true;
 const picker=view==='drills'&&drillPickerOpen;document.querySelector('main>header').hidden=picker;document.querySelector('.preview').hidden=true;document.querySelector('main>footer').hidden=picker;
 $('#team-name').textContent='Practice With Purpose';$('#team-name').hidden=false;
 $('#app').innerHTML=nav()+(error?'<p class="notice error" role="alert">'+esc(error)+'</p>':'')+({home,setup,attendance,drills:drillPage,review,plan:planPage,history:historyPage}[view]());
 bind();if(view==='drills')calculateDrillCount();if(state.clock&&view==='plan')tick();
}
function bind(){
 document.querySelectorAll('[data-practice-type]').forEach(el=>el.onclick=()=>{if(!dirty('setup')){render();return;}state.practiceType=el.dataset.practiceType;error='';save();render();});
 document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>setView(el.dataset.view));
 document.querySelectorAll('[data-next]').forEach(el=>el.onclick=()=>nextStep(el.dataset.next));
 document.querySelectorAll('[data-team-check]').forEach(el=>el.onchange=()=>{homeTeamIds=el.checked?[...new Set([...homeTeamIds,el.dataset.teamCheck])]:homeTeamIds.filter(id=>id!==el.dataset.teamCheck);render();});
 if($('#build-selected-teams'))$('#build-selected-teams').onclick=chooseSelectedTeams;
 document.querySelectorAll('[data-resume-team]').forEach(el=>el.onclick=()=>resumeTeam(el.dataset.resumeTeam));
 document.querySelectorAll('[data-history-team]').forEach(el=>el.onclick=()=>{historyTeamId=el.dataset.historyTeam;setView('history');});
 for(const id of ['date','start','facility','durationMinutes','blockMinutes','allowReplacements']){
  const el=$('#'+id);if(el&&['date','start','durationMinutes'].includes(id))el.oninput=()=>{if(!dirty('setup')){render();return;}state[id]=id==='durationMinutes'?Number(el.value):el.value;save();const end=$('#practice-end');if(end)end.textContent=Number.isFinite(clockMinutes(state.start)+Number(state.durationMinutes))?timeLabel(clockMinutes(state.start)+Number(state.durationMinutes)):'Choose a valid time';};if(el)el.onchange=()=>{if(!dirty(id==='allowReplacements'?'drills':'setup')){render();return;}state[id]=el.type==='checkbox'?el.checked:['durationMinutes','blockMinutes'].includes(id)?Number(el.value):el.value;save();render();};
 }
 document.querySelectorAll('[data-include]').forEach(el=>el.onchange=()=>{if(!dirty('attendance')){render();return;}const key=el.hasAttribute('data-coach')?'coachIds':'included';state[key]=el.checked?[...new Set([...state[key],el.dataset.include])]:state[key].filter(id=>id!==el.dataset.include);save();render();});
 document.querySelectorAll('[data-adjust]').forEach(el=>el.onclick=()=>adjust(el.dataset.adjust));
 bindDrillCards();
 if($('#drill-search'))$('#drill-search').oninput=e=>{drillSearch=e.target.value;refreshDrills();};
 document.querySelectorAll('[data-category]').forEach(el=>el.onclick=()=>{drillCategory=el.dataset.category;refreshDrills();});
 for(const [id,kind] of [['machine-focus','machine'],['front-focus','front']]){const el=$('#'+id);if(el)el.onchange=()=>{const value=el.value;if(!dirty()){render();return;}state.selectedDrills=state.selectedDrills.filter(x=>!drills.some(d=>d.id===x&&d.kind===kind));if(value)state.selectedDrills.push(value);save();render();};}
 const click=(id,fn)=>{if($('#'+id))$('#'+id).onclick=fn;};
 click('open-drill-picker',()=>{drillPickerOpen=true;render();window.scrollTo(0,0);});
 click('close-drill-picker',()=>{drillPickerOpen=false;render();window.scrollTo(0,0);});
 click('new-practice',newPractice);click('start-over',startOverDraft);
 click('include-all',()=>{if(dirty('attendance')){state.included=allPlayers().map(p=>p.id);save();render();}});
 click('clear-players',()=>{if(dirty('attendance')){state.included=[];save();render();}});
 click('all-coaches',()=>{if(dirty('attendance')){state.coachIds=coaches.map(c=>c.id);save();render();}});
 click('clear-coaches',()=>{if(dirty('attendance')){state.coachIds=[];save();render();}});
 click('all-drills',()=>{const limit=stationLimit();if(limit===null||pickerLocked())return;if(dirty()){const chosen=extraDrills().filter(d=>state.selectedDrills.includes(d.id)).map(d=>d.id);const remaining=extraDrills().filter(d=>!chosen.includes(d.id)).slice(0,Math.max(0,limit-chosen.length)).map(d=>d.id);state.selectedDrills=[...state.selectedDrills,...remaining];save();render();}});
 click('clear-drills',()=>{if(dirty()){state.selectedDrills=[];save();render();}});
 click('save-draft',()=>{if(!flushSetup()){render();return;}save();error='Draft saved on this device.';render();});
 click('use-replacements',useReplacements);click('cancel-replacements',()=>{replacementOffer=null;render();});click('build',build);click('rebuild',build);click('add-guest',guest);
 if($('#accept-plan'))$('#accept-plan').onchange=e=>{state.plan.accepted=e.target.checked;save();render();};
 if($('#assignment-filter'))$('#assignment-filter').onchange=e=>{$('#blocks').innerHTML=blocksHTML(e.target.value);};
 click('coach-login',loginDialog);click('coach-logout',()=>sharedAction(()=>shared.signOut()));click('activate-shared',activateShared);
 document.querySelectorAll('[data-shared-control]').forEach(el=>el.onclick=()=>sharedAction(()=>shared.control(sharedDirectory.clockToken,el.dataset.sharedControl)));document.querySelectorAll('[data-fix-checkin]').forEach(el=>el.onclick=()=>sharedAction(()=>shared.correctCheckin(el.dataset.fixCheckin)));document.querySelectorAll('[data-guest-decline]').forEach(el=>el.onclick=()=>sharedAction(()=>shared.setGuestStatus(el.dataset.guestDecline,'declined')));document.querySelectorAll('[data-guest-approve]').forEach(el=>el.onclick=()=>{const record=checkins.find(x=>x.id===el.dataset.guestApprove);if(record)rebuildForApprovedGuest(record)});
 click('run-local',startClock);click('pause',pauseClock);click('skip',skipClock);click('done',finish);
 if($('#sound'))$('#sound').onchange=e=>{sound=e.target.checked;if(sound)speak('Voice announcements on.');};
}
function adjust(id){
 const p=allPlayers().find(p=>p.id===id),a=state.adjustments[id]||{};
 $('#dialog').innerHTML='<form id="adjust-form"><h2>'+esc(p.name)+'</h2><div class="grid">'+setting('Arrival','<input name="arrival" type="time" value="'+(a.arrival||state.start)+'">')+setting('Departure','<input name="departure" type="time" value="'+(a.departure||toTime(clockMinutes(state.start)+Number(state.durationMinutes)))+'">')+'</div><p class="muted">Late arrivals start with group Warm Up before stations. Adjust “no warm-up” only waives pitching warm-up.</p>'+
 (p.pitcher?'<label class="check"><input name="noPitchWarmup" type="checkbox" '+(a.noPitchWarmup?'checked':'')+'>No pitching warm-up needed</label><label class="check"><input name="notPitching" type="checkbox" '+(a.canPitch===false?'checked':'')+'>Not pitching</label>':'')+
 (p.catcher?'<label class="check"><input name="notCatching" type="checkbox" '+(a.canCatch===false?'checked':'')+'>Not catching</label>':'')+
 '<p id="adjust-error" class="error"></p><div class="actions"><button type="button" id="cancel">Cancel</button><button class="primary">Save adjustment</button></div></form>';
 $('#dialog').showModal();$('#cancel').onclick=()=>$('#dialog').close();
 $('#adjust-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),arrival=f.get('arrival'),departure=f.get('departure');if(clockMinutes(departure)<=clockMinutes(arrival)){$('#adjust-error').textContent='Departure must be after arrival.';return;}if(!dirty('attendance')){$('#dialog').close();render();return;}state.adjustments[id]={arrival,departure,noPitchWarmup:f.has('noPitchWarmup'),canPitch:!f.has('notPitching'),canCatch:!f.has('notCatching')};save();$('#dialog').close();render();};
}
function toTime(min){return String(Math.floor(min/60)%24).padStart(2,'0')+':'+String(min%60).padStart(2,'0');}
function guest(){
 $('#dialog').innerHTML='<form id="guest-form"><h2>Add guest player</h2>'+setting('Name','<input name="name" required maxlength="80">')+'<div class="actions"><label class="check"><input name="pitcher" type="checkbox">Pitcher</label><label class="check"><input name="catcher" type="checkbox">Catcher</label></div><p class="muted">Guest players are saved in this device’s draft. Permanent roster management will use coach permissions when sign-in is connected.</p><div class="actions"><button type="button" id="cancel">Cancel</button><button class="primary">Add guest</button></div></form>';
 $('#dialog').showModal();$('#cancel').onclick=()=>$('#dialog').close();$('#guest-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n=String(f.get('name')).trim();if(!n)return;if(!dirty('attendance')){$('#dialog').close();render();return;}const id='rp-guest-'+crypto.randomUUID();state.guests.push({id,name:n,pitcher:f.has('pitcher'),catcher:f.has('catcher'),guest:true});state.included.push(id);save();$('#dialog').close();render();};
}
function replacementOfferHTML(){return replacementOffer?'<section class="panel replacement-choice"><h2>Live needs an adjustment</h2><p>This plan gives '+replacementOffer.replacements.length+' hitters a second Front Toss session instead of Live.</p><div class="actions"><button class="primary" id="use-replacements">Use Front Toss &amp; Build</button><button id="cancel-replacements">Keep Editing</button></div></section>':'';}
function useReplacements(){if(!replacementOffer)return;state.plan={...replacementOffer,practiceType:state.practiceType};state.allowReplacements=true;state.clock=null;replacementOffer=null;save();setView('plan');}
function rebuildForApprovedGuest(record){const cstate=clockState(sharedData?.clock);if(!cstate||cstate.done){sharedMessage='There is no active practice to update.';render();return;}const fromIndex=cstate.index+1;if(fromIndex>=state.plan.blocks.length){sharedMessage=record.name+' arrived after the final block started.';render();return;}const id='late-'+record.id,guest={id,name:record.name,pitcher:false,catcher:false,guest:true},oldGuests=[...state.guests],oldIncluded=[...state.included],oldAdjustments={...state.adjustments};if(!state.guests.some(g=>g.id===id))state.guests=[...state.guests,guest];if(!state.included.includes(id))state.included=[...state.included,id];state.adjustments={...state.adjustments,[id]:{arrival:toTime(clockMinutes(state.start)+fromIndex*state.blockMinutes),departure:toTime(clockMinutes(state.start)+state.durationMinutes),noPitchWarmup:true,canPitch:false,canCatch:false}};const input=practiceInput();state.guests=oldGuests;state.included=oldIncluded;state.adjustments=oldAdjustments;busy=true;sharedMessage='Rebuilding future blocks for '+record.name+'…';render();try{const w=new Worker('./worker.mjs?v=rpbuild16',{type:'module'});w.onmessage=async e=>{busy=false;if(e.data.error||e.data.replacementOffer){sharedMessage=e.data.error||'The future blocks need a manual adjustment before this player can be added.';render();w.terminate();return;}try{const rebuilt={...e.data.plan,practiceType:state.practiceType},preserved=state.plan.blocks.slice(0,fromIndex);rebuilt.blocks=[...preserved,...rebuilt.blocks.slice(fromIndex)];const validation=validatePractice(rebuilt);if(validation.length)throw Error('Late-player rebuild is not safe: '+validation.join('; '));await shared.approveGuestAndReplaceFuturePlan(record.id,sharedDirectory.clockToken,rebuilt,fromIndex);state.guests=[...oldGuests,guest];state.included=[...oldIncluded,id];state.adjustments={...oldAdjustments,[id]:{arrival:toTime(clockMinutes(state.start)+fromIndex*state.blockMinutes),departure:toTime(clockMinutes(state.start)+state.durationMinutes),noPitchWarmup:true,canPitch:false,canCatch:false}};state.plan=rebuilt;save();sharedMessage=record.name+' is approved and added beginning with Block '+(fromIndex+1)+'. The active block was not changed.';}catch(err){sharedMessage=err.message;}render();w.terminate();};w.onerror=()=>{busy=false;sharedMessage='The future-block rebuild could not finish. Nothing was changed.';render();};w.postMessage({mode:'build',input});}catch(e){busy=false;sharedMessage=e.message;render();}}

function build(){
 if(sharedData&&!clockState(sharedData.clock)?.done){error='Finish the active shared practice before rebuilding.';render();return;}
 if(busy)return;if(state.clock?.running){error='Finish or pause the clock before rebuilding.';render();return;}
 const problems=issues();if(problems.length){error=problems.join(' ');view='review';render();return;}
 replacementOffer=null;state.allowReplacements=false;recommendationWorker?.terminate();busy=true;error='';view='review';render();
 const input=practiceInput();
 try{worker?.terminate();worker=new Worker('./worker.mjs?v=rpbuild16',{type:'module'});worker.onmessage=e=>{busy=false;if(e.data.replacementOffer){replacementOffer=e.data.replacementOffer;view='review';}else if(e.data.error){error=e.data.error;view='review';}else{state.plan={...e.data.plan,practiceType:state.practiceType};state.clock=null;save();view='plan';}render();window.scrollTo(0,0);worker.terminate();};worker.onerror=()=>{busy=false;error='The practice builder could not load. Refresh this page and retry; your draft remains saved.';render();};worker.postMessage({mode:'build',input});}
 catch(e){busy=false;error=e.message;render();}
}
function speak(text){if(sound&&'speechSynthesis' in window&&document.visibilityState==='visible'){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));}}
function startClock(){
 if(sharedData&&!clockState(sharedData.clock)?.done){error='Use Start Shared Practice for the active published practice.';render();return;}
 if(!state.plan||state.plan.requiresAcceptance&&!state.plan.accepted)return;
 if(!state.clock||state.clock.done){state.clock={index:0,phase:'work',running:true,done:false,end:Date.now()+(state.plan.blockMinutes-1)*60000,remaining:(state.plan.blockMinutes-1)*60000};speak('Practice is starting. Begin Warm Up.');}
 else if(!state.clock.running){state.clock.running=true;state.clock.end=Date.now()+state.clock.remaining;}
 save();render();$('#clock')?.scrollIntoView({behavior:'smooth',block:'center'});if(!timer)timer=setInterval(tick,500);
}
function pauseClock(){const c=state.clock;if(!c||c.done)return;if(c.running){c.remaining=Math.max(0,c.end-Date.now());c.running=false;}else{c.end=Date.now()+c.remaining;c.running=true;}save();render();}
function skipClock(){const c=state.clock;if(!c||c.done||c.phase==='rotate')return;c.phase='rotate';c.remaining=60000;c.end=Date.now()+60000;c.running=true;save();speak('Rotate to your next station.');render();}
function finish(){if(!state.clock||state.clock.done)return;state.clock.done=true;state.clock.running=false;state.clock.remaining=0;state.history.push({date:state.date,players:state.plan.players.length,durationMinutes:state.plan.durationMinutes,blockMinutes:state.plan.blockMinutes,replacements:state.plan.replacements.length,replacementIds:state.plan.replacements,completedAt:new Date().toISOString()});save();speak('Practice is finished.');render();}
function tick(){
 const c=state.clock;if(!c)return;if(c.running&&!c.done){
  while(Date.now()>=c.end&&!c.done){
   if(c.phase==='work'){const last=c.index===state.plan.blocks.length-1;c.phase=last?'wrap':'rotate';c.end+=60000+(last?state.plan.durationMinutes%state.plan.blockMinutes*60000:0);speak(last?'Wrap up your station. Practice is ending.':'Rotate to your next station.');}
   else if(c.index+1<state.plan.blocks.length){c.index++;c.phase='work';c.end+=(state.plan.blockMinutes-1)*60000;speak('Block '+(c.index+1)+'. Begin.');}
   else{finish();return;}save();
  }
  c.remaining=Math.max(0,c.end-Date.now());const key=c.index+'-'+c.phase;
  if(c.phase==='work'&&c.remaining<=120000&&lastAnnouncement!==key){lastAnnouncement=key;speak('Two minutes remaining.');}
 }
 if($('#clock-time')){const sec=Math.ceil((c.remaining||0)/1000);$('#clock-time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');$('#clock-label').textContent=c.done?'Practice finished':'Block '+(c.index+1)+' · '+({rotate:'Rotate',wrap:'Wrap up',work:'Work'}[c.phase]);$('#skip').disabled=c.done||c.phase!=='work';$('#pause').textContent=c.running?'Pause':'Resume';}
}
window.addEventListener('pagehide',save);
if(state.clock&&!state.clock.done)timer=setInterval(tick,500);
const portalId=new URLSearchParams(location.hash.slice(1)).get('portal');
if(portalId)openPortal(portalId);else{render();initShared();}
function portalLinkGroups(links){
 const people=Object.values(links);
 const byLastName=(a,b)=>a.name.trim().split(/\s+/).at(-1).localeCompare(b.name.trim().split(/\s+/).at(-1))||a.name.localeCompare(b.name);
 return [['Coach Portals',people.filter(p=>p.role==='coach')],['Player Portals',people.filter(p=>p.role!=='coach')]].map(([title,group])=>group.length?'<h3>'+title+'</h3><div class="portal-links">'+group.sort(byLastName).map(p=>'<div><span>'+esc(p.name)+'<small>'+esc(p.role)+'</small></span><a class="portal-open" target="_blank" rel="noopener noreferrer" href="'+esc(new URL('#portal='+p.token,new URL(location.pathname,location.origin)).href)+'">Open Portal</a></div>').join('')+'</div>':'').join('');
}
function sharedClockDisplay(c){
 const seconds=Math.ceil(c.remaining/1000);
 const time=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 const phase=!c.started?'Ready to start':({work:'Work',rotate:'Rotate',wrap:'Wrap up'}[c.phase]);
 return '<div class="practice-clock-stats"><div class="practice-clock-box"><span>Block</span><strong>'+(c.index+1)+' of '+c.blocks+'</strong></div><div class="practice-clock-box"><span>Time Left</span><strong id="shared-time">'+time+'</strong></div></div><p class="practice-clock-phase">'+phase+'</p>';
}
function checkinPanel(){if(!sharedDirectory?.clockToken)return '';const facility=String(sharedDirectory.plan?.facility||state.facility||'').toLowerCase().includes('shed')?'shed':'barn',checkinLink=new URL('?checkin=1&facility='+facility,location.href).href;const active=checkins.filter(x=>x.status==='checked-in'),pending=checkins.filter(x=>x.kind==='guest-request'&&x.status==='pending');return '<section class="panel"><h2>Check-In</h2>'+(checkinLink?'<p><a class="button" href="'+esc(checkinLink)+'" target="_blank" rel="noopener">Open Player Check-In</a></p><p class="muted">This is the permanent '+(facility==='barn'?'Barn':'facility')+' check-in link. The same QR code can be reused every practice.</p>':'')+'<p><strong>'+active.length+'</strong> checked in'+(pending.length?' · <strong>'+pending.length+'</strong> waiting for approval':'')+'</p>'+(active.length?'<div class="portal-links">'+active.map(x=>'<div><span>'+esc(x.name)+'</span><button data-fix-checkin="'+esc(x.id)+'">Wrong Player</button></div>').join('')+'</div>':'<p class="muted">No players checked in yet.</p>')+(pending.length?'<h3>Waiting to Join</h3><div class="portal-links">'+pending.map(x=>'<div><span>'+esc(x.name)+'<small>Joins next block if approved</small></span><span><button data-guest-decline="'+esc(x.id)+'">Decline</button> <button class="primary" data-guest-approve="'+esc(x.id)+'">Approve</button></span></div>').join('')+'</div>':'')+'</section>'}
function sharedPanel(){
 if(!shared.configured)return '<section class="panel"><h2>Shared Practice</h2><p>Player and coach portals need the separate RebelsPrep backend connected.</p><button disabled>Activate Practice</button></section>';
 const c=clockState(sharedData?.clock),active=c&&!c.done,links=sharedDirectory?.portals||{};
 return '<section class="panel"><h2>Shared Practice</h2>'+(sharedMessage?'<p class="notice" role="status">'+esc(sharedMessage)+'</p>':'')+(!shared.allowed(sharedUser)?'<p>Sign in with your coach email to activate a practice.</p><button id="coach-login">Coach Sign In</button>':'<p>Signed in: '+esc(sharedUser.email)+'</p><div class="actions"><button id="coach-logout">Sign Out</button>'+(state.plan&&!active?'<button class="primary" id="activate-shared" '+(sharedBusy||state.clock?.running||state.plan.requiresAcceptance&&!state.plan.accepted?'disabled':'')+'>Activate Practice</button>':'')+'</div>'+(active?'<div class="shared-clock" data-shared-key="'+[c.index,c.phase,c.running,c.done,c.started].join('-')+'">'+sharedClockDisplay(c)+'<div class="actions">'+[['start',c.started?'Resume':'Start Shared Practice'],['pause','Pause'],['skip','Skip'],['done','Done']].map(([a,label])=>'<button data-shared-control="'+a+'" '+(sharedBusy||(a==='start'&&c.running)||(a==='pause'&&!c.running)||(a==='skip'&&(!c.started||c.phase!=='work'))?'disabled':'')+'>'+label+'</button>').join('')+'</div></div>':'')+portalLinkGroups(links))+'</section>'+checkinPanel();
}
async function sharedAction(fn){if(sharedBusy)return;sharedBusy=true;sharedMessage='';render();try{await fn();}catch(e){sharedMessage=e.message;}finally{sharedBusy=false;render();}}
function loginDialog(){
 $('#dialog').innerHTML='<form id="login-form"><h2>Coach Sign In</h2>'+setting('Coach email','<input type="email" name="email" required autocomplete="email">')+'<p>A sign-in link will be sent to your email.</p><p id="login-error" role="status"></p><div class="actions"><button type="button" id="cancel-login">Cancel</button><button class="primary">Send Sign-In Link</button></div></form>';
 $('#dialog').showModal();$('#cancel-login').onclick=()=>$('#dialog').close();$('#login-form').onsubmit=async e=>{e.preventDefault();const submit=e.target.querySelector('button.primary');submit.disabled=true;try{await shared.sendLogin(new FormData(e.target).get('email').trim(),location.href);$('#login-error').textContent='Check your email and open the sign-in link.';}catch(err){$('#login-error').textContent=err.message;}finally{submit.disabled=false;}};
}
async function connectDirectory(){
 sharedStop?.();const version=++directoryVersion,id=state.teamId;
 const directory=await shared.registry(id);if(version!==directoryVersion)return;
 sharedDirectory=directory;sharedData=null;
 if(directory.clockToken){
  checkinStop?.();checkinStop=await shared.checkinFeed(directory.clockToken,items=>{checkins=items;render();},e=>{sharedMessage=e.message;render();});
  sharedStop=await shared.watchClock(directory.clockToken,(value,meta)=>{
   if(version!==directoryVersion)return;
   sharedData=value;sharedMessage=meta.fromCache?'Reconnecting. Shared controls may not reflect the latest practice.':'';
   if(value&&!clockState(value.clock)?.done&&directory.plan){
    state.plan=directory.plan;state.practiceType=directory.plan.practiceType||state.practiceType;state.date=directory.date;state.teamIds=directory.teamIds||state.teamIds;state.teamId=directory.practiceKey||state.teamId;state.started=true;save();
   }
   if(value&&!meta.fromCache)recordSharedCompletion(value);
   render();
  },e=>{if(version===directoryVersion){sharedMessage=e.message;render();}});
 }render();
}
async function activateShared(){if(state.practiceType!=='Hitting'){setView('setup');error='Choose a practice type. Select Hitting to continue.';render();return;}await sharedAction(async()=>{const people=[...allPlayers().map(p=>({...p,role:'player'})),...coaches.map(p=>({...p,role:'coach'}))];sharedDirectory=await shared.activate(state.plan,state.teamId,state.date,people,location.href,state.teamIds);await connectDirectory();});}
async function initShared(){if(!shared.configured)return;try{if(await shared.isLoginLink(location.href)){const email=localStorage.getItem('RebelsPrep:login-email')||window.prompt('Enter the coach email that received this sign-in link.');if(email){await shared.completeLogin(email.trim(),location.href);history.replaceState(null,'',location.pathname);}}await shared.observeAuth(async user=>{sharedUser=user;sharedDirectory=null;sharedData=null;sharedStop?.();if(shared.allowed(user)){try{await connectDirectory();}catch(e){sharedMessage=e.message;}}else if(user)sharedMessage='This email is not enabled for building practices.';render();});setInterval(()=>{const c=clockState(sharedData?.clock),el=$('#shared-time');if(el&&c){if(c.done||document.querySelector('[data-shared-key]')?.getAttribute('data-shared-key')!==[c.index,c.phase,c.running,c.done,c.started].join('-')){render();return;}const secs=Math.ceil(c.remaining/1000);el.textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');}},500);}catch(e){sharedMessage=e.message;render();}}
