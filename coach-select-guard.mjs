import {coaches} from './roster.mjs?v=rp118';

const KEY='RebelsPrep:coach-pilot:1';
const sleep=()=>new Promise(resolve=>setTimeout(resolve,0));

function selectedTeamIds(){
 try{
  const active=localStorage.getItem(KEY+':active-team')||'kc-rebels-nationals';
  const raw=localStorage.getItem(KEY+':team:'+active)||localStorage.getItem(KEY);
  if(raw){const d=JSON.parse(raw);if(Array.isArray(d.teamIds)&&d.teamIds.length)return d.teamIds;if(d.teamId)return [d.teamId];}
  return active.includes('+')?active.split('+'):[active];
 }catch{return ['kc-rebels-nationals'];}
}
function homeCoachIds(){const ids=selectedTeamIds();return coaches.filter(c=>c.teamIds?.some(id=>ids.includes(id))).map(c=>c.id);}
async function setCoach(id,checked){
 const el=document.querySelector('input[data-coach][data-include="'+CSS.escape(id)+'"]');
 if(!el||el.checked===checked)return;
 el.checked=checked;
 el.dispatchEvent(new Event('change',{bubbles:true}));
 await sleep();
}
async function selectHome(){for(const id of homeCoachIds())await setCoach(id,true);}
async function clearAll(){
 const selected=[...document.querySelectorAll('input[data-coach][data-include]:checked')].map(el=>el.dataset.include);
 for(const id of selected)await setCoach(id,false);
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('#all-coaches,#clear-coaches');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 button.disabled=true;
 (button.id==='all-coaches'?selectHome():clearAll()).finally(()=>{const current=document.getElementById(button.id);if(current)current.disabled=false;});
},true);
