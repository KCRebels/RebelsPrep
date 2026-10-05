import {buildPractice,validatePractice} from './scheduler.mjs?v=livecapacity79';
function checked(input){const plan=buildPractice(input);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));return plan;}
function pitcherSets(input){
 if(input.players.length<35)return [null];
 const pitchers=input.players.filter(p=>p.pitcher&&p.canPitch!==false).sort((a,b)=>Number(!!b.noPitchWarmup)-Number(!!a.noPitchWarmup)||String(a.arrival||input.start).localeCompare(String(b.arrival||input.start))||String(b.departure||'99:99').localeCompare(String(a.departure||'99:99')));
 const total=Math.floor(Number(input.durationMinutes)/Number(input.blockMinutes))-1;
 const target=Math.max(1,total-Math.ceil(input.players.length/8));
 const needed=Math.max(1,Math.min(pitchers.length,Math.ceil(target/3)));
 if(pitchers.length<=needed)return [new Set(pitchers.map(p=>p.id))];
 const sets=[];
 const add=ids=>{const key=ids.slice().sort().join('|');if(!sets.some(s=>[...s].sort().join('|')===key))sets.push(new Set(ids));};
 const sizes=[needed,Math.min(pitchers.length,needed+1)];
 for(const size of sizes){
  add(pitchers.slice(0,size).map(p=>p.id));
  for(let offset=1;offset<pitchers.length&&sets.length<16;offset++)add(Array.from({length:size},(_,i)=>pitchers[(offset+i)%pitchers.length].id));
 }
 return sets;
}
function transformed(input,active,preferPlayerWarmupCatcher){
 if(!active)return input;
 return {...input,preferPlayerWarmupCatcher,allowWarmupDuringLive:true,players:input.players.map(p=>p.pitcher&&p.canPitch!==false&&!active.has(p.id)?{...p,pitcher:false,canPitch:false}:p)};
}
function restorePitcherCoverage(plan,originalInput){
 if(!plan||originalInput.players.length<35)return plan;
 const original=new Map(originalInput.players.map(p=>[p.id,p]));
 plan.players=plan.players.map(p=>{const source=original.get(p.id);return source?{...p,pitcher:source.pitcher,canPitch:source.pitcher&&source.canPitch!==false}:p;});
 const used=new Set(plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live'&&s.pitcher).map(s=>s.pitcher)));
 const missing=originalInput.players.filter(p=>p.pitcher&&p.canPitch!==false&&!used.has(p.id));
 plan.missingPitchers=missing.map(p=>p.id);
 plan.warnings=(plan.warnings||[]).filter(w=>!/^\d+ pitchers? have no Live pitching session:/.test(w));
 if(missing.length)plan.warnings.push(missing.length+' pitchers have no Live pitching session: '+missing.map(p=>p.name).join(', ')+'.');
 plan.requiresAcceptance=Boolean(plan.missingLive?.length||missing.length||plan.missingCatchers?.length);
 return plan;
}
function planValue(plan){return (plan.players.length-(plan.missingLive?.length||0))*10000-(plan.missingPitchers?.length||0)*20-(plan.missingCatchers?.length||0)*5;}
function buildChecked(input){
 if(input.players.length<35)return checked(input);
 let best=null,lastError=null;
 for(const active of pitcherSets(input))for(const playerCatcher of [false,true]){try{const plan=restorePitcherCoverage(checked(transformed(input,active,playerCatcher)),input);if(!best||planValue(plan)>planValue(best))best=plan;if(!(plan.missingLive?.length))return plan;}catch(error){lastError=error;}}
 if(best)return best;
 throw lastError||Error('No valid large-practice plan found.');
}
function withBuildDiagnostics(plan,input){
 if(!plan||input.players.length<35)return plan;
 const live=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live')),front=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='front')),machine=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='machine')),warm=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='warm'));
 const liveHitters=live.reduce((n,s)=>n+s.players.length,0),liveSizes=live.map(s=>s.players.length).join('/'),warmAlongsideLive=plan.blocks.filter(b=>b.stations.some(s=>s.kind==='live')&&b.stations.some(s=>s.kind==='warm')).length;
 plan.warnings=[...(plan.warnings||[]),'Scheduler check: '+live.length+' Live blocks · '+liveHitters+' Live hitter slots · Live groups '+(liveSizes||'none')+' · '+front.length+' Front Toss stations · '+machine.length+' Machine stations · '+warm.length+' pitching warm-ups · '+warmAlongsideLive+' alongside Live.'];
 return plan;
}
self.onmessage=event=>{
 try{
  if(event.data.mode==='staffing'){
   const input=event.data.input,max=Math.max(1,input.coaches.length),results=[];let minimum=null,lastError='';
   for(let n=1;n<=max;n++){try{checked({...input,coaches:input.coaches.slice(0,n),allowReplacements:true});minimum=n;break;}catch(e){lastError=e.message;results.push({coaches:n,error:e.message});}}
   self.postMessage({staffing:{minimum,available:max,error:minimum?null:lastError,attempts:results}});
  }else if(event.data.mode==='recommend'){
   const plan=checked(event.data.input);const stationBlocks=plan.blocks.map(b=>{const hitting=b.stations.filter(s=>['drill','machine','front','live'].includes(s.kind));const hitters=hitting.reduce((n,s)=>n+s.players.length,0);const total=Math.floor(hitters/3);const builtIn=hitting.filter(s=>s.kind!=='drill').length;return {count:Math.max(0,total-builtIn),total,mode:hitting.some(s=>s.kind==='live')?'live':'front'};}).filter(b=>b.total);
   const count=Math.max(0,...stationBlocks.map(b=>b.count)),frontCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='front').map(b=>b.count)),liveCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='live').map(b=>b.count)),total=Math.max(0,...stationBlocks.map(b=>b.total));self.postMessage({recommendation:{count,frontCount,liveCount,total,warnings:plan.warnings}});
  }else if(event.data.mode==='build'){
   try{self.postMessage({plan:withBuildDiagnostics(buildChecked({...event.data.input,allowReplacements:false}),event.data.input)});}
   catch(original){try{const plan=withBuildDiagnostics(buildChecked({...event.data.input,allowReplacements:true}),event.data.input);if(!plan.replacements.length)throw original;self.postMessage({replacementOffer:plan});}catch(replacement){self.postMessage({error:'Standard plan: '+original.message+' Replacement plan: '+replacement.message});}}
  }else self.postMessage({plan:checked(event.data)});
 }catch(error){self.postMessage({error:error.message});}
};
