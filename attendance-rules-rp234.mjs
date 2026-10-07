// Attendance screen rules.
function pageName(){return document.querySelector('#app h1')?.textContent?.trim()||'';}
function requiredCoaches(){
 const text=document.querySelector('#staffing-guidance')?.dataset.originalText||document.querySelector('#staffing-guidance')?.textContent||'';
 return Number((text.match(/at least\s+(\d+)\s+coach/i)||[])[1]||1);
}
function coachCount(){return document.querySelectorAll('#app .people input[data-coach]:checked').length;}
function refreshAttendance(){
 const page=pageName();
 if(!page.startsWith('Attendance ·'))return;
 document.querySelectorAll('#app .step-actions #save-draft').forEach(el=>el.remove());
 if(page!=='Attendance · Coaches')return;
 const guide=document.querySelector('#staffing-guidance');
 if(guide&&!guide.dataset.originalText)guide.dataset.originalText=guide.textContent;
 const min=requiredCoaches();
 const players=Number(((guide?.dataset.originalText||'').match(/For\s+(\d+)\s+players/i)||[])[1]||0);
 const heading=[...document.querySelectorAll('#app .panel h2')].find(el=>el.textContent.trim().startsWith('Coaches'));
 if(heading&&!heading.querySelector('.required-coaches')){
   const tag=document.createElement('strong');tag.className='required-coaches';tag.textContent=' · '+min+' REQUIRED';heading.appendChild(tag);
 }
 if(guide){const msg='Required: '+min+' '+(min===1?'coach':'coaches')+(players?' for '+players+' players':'')+'. Select the required number before continuing.';if(guide.textContent!==msg)guide.textContent=msg;}
 const next=document.querySelector('#next-coaches-drills');
 if(next){const unavailable=coachCount()<min;next.disabled=unavailable;next.setAttribute('aria-disabled',String(unavailable));}
}
document.addEventListener('click',event=>{
 const next=event.target.closest?.('#next-coaches-drills');if(!next)return;
 const min=requiredCoaches();if(coachCount()>=min)return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
let scheduled=false;
new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refreshAttendance();});}).observe(document.getElementById('app'),{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target.matches?.('input[data-coach]'))requestAnimationFrame(refreshAttendance);},true);
requestAnimationFrame(refreshAttendance);
