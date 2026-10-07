// Drill picker cleanup: station drills only. Machine/Front Toss focus is chosen later in the build flow.
// Mental Masters is a BJ Fox-only conditional drill.
const BJ_ID='rp-c-57';
const MM_ID='mental-masters';
function bjSelected(){
 try{
  const raw=localStorage.getItem('rebelsPrepLastBuildInput');
  if(raw&&(JSON.parse(raw)?.coaches||[]).some(c=>c.id===BJ_ID))return true;
 }catch{}
 const checked=[...document.querySelectorAll('input:checked')];
 return checked.some(el=>el.value===BJ_ID||el.dataset.coachId===BJ_ID||el.closest('[data-coach-id="'+BJ_ID+'"]'))||document.body.innerText.includes('BJ Fox');
}
function clean(){
 const results=document.getElementById('drill-results');if(!results)return;
 // Remove any Front Toss/Machine library choices. Those focuses belong to the later build phase.
 results.querySelectorAll('.drill-row').forEach(row=>{
  const meta=(row.querySelector('small')?.textContent||'').toLowerCase();
  if(meta.includes('front toss')||meta.includes('machine'))row.remove();
 });
 // Mental Masters behaves like a normal drill choice visually and is available only when BJ attends.
 let mm=document.getElementById('rp-mm-drill-row');
 if(!bjSelected()){mm?.remove();return;}
 if(mm)return;
 const rows=results.querySelector('.drill-rows');if(!rows)return;
 mm=document.createElement('article');mm.id='rp-mm-drill-row';mm.className='drill-row';
 mm.innerHTML='<div class="drill-row-head"><button class="drill-row-select" type="button" aria-pressed="false" aria-label="Mental Masters"><span class="drill-row-mark" aria-hidden="true">+</span><span class="drill-row-label"><strong>Mental Masters</strong></span></button></div>';
 // Scheduler automatically includes Mental Masters when BJ attends; selection here is informational/visual.
 mm.querySelector('button').onclick=()=>{const b=mm.querySelector('button'),on=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!on));mm.classList.toggle('selected',!on);mm.querySelector('.drill-row-mark').textContent=!on?'✓':'+';};
 rows.appendChild(mm);
}
window.addEventListener('load',clean);setTimeout(clean,0);setInterval(clean,350);
