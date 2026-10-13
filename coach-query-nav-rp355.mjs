// Build 355: allow the shared bottom menu to open a specific coach-portal destination.
const params=new URLSearchParams(location.search);
const target=params.get('view');
if(target){
 let done=false;
 const tryOpen=()=>{
  if(done)return;
  const button=document.querySelector('[data-coach-view="'+CSS.escape(target)+'"]');
  if(!button)return;
  done=true;
  button.click();
 };
 tryOpen();
 const app=document.getElementById('app');
 if(app){
  const observer=new MutationObserver(()=>{tryOpen();if(done)observer.disconnect();});
  observer.observe(app,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
 }
}
