// Build 248: preserve the existing scheduler, but allow pitching warm-ups to run during a Live block when the scheduler can place them safely.
// The core scheduler already enforces unique player assignments, catcher/coach availability, station sizes, and pitching warm-up-before-Live.
import './mental-masters-worker-rp238.mjs?v=rp248';
const baseHandler=self.onmessage;
self.onmessage=event=>{
  const data=event?.data;
  if(data?.input){
    const next={...data,input:{...data.input,allowWarmupDuringLive:true}};
    return baseHandler({data:next});
  }
  return baseHandler(event);
};
