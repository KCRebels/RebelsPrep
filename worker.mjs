import {buildPractice,validatePractice} from './scheduler.mjs?v=livecapacity80';
function checked(input){const plan=buildPractice(input);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));return plan;}
function age(p){const ids=p.memberTeamIds||p.teamIds||[];if(ids.some(id=>String(id).includes('18')))return 18;if(ids.some(id=>String(id).includes('16')))return 16;if(ids.some(id=>String(id).includes('14')))return 14;return 0;}
const upper=p=>age(p)>=16;
function activePitchers(input){
 const pitchers=input.players.filter(p=>p.pitcher&&p.canPitch!==false).sort((a,z)=>Number(upper(z))-Number(upper(a))||Number(z.noPitchWarmup)-Number(a.noPitchWarmup)||(a.arrival||input.start).localeCompare(z.arrival||input.start)||String(a.name).localeCompare(String(z.name)));
 if(input.players.length<35)return null;
 const rotationBlocks=Math.max(0,Math.floor(Number(input.durationMinutes)/Number(input.blockMinutes))-1),frontTossBlocks=Math.ceil(input.players.length/8),availableLiveBlocks=Math.max(0,rotationBlocks-frontTossBlocks),needed=Math.min(pitchers.length,availableLiveBlocks);
 return new Set(pitchers.slice(0,needed).map(p=>p.id));
}
function transformed(input,preferPlayerWarmupCatcher=true){
 const active=activePitchers(input);if(!active)return {...input,preferPlayerWarmupCatcher,allowWarmupDuringLive:true};
 return {...input,preferPlayerWarmupCatcher,allowWarmupDuringLive:true,players:input.players.map(p=>p.pitcher&&!active.has(p.id)?{...p,pitcher:false,canPitch:false}:p)};
}
function restorePitcherCoverage(plan,originalInput){
 if(!plan||originalInput.players.length<35)return plan;
 const original=new Map(originalInput.players.map(p=>[p.id,p]));plan.players=plan.players.map(p=>{const o=original.get(p.id);return o?{...p,pitcher:!!o.pitcher,canPitch:o.pitcher&&o.canPitch!==false,memberTeamIds:o.memberTeamIds||p.memberTeamIds}:p;});
 const used=new Set(plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live'&&s.pitcher).map(s=>s.pitcher))),missing=originalInput.players.filter(p=>p.pitcher&&p.canPitch!==false&&!used.has(p.id));
 plan.missingPitchers=missing.map(p=>p.id);plan.warnings=(plan.warnings||[]).filter(w=>!/^\d+ pitchers? have no Live pitching session:/.test(w));if(missing.length)plan.warnings.push(missing.length+' pitchers have no Live pitching session: '+missing.map(p=>p.name).join(', ')+'.');plan.requiresAcceptance=Boolean(plan.missingLive?.length||missing.length||plan.missingCatchers?.length);return plan;
}
function playerOrders(input){
 if(input.players.length<35)return [input.players];
 const upperPlayers=input.players.filter(upper),young=input.players.filter(p=>!upper(p)),base=upperPlayers.concat(young),orders=[base,upperPlayers.slice().reverse().concat(young),upperPlayers.concat(young.slice().reverse())];
 for(const shift of [3,7,11]){const u=shift%Math.max(1,upperPlayers.length),y=shift%Math.max(1,young.length);orders.push(upperPlayers.slice(u).concat(upperPlayers.slice(0,u),young.slice(y),young.slice(0,y)));}
 return orders;
}
function planQuality(plan,input){
 const byId=new Map(input.players.map(p=>[p.id,p])),live=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live'));
 let upperHit=0,youngHit=0,matched=0,upperPitch=0,youngPitch=0;
 for(const s of live){const pitcher=byId.get(s.pitcher),pa=age(pitcher);if(pa>=16)upperPitch++;else if(pa===14)youngPitch++;for(const id of s.players){const h=byId.get(id),ha=age(h);if(ha>=16)upperHit++;else if(ha===14)youngHit++;if((pa>=16&&ha>=16)||(pa===14&&ha===14))matched++;}}
 const missingUpperPitch=(plan.missingPitchers||[]).filter(id=>upper(byId.get(id))).length,missingUpperLive=(plan.missingLive||[]).filter(id=>upper(byId.get(id))).length;
 return upperHit*10000+matched*500+upperPitch*250-(missingUpperLive*12000+missingUpperPitch*6000)+(live.reduce((n,s)=>n+s.players.length,0))*20-(plan.missingLive?.length||0)*5-(plan.missingPitchers?.length||0);
}
function addPrioritySummary(plan,input){
 if(!plan||input.players.length<35)return plan;const byId=new Map(input.players.map(p=>[p.id,p])),live=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live'));let upperHit=0,youngHit=0,matched=0,mixed=0,upperPitch=0,youngPitch=0;
 for(const s of live){const pa=age(byId.get(s.pitcher));if(pa>=16)upperPitch++;else if(pa===14)youngPitch++;let stationMatched=true;for(const id of s.players){const ha=age(byId.get(id));if(ha>=16)upperHit++;else if(ha===14)youngHit++;const ok=(pa>=16&&ha>=16)||(pa===14&&ha===14);if(ok)matched++;else stationMatched=false;}if(!stationMatched)mixed++;}
 plan.warnings=[...(plan.warnings||[]),'Live priority: '+upperHit+' 16U/18U hitter slots · '+youngHit+' 14U hitter slots · '+upperPitch+' 16U/18U pitchers · '+youngPitch+' 14U pitchers · '+matched+' age-matched hitter slots'+(mixed?' · '+mixed+' mixed Live blocks used only where needed':'')+'.'];return plan;
}
function buildChecked(input){
 if(input.players.length<35)return checked(input);
 let best=null,bestQuality=-Infinity,lastError=null;
 for(const players of playerOrders(input))for(const playerCatcher of [false,true]){try{const candidateInput={...input,players};const plan=restorePitcherCoverage(checked(transformed(candidateInput,playerCatcher)),input);const errors=validatePractice(plan);if(errors.length)throw Error(errors.join('; '));const q=planQuality(plan,input);if(!best||q>bestQuality){best=plan;bestQuality=q;}}catch(error){lastError=error;}}
 if(best)return addPrioritySummary(best,input);throw lastError||Error('No valid large-practice plan found.');
}
function withBuildDiagnostics(plan,input){
 if(!plan||input.players.length<35)return plan;const live=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='live')),front=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='front')),machine=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='machine')),warm=plan.blocks.flatMap(b=>b.stations.filter(s=>s.kind==='warm'));const liveHitters=live.reduce((n,s)=>n+s.players.length,0),liveSizes=live.map(s=>s.players.length).join('/'),warmAlongsideLive=plan.blocks.filter(b=>b.stations.some(s=>s.kind==='live')&&b.stations.some(s=>s.kind==='warm')).length,livePitchers=new Set(live.map(s=>s.pitcher).filter(Boolean)).size;plan.warnings=[...(plan.warnings||[]),'Scheduler check: '+live.length+' Live blocks · '+liveHitters+' Live hitter slots · Live groups '+(liveSizes||'none')+' · '+livePitchers+' Live pitchers · '+front.length+' Front Toss stations · '+machine.length+' Machine stations · '+warm.length+' pitching warm-ups · '+warmAlongsideLive+' alongside Live.'];return plan;
}
self.onmessage=event=>{try{
 if(event.data.mode==='staffing'){const input=event.data.input,max=Math.max(1,input.coaches.length),results=[];let minimum=null,lastError='';for(let n=1;n<=max;n++){try{checked({...input,coaches:input.coaches.slice(0,n),allowReplacements:true});minimum=n;break;}catch(e){lastError=e.message;results.push({coaches:n,error:e.message});}}self.postMessage({staffing:{minimum,available:max,error:minimum?null:lastError,attempts:results}});}
 else if(event.data.mode==='recommend'){const plan=checked(event.data.input);const stationBlocks=plan.blocks.map(b=>{const hitting=b.stations.filter(s=>['drill','machine','front','live'].includes(s.kind));const hitters=hitting.reduce((n,s)=>n+s.players.length,0),total=Math.floor(hitters/3),builtIn=hitting.filter(s=>s.kind!=='drill').length;return {count:Math.max(0,total-builtIn),total,mode:hitting.some(s=>s.kind==='live')?'live':'front'};}).filter(b=>b.total);const count=Math.max(0,...stationBlocks.map(b=>b.count)),frontCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='front').map(b=>b.count)),liveCount=Math.max(0,...stationBlocks.filter(b=>b.mode==='live').map(b=>b.count)),total=Math.max(0,...stationBlocks.map(b=>b.total));self.postMessage({recommendation:{count,frontCount,liveCount,total,warnings:plan.warnings}});}
 else if(event.data.mode==='build'){try{self.postMessage({plan:withBuildDiagnostics(buildChecked({...event.data.input,allowReplacements:false}),event.data.input)});}catch(original){try{const plan=withBuildDiagnostics(buildChecked({...event.data.input,allowReplacements:true}),event.data.input);if(!plan.replacements.length)throw original;self.postMessage({replacementOffer:plan});}catch(replacement){self.postMessage({error:'Standard plan: '+original.message+' Replacement plan: '+replacement.message});}}}
 else self.postMessage({plan:checked(event.data)});
}catch(error){self.postMessage({error:error.message});}};