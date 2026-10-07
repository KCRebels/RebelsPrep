// Build 233 — Attendance saves automatically; coach minimum is visible and enforced.
function attendancePage(){
  const h1=document.querySelector('#app h1');
  return h1?.textContent?.trim()||'';
}
function coachMinimum(){
  const text=document.querySelector('#staffing-guidance')?.textContent||'';
  const m=text.match(/at least\s+(\d+)\s+coach/i);
  return m?Number(m[1]):1;
}
function selectedCoaches(){
  return document.querySelectorAll('#app .people input[data-coach]:checked').length;
}
function enhance(){
  const page=attendancePage();
  if(!page.startsWith('Attendance ·'))return;

  // Attendance selections already persist immediately; no separate Save button is needed.
  document.querySelectorAll('#app .step-actions #save-draft').forEach(b=>b.remove());

  if(page!=='Attendance · Coaches')return;
  const min=coachMinimum();
  const h2=[...document.querySelectorAll('#app .panel h2')].find(x=>x.textContent.trim().startsWith('Coaches'));
  if(h2){
    let badge=h2.querySelector('.rp233-required');
    if(!badge){badge=document.createElement('span');badge.className='rp233-required';h2.appendChild(badge);}
    badge.textContent=' · '+min+' REQUIRED';
  }
  const guidance=document.querySelector('#staffing-guidance');
  if(guidance) guidance.textContent='Required for this practice: '+min+' '+(min===1?'coach':'coaches')+' minimum for '+((guidance.textContent.match(/for\s+(\d+)\s+players/i)||[])[1]||'the selected players')+'. Select at least '+min+' before continuing.';
  const next=document.querySelector('#next-coaches-drills');
  if(next){
    const selected=selectedCoaches();
    next.disabled=selected<min;
    next.setAttribute('aria-disabled',String(selected<min));
  }
}

// Block navigation even if another module re-enables/replaces the button.
document.addEventListener('click',e=>{
  const next=e.target.closest?.('#next-coaches-drills');
  if(!next)return;
  const min=coachMinimum(),selected=selectedCoaches();
  if(selected>=min)return;
  e.preventDefault();e.stopImmediatePropagation();
  let note=document.querySelector('#rp233-coach-error');
  if(!note){note=document.createElement('p');note.id='rp233-coach-error';note.className='error';next.closest('.step-actions')?.before(note);}
  note.textContent='Select at least '+min+' '+(min===1?'coach':'coaches')+' before continuing to Drills.';
  note.scrollIntoView({behavior:'smooth',block:'center'});
},true);

// Re-run after every RebelsPrep render and checkbox change.
new MutationObserver(()=>enhance()).observe(document.getElementById('app'),{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target.matches?.('input[data-coach]'))requestAnimationFrame(enhance);},true);
requestAnimationFrame(enhance);
