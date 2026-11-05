const retryable=new Set(['cancelled','interrupted','unknown']);
const terminal=new Set(['completed',...retryable]);

export function fileSaveMessage({state,filename}){
  if(state==='choosing')return `Choose where to save ${filename}.`;
  if(state==='saving')return `Saving ${filename}…`;
  if(state==='completed')return `Saved ${filename}.`;
  if(state==='cancelled')return `Save cancelled. ${filename} is still ready.`;
  if(state==='interrupted')return `Could not save ${filename}. Your prepared file is still available.`;
  if(state==='unknown')return `The save could not be confirmed. You can try saving ${filename} again.`;
  return `Download started: ${filename}. Check your browser’s downloads for the save location.`;
}

function triggerDownload(url,filename){
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.append(link);try{link.click();}finally{link.remove();}
}

// Keep the latest prepared file for a retry. Earlier native saves can complete
// independently, but must never overwrite feedback for a newer download.
export class FileDownloads{
  constructor({desktop=null,onChange=()=>{},createURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),trigger=triggerDownload}={}){
    this.desktop=typeof desktop?.onDownload==='function'?desktop:null;this.onChange=onChange;this.createURL=createURL;this.revokeURL=revokeURL;this.trigger=trigger;
    this.jobs=new Map();this.latest=null;this.unsubscribe=this.desktop?.onDownload(event=>this.receive(event));
  }
  save(blob,filename,kind='print'){
    const job={blob,filename,kind,url:this.createURL(blob)};this.latest=job;this.jobs.set(job.url,job);
    // Native dialogs may stay open for a while. Release orphaned URLs if the
    // desktop process never returns a receipt; never claim that they were saved.
    job.timer=setTimeout(()=>this.finish(job,this.desktop?'unknown':null),this.desktop?600000:10000);job.timer.unref?.();
    this.publish(job,this.desktop?'choosing':'started');
    try{this.trigger(job.url,filename);}catch{this.finish(job,'interrupted');}
  }
  publish(job,state,filename=job.filename){
    job.state=state;
    if(job===this.latest)this.onChange({state,filename,kind:job.kind,canRetry:retryable.has(state)});
  }
  receive(event){
    const job=this.jobs.get(event?.url);if(!job||!['choosing','saving',...terminal].includes(event.state))return;
    const filename=typeof event.filename==='string'&&event.filename?event.filename:job.filename;
    if(terminal.has(event.state))this.finish(job,event.state,filename);else this.publish(job,event.state,filename);
  }
  finish(job,state,filename){
    if(!this.jobs.delete(job.url))return;
    clearTimeout(job.timer);this.revokeURL(job.url);if(state===null||state==='completed')job.blob=null;if(state)this.publish(job,state,filename);
  }
  retry(){if(this.latest&&retryable.has(this.latest.state))this.save(this.latest.blob,this.latest.filename,this.latest.kind);}
  dispose(){this.unsubscribe?.();for(const job of this.jobs.values()){clearTimeout(job.timer);this.revokeURL(job.url);}this.jobs.clear();this.latest=null;}
}

let files=null;
export function downloadFile(blob,filename,kind='print'){
  if(!files){
    files=new FileDownloads({desktop:globalThis.clockDesktop,onChange:status=>{
      for(const root of document.querySelectorAll('[data-file-feedback]')){
        root.hidden=root.dataset.fileFeedback!==status.kind;
        if(root.hidden)continue;
        root.dataset.state=status.state;root.dataset.filename=status.filename;
        root.querySelector('span').textContent=fileSaveMessage(status);
        const retry=root.querySelector('button');retry.hidden=!status.canRetry;retry.onclick=()=>files.retry();
      }
    }});
    window.addEventListener('pagehide',()=>{files?.dispose();files=null;},{once:true});
  }
  files.save(blob,filename,kind);
}
