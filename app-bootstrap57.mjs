const NativeWorker=globalThis.Worker;
globalThis.Worker=new Proxy(NativeWorker,{
 construct(Target,args){
  const next=[...args];
  const url=String(next[0]??'');
  if(url.includes('worker.mjs'))next[0]=new URL('./worker.mjs?v=rpbuild32',import.meta.url);
  return Reflect.construct(Target,next);
 }
});
import('./app-rpbuild53.mjs?v=20261004-large-practice-exception58').catch(err=>{
 console.error(err);
 throw err;
});
