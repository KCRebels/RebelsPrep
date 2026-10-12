/* Build 327: coach selections are live state; remove the obsolete extra Save confirmation. */
function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim();}
function cleanup(){
  const all=[...document.querySelectorAll('#app *')];
  const count=all.find(el=>/^\d+\s+coaches?\s+selected$/i.test(text(el)));
  if(!count)return;
  let scope=count.closest('section,.panel,.card,.step-panel,div');
  for(let i=0;i<4&&scope;i++,scope=scope.parentElement){
    const save=[...scope.querySelectorAll('button')].find(b=>/^save$/i.test(text(b)));
    if(save){save.remove();return;}
  }
  /* Narrow fallback: only while the coach-selection count is actually on screen. */
  const visibleSave=[...document.querySelectorAll('#app button')].find(b=>/^save$/i.test(text(b))&&b.offsetParent!==null);
  if(visibleSave)visibleSave.remove();
}
let frame=0;const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(cleanup)};
new MutationObserver(schedule).observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:true});
document.addEventListener('click',schedule,true);schedule();
