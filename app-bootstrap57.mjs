const NativeWorker=globalThis.Worker;
globalThis.Worker=new Proxy(NativeWorker,{
 construct(Target,args){
  const next=[...args];
  if(typeof next[0]==='string'&&next[0].startsWith('./worker.mjs'))next[0]='./worker.mjs?v=rpbuild33';
  return Reflect.construct(Target,next);
 }
});
await import('./app-rpbuild53.mjs?v=20261004-large-practice-exception59');
