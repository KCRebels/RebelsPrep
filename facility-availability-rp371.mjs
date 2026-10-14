import * as shared from './shared-rp52.mjs?v=rp276';
import {teams} from './teams.mjs?v=recovery78';
import {minutes,practiceWindow,overlaps,facilityId} from './practice-capacity.mjs?v=rp133';

const state={key:'',sessions:[],loaded:false,loading:false,error:''};
const teamNames=new Map(teams.map(t=>[t.id,t.name]));
const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function formatMinutes(value){
 const n=Number(value);if(!Number.isFinite(n))return '';
 const mins=((Math.round(n)%1440)+1440)%1440,h=Math.floor(mins/60),m=mins%60,ap=h>=12?'PM':'AM',hour=h%12||12;
 return `${hour}:${String(m).padStart(2,'0')} ${ap}`;
}
function formatDate(value){
 if(!value)return '';
 const [y,m,d]=String(value).split('-').map(Number);
 if(!y||!m||!d)return String(value);
 return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(y,m-1,d));
}
function sessionWindow(s){
 const start=minutes(s?.start),rawEnd=minutes(s?.end),duration=Number(s?.durationMinutes||0),end=Number.isFinite(rawEnd)?rawEnd:start+duration;
 return Number.isFinite(start)&&Number.isFinite(end)&&end>start?{...s,startMinutes:start,endMinutes:end}:null;
}
function sessionsForDate(data,date){
 return (Array.isArray(data?.sessions)?data.sessions:[]).filter(s=>s&&s.active!==false&&s.date===date).map(sessionWindow).filter(Boolean).sort((a,b)=>a.startMinutes-b.startMinutes);
}
function displayName(s){
 const ids=[s.teamId,...(s.teamIds||[])].filter(Boolean),names=[...new Set(ids.map(id=>teamNames.get(id)).filter(Boolean))];
 return names.length?names.join(' + '):'Rebels practice';
}
function selectedWindow(){
 const start=$('#start')?.value,duration=Number($('#durationMinutes')?.value||0);if(!start||!duration)return null;
 const w=practiceWindow({start,durationMinutes:duration});return Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start?{start:start,end:w.end,durationMinutes:duration}:null;
}
function conflicts(){const candidate=selectedWindow();return candidate?state.sessions.filter(s=>overlaps(candidate,{start:s.startMinutes,end:s.endMinutes})):[];}
function nextAvailableStart(candidate){
 if(!candidate)return null;let start=practiceWindow(candidate).start;
 for(const s of state.sessions){if(start<s.startMinutes)break;if(start>=s.startMinutes&&start<s.endMinutes)start=s.endMinutes;}
 return start;
}
function availabilityRows(){
 if(!state.sessions.length)return [{kind:'open',label:'Available all day',start:null,end:null}];
 const rows=[];let previousEnd=null;
 for(const s of state.sessions){
  if(previousEnd==null&&s.startMinutes>0)rows.push({kind:'open',label:`Available before ${formatMinutes(s.startMinutes)}`,start:null,end:s.startMinutes});
  if(previousEnd!=null&&s.startMinutes>previousEnd)rows.push({kind:'open',label:`${formatMinutes(previousEnd)}–${formatMinutes(s.startMinutes)} available`,start:previousEnd,end:s.startMinutes});
  rows.push({kind:'booked',label:`${formatMinutes(s.startMinutes)}–${formatMinutes(s.endMinutes)}`,session:s});
  previousEnd=Math.max(previousEnd??0,s.endMinutes);
 }
 if(previousEnd!=null)rows.push({kind:'open',label:`${formatMinutes(previousEnd)} onward available`,start:previousEnd,end:null});
 return rows;
}
function renderAvailability(){
 const facility=$('#facility')?.value,date=$('#date')?.value,anchor=document.querySelector('.practice-timing-row');
 let box=$('#facility-availability');
 if(!anchor){box?.remove();return;}
 if(!box){box=document.createElement('section');box.id='facility-availability';box.className='facility-availability';anchor.insertAdjacentElement('afterend',box);}
 const id=facilityId(facility);
 if(!date||!['barn','shed'].includes(id)){box.innerHTML='';box.hidden=true;return;}box.hidden=false;
 const facilityName=id==='barn'?'The Barn':'The Shed',prettyDate=formatDate(date);
 if(state.loading){box.innerHTML=`<div class="availability-head"><div><strong>${facilityName} availability</strong><span>${esc(prettyDate)}</span></div><em>Checking…</em></div>`;return;}
 if(state.error){box.innerHTML=`<div class="availability-head"><div><strong>${facilityName} availability</strong><span>${esc(prettyDate)}</span></div></div><p class="availability-note">${esc(state.error)}</p>`;return;}
 if(!state.loaded){box.innerHTML=`<div class="availability-head"><div><strong>${facilityName} availability</strong><span>${esc(prettyDate)}</span></div></div><p class="availability-note">Availability will appear here.</p>`;return;}
 const rows=availabilityRows().map(r=>r.kind==='booked'
  ?`<div class="availability-row booked"><div><strong>${esc(r.label)}</strong><small>${esc(displayName(r.session))} · Booked</small></div><span class="availability-badge">Booked</span></div>`
  :`<button type="button" class="availability-row open" ${r.start==null?'disabled':''} data-available-start="${r.start??''}"><div><strong>${esc(r.label)}</strong><small>${r.start==null?'No existing booking conflicts':'Tap to use '+esc(formatMinutes(r.start))+' as the start time'}</small></div><span class="availability-badge">Available</span></button>`).join('');
 const hit=conflicts(),candidate=selectedWindow();let warning='';
 if(hit.length){const next=nextAvailableStart(candidate),first=hit[0];warning=`<div class="availability-warning"><strong>That time overlaps a booking.</strong><span>${esc(formatMinutes(first.startMinutes))}–${esc(formatMinutes(first.endMinutes))} is booked${next!=null?`. Next available start: ${esc(formatMinutes(next))}.`:'.'}</span>${next!=null?`<button type="button" data-next-open="${next}">Use ${esc(formatMinutes(next))}</button>`:''}</div>`;}
 box.innerHTML=`<div class="availability-head"><div><strong>${facilityName} availability</strong><span>${esc(prettyDate)}</span></div></div>${warning}<div class="availability-list">${rows}</div>`;
 box.querySelectorAll('[data-available-start]').forEach(btn=>btn.addEventListener('click',()=>useStart(Number(btn.dataset.availableStart))));
 box.querySelector('[data-next-open]')?.addEventListener('click',e=>useStart(Number(e.currentTarget.dataset.nextOpen)));
}
function useStart(value){
 const input=$('#start');if(!input||!Number.isFinite(value))return;input.value=`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;input.dispatchEvent(new Event('change',{bubbles:true}));renderAvailability();
}
async function loadAvailability(force=false){
 const facility=$('#facility')?.value,date=$('#date')?.value,id=facilityId(facility);if(!date||!['barn','shed'].includes(id)){state.key='';state.sessions=[];state.loaded=false;renderAvailability();return;}
 const key=`${id}|${date}`;if(!force&&state.key===key&&(state.loaded||state.loading))return;state.key=key;state.loading=true;state.loaded=false;state.error='';state.sessions=[];renderAvailability();
 try{
  const {F,db,auth}=await shared.services();if(!shared.allowed(auth.currentUser))throw Error('Coach sign-in is required to view facility bookings.');
  const snap=await F.getDocFromServer(F.doc(db,'rpCheckinLocations',id));if(state.key!==key)return;
  state.sessions=sessionsForDate(snap.exists()?snap.data():{},date);state.loaded=true;
 }catch(e){if(state.key===key)state.error=String(e?.message||e);}finally{if(state.key===key)state.loading=false;renderAvailability();}
}
function onFieldChange(e){if(['date','facility'].includes(e.target?.id))loadAvailability(true);else if(['start','durationMinutes'].includes(e.target?.id))renderAvailability();}
function interceptNext(e){
 const button=e.target?.closest?.('[data-next="attendance"]');if(!button||!state.loaded)return;const hit=conflicts();if(!hit.length)return;
 e.preventDefault();e.stopImmediatePropagation();renderAvailability();$('#facility-availability')?.scrollIntoView({behavior:'smooth',block:'center'});
}
let scheduled=false;
function sync(){
 scheduled=false;
 const date=$('#date')?.value,facility=$('#facility')?.value,start=$('#start');
 if(!date||!facility||!start){$('#facility-availability')?.remove();return;}
 const id=facilityId(facility);
 if(!['barn','shed'].includes(id)){renderAvailability();return;}
 const key=`${id}|${date}`;
 if(state.key===key&&(state.loaded||state.loading||state.error)){
  if(!$('#facility-availability'))renderAvailability();
  return;
 }
 loadAvailability(false);
}
const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(sync);}});
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',onFieldChange,true);document.addEventListener('input',onFieldChange,true);document.addEventListener('click',interceptNext,true);
window.addEventListener('focus',()=>loadAvailability(true));
sync();

export {formatMinutes,formatDate,sessionsForDate,availabilityRows};
