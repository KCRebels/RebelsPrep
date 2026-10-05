import {buildPractice,validatePractice} from './scheduler-live69.mjs?v=live69';
function checked(input){const plan=buildPractice(input);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));return plan;}
self.onmessage=event=>{
 try{
  if(event.data.mode==='staffing'){
   const input=event.data.input,max=Math.max(1,input.coaches.length),results=[];
   let minimum=null,lastError='';
   for(let n=1;n<=max;n++){
    try{checked({...input,coaches:input.coaches.slice(0,n),allowReplacements:true});minimum=n;break;}
    catch(e){lastError=e.message;results.push({coaches:n,error:e.message});}
   }
   self.postMessage({staffing:{minimum,available:max,error:minimum?null:lastError,attempts:results}});
  }else if(event.data.mode==='recommend'){
   const plan=checked(event.data.input);
   const stationBlocks=plan.blocks.map(b=>{const hitting=b.stations.filter(s=>['drill','machine','front','live'].includes(s.kind));const hitters=hitting.reduce((n,s)=>n+s.players.length,0);const total=Math.floor(hitters/3);const builtIn=hitting.filter(s=>s.kind!=='drill').length;return {count:Math.max(0,total-builtIn),total,mode:hitting.some(s=>s.kind==='live')?'live':'front'};}).filter(b=>b.total);
   const count=Math.max(0,...stationBlocks.map(b=>b.count)),frontCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='front').map(b=>b.count)),liveCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='live').map(b=>b.count)),total=Math.max(0,...stationBlocks.map(b=>b.total));self.postMessage({recommendation:{count,frontCount,liveCount,total,warnings:plan.warnings}});
  }else if(event.data.mode==='build'){
   try{const plan=checked({...event.data.input,allowReplacements:false});if(plan.missingLive?.length){try{const replacement=checked({...event.data.input,allowReplacements:true});if(replacement.replacements.length)self.postMessage({replacementOffer:replacement});else self.postMessage({plan});}catch{self.postMessage({plan});}}else self.postMessage({plan});}
   catch(original){try{const plan=checked({...event.data.input,allowReplacements:true});if(!plan.replacements.length)throw original;self.postMessage({replacementOffer:plan});}catch(replacement){self.postMessage({error:'Standard plan: '+original.message+' Replacement plan: '+replacement.message});}}
  }else self.postMessage({plan:checked(event.data)});
 }catch(error){self.postMessage({error:error.message});}
};
