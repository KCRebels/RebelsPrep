import {buildPractice,validatePractice} from './scheduler.mjs';
self.onmessage=event=>{
 try{const plan=buildPractice(event.data);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));self.postMessage({plan});}
 catch(error){self.postMessage({error:error.message});}
};
