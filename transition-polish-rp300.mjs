// Build 304: transition hiding disabled. Keep this module as a safe no-op so cached startup references cannot hide #app.
const app=document.getElementById('app');
if(app){
  app.classList.remove('rp-view-transitioning');
  const stale=document.getElementById('rp-transition-polish-style');
  stale?.remove();
}
