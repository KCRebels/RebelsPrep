import {players as roster,coaches,rosterReview} from './roster.mjs?v=rpbuild9';
import {drills} from './drills.mjs?v=rpbuild9';
import {timeLabel,clockMinutes,validatePractice} from './scheduler.mjs?v=rpbuild9';
const KEY='RebelsPrep:coach-pilot:1';
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const blank=()=>({date:today(),start:'17:30',durationMinutes:180,blockMinutes:12,facility:'The Barn',included:[],coachIds:[],selectedDrills:[],adjustments:{},guests:[],allowReplacements:false,plan:null,history:[],clock:null});
let state,view='setup',busy=false,error='',worker=null,timer=null,sound=false,lastAnnouncement='',drillSearch='',drillCategory='All Drills',recommendation=null,recommendationWorker=null;
try{state={...blank(),...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{state=blank();error='Saved preview could not be read. Your original saved value has not been overwritten.';}
if(state.plan&&validatePractice(state.plan).length){state.plan=null;state.clock=null;error='The saved practice needs to be rebuilt with the updated station checks. Attendance and settings were kept.';}
const allPlayers=()=>[...roster,...state.guests];
const name=id=>allPlayers().find(p=>p.id===id)?.name||coaches.find(c=>c.id===id)?.name||id;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{error='This device could not save the draft. Keep this page open or free storage before closing.';}}
function dirty(){if(state.clock?.running){error='Pause or finish the local clock before changing this practice.';return false;}state.plan=null;state.clock=null;save();return true;}
function setView(v){view=v;error='';render();window.scrollTo(0,0);}
function nav(){return '<nav aria-label="Practice planner">'+['setup','attendance','drills','plan','history'].map(v=>'<button data-view="'+v+'" '+(v===view?'aria-current="page"':'')+'>'+({setup:'Setup',attendance:'Attendance',drills:'Drills',plan:'Plan',history:'History'}[v])+'</button>').join('')+'</nav>';}
function options(vals,current){return vals.map(([v,label,disabled])=>'<option value="'+v+'" '+(String(v)===String(current)?'selected':'')+' '+(disabled?'disabled':'')+'>'+label+'</option>').join('');}
function heading(title,sub){return '<h1>'+title+'</h1><p class="muted">'+sub+'</p>';}
function setting(label,html){return '<label>'+label+html+'</label>';}
function setup(){
 const end=timeLabel(clockMinutes(state.start)+Number(state.durationMinutes));
 return heading('Build Practice','KC Rebels Nationals')+'<section class="panel"><h2>Practice settings</h2><div class="grid settings-grid">'+
 setting('Date','<input id="date" type="date" value="'+state.date+'">')+
 setting('Facility','<select id="facility">'+options([['The Barn','The Barn'],['The Shed','The Shed — setup later',true],['Lone Elm','Lone Elm — setup later',true],['The Fields','The Fields — setup later',true]],state.facility)+'</select>')+
 setting('Practice type','<select aria-label="Practice type"><option>Hitting</option><option disabled>Fielding — coming later</option><option disabled>Full Practice — coming later</option></select>')+
 setting('Start time','<input id="start" type="time" value="'+state.start+'">')+
 setting('Duration (minutes)','<input id="durationMinutes" type="number" min="60" max="360" step="1" value="'+state.durationMinutes+'">')+
 setting('Block length','<select id="blockMinutes">'+options([[10,'10 minutes'],[12,'12 minutes'],[15,'15 minutes']],state.blockMinutes)+'</select>')+
 '</div><p class="muted">Ends at <strong>'+end+'</strong>. Each block includes one minute to rotate. Extra time is added only when you change the duration.</p></section>';

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
 '<div class="actions"><button data-view="setup">Setup</button><button class="primary" data-view="drills">Choose drills</button></div>';
}
function practiceInput(){return {players:allPlayers().filter(p=>state.included.includes(p.id)).map(p=>({...p,...state.adjustments[p.id]})),coaches:coaches.filter(c=>state.coachIds.includes(c.id)),drills:drills.filter(d=>state.selectedDrills.includes(d.id)),facility:state.facility,start:state.start,durationMinutes:state.durationMinutes,blockMinutes:state.blockMinutes,allowReplacements:state.allowReplacements,previousReplacements:state.history.at(-1)?.replacementIds||[]};}
function recommendationKey(){return JSON.stringify({...practiceInput(),drills:[]});}
function drillGuidance(){
 const selected=availableDrills().filter(d=>state.selectedDrills.includes(d.id)).length;
 if(state.included.length<3||!state.coachIds.length)return '<strong>Choose attendance first</strong><p>Include at least three hitters and one coach to calculate a drill count.</p>';
 const r=recommendation;
 if(!r||r.key!==recommendationKey()||r.pending)return '<strong>Calculating suggested drill count…</strong><p>'+selected+' selected</p>';
 if(r.error)return '<strong>Drill count unavailable</strong><p>'+esc(r.error)+'</p><p>'+selected+' selected. You can adjust your choices and continue building.</p>';
 return '<strong>Suggested: '+r.count+' different additional '+(r.count===1?'drill':'drills')+' · '+selected+' selected</strong><p>Based on a checked example for your attendance and settings. Choose drills with available equipment; your chosen combination still needs to pass Build Practice.</p><details><summary>Example drills for this count</summary><p>'+r.names.map(esc).join(' · ')+'</p></details>'+(r.warnings.length?'<p class="status">The example includes tradeoffs: '+esc(r.warnings.join(' '))+'</p>':'');
}
function updateDrillGuidance(){
 const el=$('#drill-guidance');if(el)el.innerHTML=drillGuidance();
}
function calculateDrillCount(){
 if(view!=='drills'||busy)return;
 const key=recommendationKey();
 if(recommendation?.key===key){updateDrillGuidance();return;}
 recommendationWorker?.terminate();
 if(state.included.length<3||!state.coachIds.length){recommendation=null;updateDrillGuidance();return;}
 recommendation={key,pending:true};updateDrillGuidance();
 try{
  const w=new Worker('./worker.mjs?v=rpbuild9',{type:'module'});recommendationWorker=w;
  w.onmessage=e=>{
   if(recommendation?.key===key){
    recommendation=e.data.error?{key,error:e.data.error}:{key,...e.data.recommendation};
    updateDrillGuidance();
   }
   w.terminate();
  };
  w.onerror=()=>{if(recommendation?.key===key){recommendation={key,error:'The count calculator could not load. Refresh and retry.'};updateDrillGuidance();}w.terminate();};
  w.postMessage({mode:'recommend',input:{...practiceInput(),drills:availableDrills()}});
 }catch(e){recommendation={key,error:e.message};updateDrillGuidance();}
}
function availableDrills(){return drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work'&&(state.included.length<=20||!d.tee));}
function drillResults(){
 const available=availableDrills(),query=drillSearch.trim().toLowerCase();
 const matches=available.filter(d=>(drillCategory==='All Drills'||d.category===drillCategory)&&(!query||[d.name,d.category,d.primaryPurpose,d.hittingMethod,d.equipment].join(' ').toLowerCase().includes(query)));
 return '<p class="drill-count" role="status">'+matches.length+' '+(matches.length===1?'drill':'drills')+' <span>· '+available.filter(d=>state.selectedDrills.includes(d.id)).length+' selected</span></p><div class="drills">'+matches.map(d=>{
 const selected=state.selectedDrills.includes(d.id);
 return '<article class="drill'+(selected?' selected':'')+'"><p class="drill-category">'+esc(d.category)+'</p><h3>'+esc(d.name)+'</h3><p class="drill-purpose">'+esc(d.primaryPurpose)+'</p><div class="drill-tags"><span>'+esc(d.hittingMethod)+'</span><span>'+esc(d.equipment)+'</span></div><div class="drill-controls"><button data-select-drill="'+d.id+'" aria-pressed="'+selected+'" aria-label="'+(selected?'Deselect ':'Select ')+esc(d.name)+'">'+'Select'+'</button><details><summary>Details</summary><div class="drill-details"><p>'+esc(d.howItWorks)+'</p><p><strong>Coach cues:</strong> '+esc(d.coachingCues)+'</p></div></details></div></article>';
 }).join('')+'</div>'+(matches.length?'':'<p class="empty">No drills match. Try another search or category.</p>');
}
function bindDrillCards(){
 document.querySelectorAll('[data-select-drill]').forEach(el=>el.onclick=()=>{
  if(!dirty()){render();return;}
  const id=el.dataset.selectDrill;
  state.selectedDrills=state.selectedDrills.includes(id)?state.selectedDrills.filter(x=>x!==id):[...state.selectedDrills,id];
  save();refreshDrills();
 });
}
function refreshDrills(){
 $('#drill-results').innerHTML=drillResults();bindDrillCards();updateDrillGuidance();
 document.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.category===drillCategory)));
}
function drillPage(){
 const noTees=state.included.length>20;
 const available=availableDrills();
 const categories=['All Drills',...new Set(available.map(d=>d.category))];
 if(!categories.includes(drillCategory))drillCategory='All Drills';
 return heading('Choose Drills','Select drills whose equipment is available. Front Toss and Machine are mandatory.')+
 '<section class="panel"><h2>Required work</h2><p>Warm Up · '+(!noTees?'Tee Work · ':'')+'Machine · Front Toss</p><label class="check"><input id="allowReplacements" type="checkbox" '+(state.allowReplacements?'checked':'')+'>Allow a second Front Toss session to replace Live when needed</label><p class="muted">Live is the priority. The plan will identify replacements and any pitchers or catchers who could not get a Live role, so you can review the tradeoff.</p>'+
 (noTees?'<p class="notice">More than 20 hitters: tee drills are unavailable for this hitting practice.</p>':'')+'</section>'+
 '<section class="drill-library"><h2>Drill rotation</h2><div id="drill-guidance" class="drill-guidance" aria-live="polite">'+drillGuidance()+'</div><div class="actions"><button id="all-drills">Select All</button><button id="clear-drills">Clear All</button></div><p class="muted">Front Toss and Machine may repeat. Other selected drills are used once per hitter, with one station for each drill in a block. Selecting a drill confirms you have its listed equipment; the small-ball and bunting machines are separate equipment from the tunnel machine.</p><input id="drill-search" type="search" aria-label="Search drills" placeholder="Search drills…" value="'+esc(drillSearch)+'"><div class="drill-categories" aria-label="Drill categories">'+categories.map(c=>'<button data-category="'+esc(c)+'" aria-pressed="'+(c===drillCategory)+'">'+esc(c)+'</button>').join('')+'</div><div id="drill-results">'+drillResults()+'</div></section>'+
 '<div class="sticky-actions actions"><button id="save-draft">Save draft</button><button class="primary" id="build" '+(busy?'disabled':'')+'>'+(busy?'Building…':'Build Practice')+'</button></div>';
}
function stationsFor(block,filter){
 return block.stations.filter(s=>!filter||[...s.players,s.pitcher,s.catcher,s.coach].includes(filter)).map(s=>'<div class="station"><strong>'+esc(s.drill)+' <span class="muted">· '+esc(s.resource)+'</span></strong>'+s.players.map(id=>esc(name(id))).join(' · ')+
 (s.pitcher?'<div class="role">Pitching: '+esc(name(s.pitcher))+'</div>':'')+
 (s.catcher?'<div class="role">Catching: '+esc(name(s.catcher))+'</div>':'')+
 (s.coach?'<div class="role">Coach: '+esc(name(s.coach))+'</div>':'')+
 (s.equipment?'<div class="muted">'+esc(s.equipment)+'</div>':'')+'</div>').join('')+
 ((!filter||block.coaching.includes(filter))?'<div class="station"><strong>Coaching</strong>'+block.coaching.filter(id=>!filter||id===filter).map(id=>esc(name(id))).join(' · ')+'</div>':'');
}
function planPage(){
 if(!state.plan)return heading('Practice Plan','Build a practice after choosing attendance and drills.')+'<section class="panel"><p class="empty">No practice is built yet.</p><div class="actions"><button class="primary" data-view="drills">Continue building</button></div></section>';
 const p=state.plan,filter=$('#assignment-filter')?.value||'';
 return heading('Practice Plan',state.date+' · '+p.facility+' · '+timeLabel(clockMinutes(p.start))+'–'+timeLabel(clockMinutes(p.start)+p.durationMinutes))+
 '<section class="panel"><div class="stat-line"><strong>'+p.players.length+' hitters</strong><strong>'+p.blocks.length+' blocks</strong><strong>'+p.blockMinutes+' minutes per block</strong></div>'+
 (p.warnings.length?'<div class="notice"><strong>Review this plan</strong><ul>'+p.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>'+(p.replacements.length?'<p><strong>Live replaced by Front Toss:</strong> '+p.replacements.map(id=>esc(name(id))).join(', ')+'</p>':'')+'</div>':'<p class="ready">Every hitter has Machine, Front Toss and Live. All eligible pitchers/catchers have at least one Live role.</p>')+
 (p.requiresAcceptance&&!p.accepted?'<label class="check" style="margin-top:18px"><input id="accept-plan" type="checkbox">Continue with the listed pitching/catching shortfalls</label>':'')+
 '<div class="actions"><button data-view="attendance">Adjust attendance</button><button data-view="drills">Change drills</button><button id="rebuild">Rebuild</button><button class="primary" id="run-local" '+(p.requiresAcceptance&&!p.accepted?'disabled':'')+'>Run on this device</button></div>'+
 '<p class="status">Running here does not publish assignments to players or other coaches.</p></section>'+
 (state.clock?clockHTML():'')+
 '<section class="panel">'+setting('View assignments','<select id="assignment-filter">'+options([['','All stations'],...p.players.map(x=>[x.id,x.name]),...p.coaches.map(x=>[x.id,x.name+' (coach)'])],filter)+'</select>')+'</section>'+
 '<div id="blocks">'+blocksHTML(filter)+'</div>';
}
function blocksHTML(filter){return state.plan.blocks.map((b,i)=>'<article class="block" id="block-'+i+'"><header><strong>Block '+b.number+' · '+timeLabel(b.start)+'–'+timeLabel(b.end)+'</strong></header>'+stationsFor(b,filter)+'</article>').join('');}
function clockHTML(){
 const c=state.clock,block=state.plan.blocks[c.index];
 return '<section class="panel" id="clock"><h2>Local practice clock</h2><p class="clock-label" id="clock-label">'+(c.done?'Practice finished':'Block '+block.number+' · '+(c.phase==='rotate'?'Rotate':'Work'))+'</p><div class="large-time" id="clock-time"></div><div class="actions"><button id="pause" '+(c.done?'disabled':'')+'>'+(c.running?'Pause':'Resume')+'</button><button id="skip" '+(c.done||c.phase==='rotate'?'disabled':'')+'>Skip</button><button id="done" '+(c.done?'disabled':'')+'>Done</button></div><label class="check" style="margin-top:16px"><input id="sound" type="checkbox" '+(sound?'checked':'')+'>Voice announcements on this device</label><p class="status">This clock is local. Shared player/coach clocks are not connected yet.</p></section>';
}
function historyPage(){return heading('Practice History','Completed practice previews saved on this device.')+'<section class="panel">'+(state.history.length?state.history.slice().reverse().map(h=>'<div class="history"><strong>'+esc(h.date)+' · '+h.players+' hitters</strong><p class="status">'+h.durationMinutes+' minutes · '+h.blockMinutes+' minute blocks · '+h.replacements+' Live replacements</p></div>').join(''):'<p class="empty">No completed practices.</p>')+'</section>';}
function render(){
 $('#app').innerHTML=nav()+(error?'<p class="notice error" role="alert">'+esc(error)+'</p>':'')+({setup,attendance,drills:drillPage,plan:planPage,history:historyPage}[view]());
 bind();if(view==='drills')calculateDrillCount();if(state.clock&&view==='plan')tick();
}
function bind(){
 document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>setView(el.dataset.view));
 for(const id of ['date','start','facility','durationMinutes','blockMinutes','allowReplacements']){
  const el=$('#'+id);if(el)el.onchange=()=>{if(!dirty()){render();return;}state[id]=el.type==='checkbox'?el.checked:['durationMinutes','blockMinutes'].includes(id)?Number(el.value):el.value;save();render();};
 }
 document.querySelectorAll('[data-include]').forEach(el=>el.onchange=()=>{if(!dirty()){render();return;}const key=el.hasAttribute('data-coach')?'coachIds':'included';state[key]=el.checked?[...new Set([...state[key],el.dataset.include])]:state[key].filter(id=>id!==el.dataset.include);save();render();});
 document.querySelectorAll('[data-adjust]').forEach(el=>el.onclick=()=>adjust(el.dataset.adjust));
 bindDrillCards();
 if($('#drill-search'))$('#drill-search').oninput=e=>{drillSearch=e.target.value;refreshDrills();};
 document.querySelectorAll('[data-category]').forEach(el=>el.onclick=()=>{drillCategory=el.dataset.category;refreshDrills();});
 const click=(id,fn)=>{if($('#'+id))$('#'+id).onclick=fn;};
 click('include-all',()=>{if(dirty()){state.included=allPlayers().map(p=>p.id);save();render();}});
 click('clear-players',()=>{if(dirty()){state.included=[];save();render();}});
 click('all-coaches',()=>{if(dirty()){state.coachIds=coaches.map(c=>c.id);save();render();}});
 click('clear-coaches',()=>{if(dirty()){state.coachIds=[];save();render();}});
 click('all-drills',()=>{if(dirty()){state.selectedDrills=availableDrills().map(d=>d.id);save();render();}});
 click('clear-drills',()=>{if(dirty()){state.selectedDrills=[];save();render();}});
 click('save-draft',()=>{save();error='Draft saved on this device.';render();});
 click('build',build);click('rebuild',build);click('add-guest',guest);
 if($('#accept-plan'))$('#accept-plan').onchange=e=>{state.plan.accepted=e.target.checked;save();$('#run-local').disabled=!e.target.checked;};
 if($('#assignment-filter'))$('#assignment-filter').onchange=e=>{$('#blocks').innerHTML=blocksHTML(e.target.value);};
 click('run-local',startClock);click('pause',pauseClock);click('skip',skipClock);click('done',finish);
 if($('#sound'))$('#sound').onchange=e=>{sound=e.target.checked;if(sound)speak('Voice announcements on.');};
}
function adjust(id){
 const p=allPlayers().find(p=>p.id===id),a=state.adjustments[id]||{};
 $('#dialog').innerHTML='<form id="adjust-form"><h2>'+esc(p.name)+'</h2><div class="grid">'+setting('Arrival','<input name="arrival" type="time" value="'+(a.arrival||state.start)+'">')+setting('Departure','<input name="departure" type="time" value="'+(a.departure||toTime(clockMinutes(state.start)+Number(state.durationMinutes)))+'">')+'</div><p class="muted">Late arrivals start with group Warm Up, then Tee Work when required. Adjust “no warm-up” only waives pitching warm-up.</p>'+
 (p.pitcher?'<label class="check"><input name="noPitchWarmup" type="checkbox" '+(a.noPitchWarmup?'checked':'')+'>No pitching warm-up needed</label><label class="check"><input name="notPitching" type="checkbox" '+(a.canPitch===false?'checked':'')+'>Not pitching</label>':'')+
 (p.catcher?'<label class="check"><input name="notCatching" type="checkbox" '+(a.canCatch===false?'checked':'')+'>Not catching</label>':'')+
 '<p id="adjust-error" class="error"></p><div class="actions"><button type="button" id="cancel">Cancel</button><button class="primary">Save adjustment</button></div></form>';
 $('#dialog').showModal();$('#cancel').onclick=()=>$('#dialog').close();
 $('#adjust-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),arrival=f.get('arrival'),departure=f.get('departure');if(clockMinutes(departure)<=clockMinutes(arrival)){$('#adjust-error').textContent='Departure must be after arrival.';return;}if(!dirty()){$('#dialog').close();render();return;}state.adjustments[id]={arrival,departure,noPitchWarmup:f.has('noPitchWarmup'),canPitch:!f.has('notPitching'),canCatch:!f.has('notCatching')};save();$('#dialog').close();render();};
}
function toTime(min){return String(Math.floor(min/60)%24).padStart(2,'0')+':'+String(min%60).padStart(2,'0');}
function guest(){
 $('#dialog').innerHTML='<form id="guest-form"><h2>Add guest player</h2>'+setting('Name','<input name="name" required maxlength="80">')+'<div class="actions"><label class="check"><input name="pitcher" type="checkbox">Pitcher</label><label class="check"><input name="catcher" type="checkbox">Catcher</label></div><p class="muted">Guest players are saved in this device’s draft. Permanent roster management will use coach permissions when sign-in is connected.</p><div class="actions"><button type="button" id="cancel">Cancel</button><button class="primary">Add guest</button></div></form>';
 $('#dialog').showModal();$('#cancel').onclick=()=>$('#dialog').close();$('#guest-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n=String(f.get('name')).trim();if(!n)return;if(!dirty()){$('#dialog').close();render();return;}const id='rp-guest-'+crypto.randomUUID();state.guests.push({id,name:n,pitcher:f.has('pitcher'),catcher:f.has('catcher'),guest:true});state.included.push(id);save();$('#dialog').close();render();};
}
function build(){
 if(busy)return;if(state.clock?.running){error='Finish or pause the clock before rebuilding.';render();return;}
 busy=true;error='';view='drills';render();
 const input=practiceInput();
 try{worker?.terminate();worker=new Worker('./worker.mjs?v=rpbuild9',{type:'module'});worker.onmessage=e=>{busy=false;if(e.data.error){error=e.data.error;view='drills';}else{state.plan=e.data.plan;state.clock=null;save();view='plan';}render();window.scrollTo(0,0);worker.terminate();};worker.onerror=()=>{busy=false;error='The practice builder could not load. Refresh this page and retry; your draft remains saved.';render();};worker.postMessage(input);}
 catch(e){busy=false;error=e.message;render();}
}
function speak(text){if(sound&&'speechSynthesis' in window&&document.visibilityState==='visible'){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));}}
function startClock(){
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
render();
