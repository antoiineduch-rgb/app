// Preview and download can subscribe to one build. Cancelling a preview must
// not cancel a download waiting for the same mesh, and stale jobs cannot cache.
export class MeshStore{
  constructor(limit=2){this.limit=limit;this.cache=new Map();this.pending=new Map();}
  peek(key){return this.cache.get(key)||null;}
  get(key,build,{signal,onStage=()=>{}}={}){
    if(signal?.aborted)return Promise.reject(signal.reason||new DOMException('Cancelled','AbortError'));
    if(this.cache.has(key)){const value=this.cache.get(key);this.cache.delete(key);this.cache.set(key,value);return Promise.resolve(value);}
    let job=this.pending.get(key);
    if(!job){
      job={controller:new AbortController(),listeners:new Set()};this.pending.set(key,job);
      job.promise=Promise.resolve().then(()=>build(job.controller.signal,stage=>{for(const listener of job.listeners)listener.onStage(stage);})).then(value=>{
        job.controller.signal.throwIfAborted();
        this.cache.set(key,value);while(this.cache.size>this.limit)this.cache.delete(this.cache.keys().next().value);
        return value;
      }).finally(()=>{if(this.pending.get(key)===job)this.pending.delete(key);});
      job.promise.catch(()=>{});
    }
    return new Promise((resolve,reject)=>{
      let settled=false;
      const listener={onStage};
      const clean=()=>{job.listeners.delete(listener);signal?.removeEventListener('abort',abort);};
      const finish=(error,value)=>{if(settled)return;settled=true;clean();error?reject(error):resolve(value);};
      const abort=()=>{finish(signal.reason||new DOMException('Cancelled','AbortError'));if(!job.listeners.size){job.controller.abort();if(this.pending.get(key)===job)this.pending.delete(key);}};
      job.listeners.add(listener);signal?.addEventListener('abort',abort,{once:true});
      job.promise.then(value=>finish(null,value),error=>finish(error));
    });
  }
}
