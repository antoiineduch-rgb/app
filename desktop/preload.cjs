const {contextBridge,ipcRenderer}=require('electron');

// Read-only receipts for this window's downloads. No filesystem or arbitrary
// IPC access is exposed to the editor.
contextBridge.exposeInMainWorld('clockDesktop',{
  onDownload(callback){
    if(typeof callback!=='function')throw new TypeError('A download listener is required.');
    const listener=(_event,{url,state,filename})=>callback({url,state,filename});
    ipcRenderer.on('clock:download',listener);
    return ()=>ipcRenderer.removeListener('clock:download',listener);
  }
});
