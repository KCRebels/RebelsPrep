// Build 301 hotfix: hide a destination view before its first paint and reveal only after decorators settle.
const app=document.getElementById('app');
if(app){
 const style=document.createElement('style');
 style.textContent=`#app.rp-view-transitioning{visibility:hidden!important}`;
 document.head.appendChild(style);
 let lastView=app.dataset.practiceView||'';
 let timer=0;
 let token=0;
 const hide=()=>{token++;app.classList.add('rp-view-transitioning');};
 const settle=()=>{
  const mine=token;
  clearTimeout(timer);
  timer=setTimeout(()=>{
   if(mine!==token)return;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(mine===token)app.classList.remove('rp-view-transitioning');
   }));
  },70);
 };
 const observer=new MutationObserver(records=>{
  const nextView=app.dataset.practiceView||'';
  const viewChanged=nextView!==lastView;
  const rootRebuilt=records.some(r=>r.type==='childList'&&r.target===app);
  if(viewChanged||rootRebuilt){
   lastView=nextView;
   hide();
  }
  if(app.classList.contains('rp-view-transitioning'))settle();
 });
 observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-practice-view','data-attendance-stage','class'],characterData:true});
 document.addEventListener('pointerdown',e=>{
  const nav=e.target.closest?.('.bottom-nav [data-view]');
  const button=e.target.closest?.('button,a');
  const text=(button?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(nav||['continue','next','back','build','edit','change drills','accept','next: attendance','next: drills'].some(x=>text===x||text.startsWith(x))){hide();settle();}
 },true);
}
