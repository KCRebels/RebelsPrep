// Build 344: active practice emphasis + shared live-practice state for My Practice routing.
import {services,accountContext,watchAccount,isCoach} from './account-model-rp276.mjs?v=rp276';
import {clockState} from './portal-model.mjs?v=rp129';

let account=null;
let assignments={};
let clocks=new Map();
let stops=[];
let accountStop=null;
let frame=0;

function validRecord(r){
 return r&&r.practiceId&&/^[a-f0-9]{64}$/.test(r.clockToken||'')&&r.personId===account?.coachId&&r.role==='coach';
}
function activeRecords(){
 return Object.values(assignments||{}).filter(validRecord).filter(r=>{
  const c=clockState(clocks.get(r.clockToken)?.clock);
  return c&&!c.done;
 });
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(mount);}
function currentAssignmentText(){
 const cell=document.querySelector('.personal-current td:last-child');
 if(!cell)return '';
 const clone=cell.cloneNode(true);
 clone.querySelectorAll('.personal-players,.personal-instructions,.personal-station-break').forEach(el=>el.remove());
 return clone.textContent.replace(/\s+/g,' ').trim();
}
function decorateHome(){
 const active=activeRecords().length>0;
 document.body.classList.toggle('rp-coach-has-active-practice',active);
 const tile=document.querySelector('.coach-card[data-coach-view="practice"]');
 if(!tile)return;
 tile.classList.toggle('rp-active-practice-card',active);
 let tag=tile.querySelector('.rp-active-practice-tag');
 if(active&&!tag){
  tag=document.createElement('span');
  tag.className='rp-active-practice-tag';
  tag.textContent='ACTIVE';
  tile.appendChild(tag);
 }else if(!active&&tag){tag.remove();}
}
function decoratePractice(){
 const page=document.querySelector('.coach-portal-page');
 const shell=page?.querySelector('.personal-coach-shell');
 if(!page)return;
 page.classList.toggle('rp-has-active-practice',!!shell);
 if(!shell)return;
 const status=shell.querySelector('.personal-status');
 const strong=status?.querySelector('strong');
 const label=status?.querySelector('span');
 if(!status||!strong||!label)return;
 const assignment=currentAssignmentText();
 const raw=strong.textContent.trim();
 if((raw==='Practice running'||status.dataset.rpStationApplied==='1')&&assignment){
  if(label.textContent!=='CURRENT STATION')label.textContent='CURRENT STATION';
  if(strong.textContent!==assignment)strong.textContent=assignment;
  status.dataset.rpStationApplied='1';
 }
}
function mount(){decorateHome();decoratePractice();}

async function setAssignments(next){
 for(const stop of stops)stop();
 stops=[];clocks.clear();assignments=next||{};
 const {F,db}=await services();
 const tokens=[...new Set(Object.values(assignments).filter(validRecord).map(r=>r.clockToken))];
 for(const token of tokens){
  stops.push(F.onSnapshot(F.doc(db,'rpClocks',token),snap=>{
   if(snap.exists())clocks.set(token,snap.data());else clocks.delete(token);
   schedule();
  },()=>schedule()));
 }
 schedule();
}
async function start(){
 try{
  const ctx=await accountContext();
  account=ctx?.account||null;
  if(isCoach(account))await setAssignments(account.practiceAssignments);
  accountStop=await watchAccount(a=>{
   account=a;
   if(isCoach(a))setAssignments(a.practiceAssignments).catch(()=>schedule());
   else{assignments={};for(const stop of stops)stop();stops=[];clocks.clear();schedule();}
  },()=>schedule());
 }catch{schedule();}
}

const app=document.getElementById('app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('pagehide',()=>{for(const stop of stops)stop();accountStop?.();});
schedule();start();
