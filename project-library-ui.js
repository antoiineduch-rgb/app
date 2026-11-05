import {ProjectStore,MAX_SAVED_PROJECTS} from './project-library.js';
import {parseProject,serializeProject,projectName,projectFilename} from './project.js';
import {downloadFile} from './file-downloads.js';

export async function projectThumbnail(svg){
  const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width','400');copy.setAttribute('height','400');
  if(copy.querySelector('#previewHands[hidden]'))copy.querySelector('#previewHands').remove();
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'}));
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=144;canvas.getContext('2d').drawImage(image,0,0,144,144);return canvas.toDataURL('image/png');}catch{return '';}
  finally{URL.revokeObjectURL(url);}
}

export class ProjectLibrary{
  constructor({capture,onOpen,getName,isBusy,notify=()=>{}}){
    this.capture=capture;this.onOpen=onOpen;this.getName=getName;this.isBusy=isBusy;this.notify=notify;this.store=new ProjectStore();this.entries=[];this.busy=false;this.ready=false;this.generation=0;
    this.dialog=document.getElementById('projectsDialog');this.grid=document.getElementById('projectCards');this.status=document.getElementById('projectsStatus');this.search=document.getElementById('projectSearch');this.name=document.getElementById('projectSaveName');
    document.getElementById('myProjects').onclick=()=>this.open();document.getElementById('closeProjects').onclick=()=>this.close();
    document.getElementById('saveCurrentProject').onclick=()=>this.saveCurrent();document.getElementById('backupCurrentProject').onclick=()=>this.backupCurrent();document.getElementById('retryProjects').onclick=()=>this.refresh();document.getElementById('undoProjectDelete').onclick=()=>this.undoDelete();
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});this.dialog.addEventListener('close',()=>{if(!this.dialog.open)this.restoreFocus();});
    this.search.oninput=()=>this.render();this.name.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();this.saveCurrent();}};
    this.grid.onclick=event=>{const button=event.target.closest('[data-project-action]');if(!button||this.busy)return;const id=Number(button.dataset.projectId);if(button.dataset.projectAction==='open')return this.openSaved(id);if(button.dataset.projectAction==='backup')return this.backup(id);return this.remove(id);};
  }
  open(){if(this.dialog.open||this.busy)return;this.returnFocus=document.activeElement;this.name.value=projectName(this.getName());this.search.value='';this.dialog.showModal();this.refresh();}
  close(){if(!this.dialog.open)return;this.dialog.close();this.generation++;this.restoreFocus();}
  restoreFocus(){if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});}
  setBusy(value){this.busy=value;this.dialog.setAttribute('aria-busy',String(value));this.updateButtons();}
  updateButtons(){
    document.getElementById('myProjects').disabled=this.busy||this.isBusy();
    document.getElementById('saveCurrentProject').disabled=this.busy||!this.ready||this.isBusy();document.getElementById('backupCurrentProject').disabled=this.busy||this.isBusy();document.getElementById('retryProjects').disabled=this.busy;
    document.getElementById('undoProjectDelete').disabled=this.busy;for(const button of this.grid.querySelectorAll('button'))button.disabled=this.busy;
  }
  message(text,error=false){this.status.textContent=text;this.status.dataset.tone=error?'error':'success';if(!this.dialog.open)this.notify(text);}
  async refresh(){
    const generation=++this.generation;this.setBusy(true);this.message('Loading saved clocks…');
    try{const entries=await this.store.list();if(generation!==this.generation)return;this.entries=entries;this.ready=true;this.render();this.message(`${entries.length} of ${MAX_SAVED_PROJECTS} saved clocks on this device.`);document.getElementById('retryProjects').hidden=true;if(document.activeElement===document.getElementById('closeProjects'))(entries.length?this.search:this.name).focus();}
    catch(error){if(generation!==this.generation)return;this.ready=false;this.grid.replaceChildren();const empty=document.getElementById('projectLibraryEmpty');empty.hidden=false;empty.textContent='Your current design is still available. Try the library again or download a backup.';this.message(error.message,true);document.getElementById('retryProjects').hidden=false;}
    finally{if(generation===this.generation||!this.dialog.open)this.setBusy(false);}
  }
  render(){
    const query=this.search.value.trim().toLowerCase(),entries=this.entries.filter(entry=>[entry.name,entry.artworkName].join(' ').toLowerCase().includes(query));this.grid.replaceChildren();
    document.getElementById('projectLibraryEmpty').hidden=entries.length>0;document.getElementById('projectLibraryEmpty').textContent=this.entries.length?'No saved clocks match your search.':'No saved clocks yet. Save a copy above to keep its settings, SVG and filament colors together.';
    for(const entry of entries){
      const card=document.createElement('article'),preview=document.createElement('div'),body=document.createElement('div'),title=document.createElement('h3'),summary=document.createElement('p'),source=document.createElement('p'),date=document.createElement('small'),actions=document.createElement('div');card.className='saved-project';card.dataset.projectId=entry.id;preview.className='saved-project-image';
      if(entry.thumbnail){const img=document.createElement('img');img.src=entry.thumbnail;img.alt='';img.width=144;img.height=144;preview.append(img);}else preview.textContent='◷';
      title.textContent=entry.name;summary.textContent=[`${entry.diameter} mm`,entry.format,entry.stand?'Desk stand':entry.box?'Rear mount':''].filter(Boolean).join(' · ');source.textContent=entry.artworkName||'Ready-made design';source.title=source.textContent;date.textContent='Saved '+new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(entry.updatedAt));actions.className='saved-project-actions';
      for(const [action,label]of [['open','Open'],['backup','Backup'],['remove','Remove']]){const button=document.createElement('button');button.type='button';button.className='tool-button';button.dataset.projectAction=action;button.dataset.projectId=entry.id;button.textContent=label;button.setAttribute('aria-label',`${label} ${entry.name}`);actions.append(button);}
      body.append(title,summary,source,date,actions);card.append(preview,body);this.grid.append(card);
    }
    this.updateButtons();
  }
  async saveCurrent(){
    if(this.busy||!this.ready||this.isBusy())return;this.setBusy(true);const name=projectName(this.name.value);this.message(`Saving ${name}…`);
    try{const snapshot=await this.capture(true),project=parseProject(snapshot.text);project.settings.projectName=name;const row=await this.store.save(serializeProject(project.settings,project.artwork,project.orientation),snapshot.thumbnail);this.deleted=null;document.getElementById('undoProjectDelete').hidden=true;this.entries=await this.store.list();this.render();this.message(`Saved ${row.name} on this device. Editing your clock keeps this saved copy available.`);}
    catch(error){this.message(error.message,true);}finally{this.setBusy(false);}
  }
  async openSaved(id){
    if(this.busy)return;this.close();await this.onOpen(()=>this.store.get(id));
  }
  async backupCurrent(){
    if(this.busy||this.isBusy())return;this.setBusy(true);
    try{const snapshot=await this.capture(false);downloadFile(new Blob([snapshot.text],{type:'application/json'}),projectFilename(parseProject(snapshot.text).settings.projectName),'library');}
    catch(error){this.message(error.message,true);}finally{this.setBusy(false);}
  }
  async backup(id){
    this.setBusy(true);try{const text=await this.store.get(id);downloadFile(new Blob([text],{type:'application/json'}),projectFilename(parseProject(text).settings.projectName),'library');}catch(error){this.message(error.message,true);}finally{this.setBusy(false);}
  }
  async remove(id){
    this.setBusy(true);try{this.deleted=await this.store.remove(id);this.entries=await this.store.list();this.render();const undo=document.getElementById('undoProjectDelete');undo.hidden=!this.deleted;if(this.deleted)undo.setAttribute('aria-label','Undo removal of '+this.deleted.name);this.message(this.deleted?`Removed ${this.deleted.name}. Your design in the editor is still available.`:'This saved copy has already been removed.');}catch(error){this.message(error.message,true);}finally{this.setBusy(false);}
  }
  async undoDelete(){
    if(this.busy||!this.deleted)return;this.setBusy(true);
    try{const row=await this.store.save(this.deleted.text,this.deleted.thumbnail);this.deleted=null;this.entries=await this.store.list();this.render();document.getElementById('undoProjectDelete').hidden=true;this.message(`Restored ${row.name}.`);}catch(error){this.message(error.message,true);}finally{this.setBusy(false);}
  }
}
