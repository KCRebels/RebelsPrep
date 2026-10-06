export function portalAssignments(plan, person, role) {
 const people=new Map([...plan.players,...plan.coaches].map(p=>[p.id,p.name]));
 return plan.blocks.map(block=>({number:block.number,start:block.start,end:block.end,stations:block.stations.filter(s=>role==='coach'?s.coach===person.id:[...s.players,s.pitcher,s.catcher].includes(person.id)).map(s=>({drill:s.drill,resource:s.resource,drillId:s.drillId||null,equipment:s.equipment||'',kind:s.kind||'',duty:s.pitcher===person.id?'Pitching':s.catcher===person.id?'Catching':s.coach===person.id?(s.kind==='live'?'Live':s.kind==='machine'?'Machine':s.kind==='front'?'Front Toss':s.kind==='warm'?'Pitching Warm Up':'Coaching'):s.kind==='warm'?'Pitching Warm Up':s.kind==='opening'?'Warm Up':'Hitting',pitcher:s.pitcher?people.get(s.pitcher)||'': '',catcher:s.catcher?people.get(s.catcher)||'':'',players:(s.players||[]).map(id=>people.get(id)||'').filter(Boolean)})),coaching:role==='coach'&&block.coaching.includes(person.id)}));
}
export function clockState(clock,now=Date.now()) {
 if(!clock)return null;
 const c={...clock};
 if(c.running&&!c.done){while(now>=c.end&&!c.done){if(c.phase==='work'){c.phase=c.index===c.blocks-1?'wrap':'rotate';c.end+=60000+(c.phase==='wrap'?c.extraMinutes*60000:0);}else if(c.index+1<c.blocks){c.index++;c.phase='work';c.end+=(c.blockMinutes-1)*60000;}else{c.done=true;c.running=false;c.remaining=0;}}}
 if(c.running&&!c.done)c.remaining=Math.max(0,c.end-now);
 return c;
}
export function changeClock(clock,action,now=Date.now()) {
 const c=clockState(clock,now);if(!c)throw Error('No active practice.');
 if(action==='done')return {...c,done:true,running:false,remaining:0};
 if(c.done)throw Error('This practice has finished. Activate a new practice.');
 if(action==='start'){if(!c.started){c.started=true;c.running=true;c.end=now+c.remaining;}else if(!c.running){c.running=true;c.end=now+c.remaining;}}
 else if(action==='pause'){c.running=false;}
 else if(action==='skip'){if(!c.started)throw Error('Start the practice before skipping.');if(c.phase!=='work')throw Error('Already rotating.');c.phase=c.index===c.blocks-1?'wrap':'rotate';c.remaining=60000+(c.phase==='wrap'?c.extraMinutes*60000:0);c.end=now+c.remaining;c.running=true;c.started=true;}
 else throw Error('Unknown clock action.');
 return c;
}
export function newClock(plan){return {index:0,phase:'work',running:false,started:false,done:false,end:0,remaining:(plan.blockMinutes-1)*60000,blocks:plan.blocks.length,blockMinutes:plan.blockMinutes,extraMinutes:plan.durationMinutes%plan.blockMinutes};}
export function portalURL(base,token){const u=new URL(base);u.search='';u.hash='portal='+token;return u.href;}
