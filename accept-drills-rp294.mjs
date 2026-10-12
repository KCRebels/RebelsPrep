// Build 294: Accept is disabled/gray until the exact required station-drill count is selected.
function syncAcceptDrills(){
  const button=document.querySelector('#accept-drills');
  const summary=document.querySelector('#selection-summary');
  if(!button||!summary)return;
  const text=summary.textContent.replace(/\s+/g,' ').trim();
  const match=text.match(/(\d+)\s+of\s+(\d+)\s+station drills selected/i);
  const ready=!!match&&Number(match[1])===Number(match[2]);
  button.disabled=!ready;
  button.setAttribute('aria-disabled',String(!ready));
  button.classList.toggle('rp-accept-ready',ready);
  button.classList.toggle('rp-accept-waiting',!ready);
}
let frame=0;
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(syncAcceptDrills);}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','disabled']});
document.addEventListener('click',schedule,true);
schedule();
