import './worker.mjs?v=structural237';
import {applyMentalMasters} from './mental-masters-rp239.mjs?v=rp239';

const originalHandler=self.onmessage;
const nativePost=self.postMessage.bind(self);
let currentInput=null;

self.postMessage=(data,...rest)=>{
 try{
  if(currentInput&&data&&typeof data==='object'){
   if(data.plan)data={...data,plan:applyMentalMasters(data.plan,currentInput)};
   else if(data.practice)data={...data,practice:applyMentalMasters(data.practice,currentInput)};
  }
 }catch(error){console.error('Mental Masters post-processing failed',error);}
 return nativePost(data,...rest);
};
self.onmessage=event=>{currentInput=event?.data?.input||currentInput;return originalHandler?.call(self,event);};
