import {parseProject,serializeProject} from './project.js';

export const MAX_SAVED_PROJECTS=20;
const MAX_THUMBNAIL=128*1024;
const validId=id=>Number.isSafeInteger(id)&&id>0;
const thumbnail=value=>value===''||typeof value==='string'&&value.length<MAX_THUMBNAIL*4/3+30&&/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value);
function storageError(error){
  if(error?.name==='QuotaExceededError')return Error('Device storage is full. Save a .clock backup or remove a saved clock before trying again.');
  return Error('Saved clocks are unavailable in this browser. Your current design is still here; you can download a .clock backup.');
}
// A fast lookup bucket, followed by an exact text comparison. A hash collision
// can never overwrite another design. This also works without Web Crypto.
function fingerprint(text){let a=2166136261,b=0x9e3779b9;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return `${text.length}:${a>>>0}:${b>>>0}`;}
function prepared(text,image){
  if(!thumbnail(image))throw Error('The project thumbnail must be a small PNG image.');
  const project=parseProject(text),canonical=serializeProject(project.settings,project.artwork,project.orientation),s=project.settings;
  return {text:canonical,fingerprint:fingerprint(canonical),meta:{name:s.projectName,thumbnail:image,diameter:s.diameter,format:s.exportFormat==='stl'?'STL':s.threeMFTarget==='bambu-a1'?'Bambu 3MF':'3MF',stand:s.deskStand,box:s.mechanismRecess,artworkName:project.artwork?.name||''}};
}
function validMetadata(row){return row&&validId(row.id)&&typeof row.name==='string'&&row.name.length<=80&&thumbnail(row.thumbnail)&&Number.isFinite(row.updatedAt)&&row.updatedAt>0&&row.updatedAt<=8.64e15&&Number.isFinite(row.diameter)&&row.diameter>=100&&row.diameter<=300&&['STL','3MF','Bambu 3MF'].includes(row.format)&&typeof row.artworkName==='string'&&row.artworkName.length<=255;}

export class ProjectStore{
  constructor(name='clock-factory-projects'){this.name=name;this.pending=null;}
  open(){
    if(this.pending)return this.pending;
    const pending=new Promise((resolve,reject)=>{
      let request,settled=false;
      try{if(!globalThis.indexedDB)throw Error();request=globalThis.indexedDB.open(this.name,1);}catch(error){reject(storageError(error));return;}
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains('projects')){const store=db.createObjectStore('projects',{keyPath:'id',autoIncrement:true});store.createIndex('fingerprint','fingerprint');}
        if(!db.objectStoreNames.contains('metadata'))db.createObjectStore('metadata',{keyPath:'id'});
      };
      request.onerror=()=>{settled=true;reject(storageError(request.error));};
      request.onblocked=()=>{settled=true;reject(Error('Close older Clock Factory windows, then try opening saved clocks again.'));};
      request.onsuccess=()=>{const db=request.result;if(settled){db.close();return;}settled=true;const release=()=>{db.close();if(this.pending===pending)this.pending=null;};db.onversionchange=release;db.onclose=()=>{if(this.pending===pending)this.pending=null;};resolve(db);};
    });
    this.pending=pending;pending.catch(()=>{if(this.pending===pending)this.pending=null;});return pending;
  }
  async transaction(mode,run){
    const db=await this.open();return new Promise((resolve,reject)=>{
      let tx,result,failure;
      try{tx=db.transaction(['projects','metadata'],mode);}catch(error){this.pending=null;reject(storageError(error));return;}
      tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure&&['QuotaExceededError','InvalidStateError','SecurityError','UnknownError','NotFoundError'].includes(failure.name)?storageError(failure):failure||storageError(tx.error));tx.onerror=()=>{};
      const abort=error=>{failure=error;try{tx.abort();}catch{reject(error);}};
      const guard=fn=>(...args)=>{try{fn(...args);}catch(error){abort(error);}};
      try{run(tx.objectStore('projects'),tx.objectStore('metadata'),value=>{result=value;},guard,abort);}catch(error){abort(error);}
    });
  }
  list(){
    // Browsing loads only small metadata and thumbnails, never every SVG.
    return this.transaction('readonly',(_projects,meta,result,guard)=>{const request=meta.getAll();request.onsuccess=guard(()=>result(request.result.filter(validMetadata).sort((a,b)=>b.updatedAt-a.updatedAt||b.id-a.id)));});
  }
  async get(id){
    if(!validId(id))throw Error('This saved clock is no longer available.');
    const row=await this.transaction('readonly',(projects,_meta,result)=>{const request=projects.get(id);request.onsuccess=()=>result(request.result);});
    if(!row||typeof row.text!=='string')throw Error('This saved clock is no longer available. Refresh the library or open its .clock backup.');
    parseProject(row.text);return row.text;
  }
  save(text,image=''){
    const entry=prepared(text,image);
    return this.transaction('readwrite',(projects,meta,result,guard,abort)=>{
      const write=(id,previous)=>{
        const row={...entry.meta,id,updatedAt:Math.max(Date.now(),(previous?.updatedAt||0)+1)};
        projects.put({id,text:entry.text,fingerprint:entry.fingerprint});meta.put(row);result(row);
      };
      const cursor=projects.index('fingerprint').openCursor(entry.fingerprint);
      cursor.onsuccess=guard(()=>{
        const match=cursor.result;
        if(match){if(match.value.text!==entry.text){match.continue();return;}const request=meta.get(match.primaryKey);request.onsuccess=guard(()=>write(match.primaryKey,request.result));return;}
        const count=meta.count();count.onsuccess=guard(()=>{
          if(count.result>=MAX_SAVED_PROJECTS){abort(Error(`Your library has ${MAX_SAVED_PROJECTS} clocks. Remove one or download a .clock backup; saved clocks are never removed automatically.`));return;}
          const request=projects.add({text:entry.text,fingerprint:entry.fingerprint});request.onsuccess=guard(()=>{const row={...entry.meta,id:request.result,updatedAt:Date.now()};meta.put(row);result(row);});
        });
      });
    });
  }
  remove(id){
    if(!validId(id))return Promise.resolve(null);
    return this.transaction('readwrite',(projects,meta,result,guard)=>{
      const request=projects.get(id);request.onsuccess=guard(()=>{const data=request.result,info=meta.get(id);info.onsuccess=guard(()=>{projects.delete(id);meta.delete(id);result(data?{text:data.text,thumbnail:thumbnail(info.result?.thumbnail)?info.result.thumbnail:'',name:info.result?.name||'clock'}:null);});});
    });
  }
}
