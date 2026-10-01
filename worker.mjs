import {buildPractice,validatePractice} from './scheduler.mjs?v=rpbuild14';
function checked(input){const plan=buildPractice(input);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));return plan;}
self.onmessage=event=>{
 try{
  if(event.data.mode==='recommend'){
   const input=event.data.input,all=input.drills.filter(d=>d.kind==='drill'&&d.name!=='Basic Tee Work'),fixed=input.drills.filter(d=>d.kind!=='drill'||d.name==='Basic Tee Work');
   let plan=checked(input),best=all;
   const targetScore=plan.score;
   let low=0,high=input.players.length<=20?all.length-1:-1;
   while(low<=high){
    const count=Math.floor((low+high)/2),subset=all.slice(0,count);
    try{
     const candidate=checked({...input,drills:[...fixed,...subset]});
     if(candidate.score<targetScore)throw Error('Lower coverage');
     plan=candidate;best=subset;high=count-1;
    }catch{low=count+1;}
   }
   const used=new Set(plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='drill').map(s=>s.drillId)));
   self.postMessage({recommendation:{count:used.size,names:best.filter(d=>used.has(d.id)).map(d=>d.name),warnings:plan.warnings}});
  }else if(event.data.mode==='build'){
   try{self.postMessage({plan:checked({...event.data.input,allowReplacements:false})});}
   catch(original){try{const plan=checked({...event.data.input,allowReplacements:true});if(!plan.replacements.length)throw original;self.postMessage({replacementOffer:plan});}catch{throw original;}}
  }else self.postMessage({plan:checked(event.data)});
 }catch(error){self.postMessage({error:error.message});}
};
