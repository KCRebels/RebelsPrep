// Build 300: hide intermediate builder renders until the destination view is fully decorated.
const app=document.getElementById('app');
if(app){
 const style=document.createElement('style');
 style.textContent=`#app.rp-view-transitioning{opacity:0!important}#app{transition:opacity .08s ease}`;
 document.head.appendChild(style);
 let token=0;
 let timer=0;
 const begin=()=>{
  token++;
  const mine=token;
  clearTimeout(timer);
  app.classList.add('rp-view-transitioning');
  const settle=()=>{
   if(mine!==token)return;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(mine!==token)return;
    app.classList.remove('rp-view-transitioning');
   }));
  };
  timer=setTimeout(settle,90);
 };
 const maybeBegin=(target)=>{
  if(!target)return;
  const nav=target.closest?.('.bottom-nav [data-view]');
  const button=target.closest?.('button,a');
  const text=(button?.textContent||'').trim().toLowerCase();
  if(nav||['continue','next','back','build','edit','change drills','accept'].includes(text))begin();
 };
 document.addEventListener('pointerdown',e=>maybeBegin(e.target),true);
 new MutationObserver(()=>{
  if(!app.classList.contains('rp-view-transitioning'))return;
  clearTimeout(timer);
  timer=setTimeout(()=>{
   requestAnimationFrame(()=>requestAnimationFrame(()=>app.classList.remove('rp-view-transitioning')));
  },45);
 }).observe(app,{childList:true,subtree:true,attributes:true,characterData:true});
}
