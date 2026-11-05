import {SVG_IMPORT_MAX_BYTES} from './svg-import.js';
import {MAX_PROJECT_BYTES} from './project.js';

const svgText=text=>/^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE\s+svg[^>]*>)*<svg(?:\s|>)/i.test(text.slice(0,4096));
const editing=target=>target instanceof Element&&target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');

export class ImportWorkflow{
  constructor({onSVG,onProject,isBusy,notify,svgError}){
    Object.assign(this,{onSVG,onProject,isBusy,notify,svgError});this.depth=0;this.pasting=false;
    const $=id=>document.getElementById(id);
    this.overlay=$('fileDropOverlay');this.hint=$('fileDropHint');this.status=$('quickImportStatus');this.dialog=$('pasteSvgDialog');this.source=$('pasteSvgSource');this.error=$('pasteSvgStatus');this.use=$('usePastedSvg');
    $('pasteSvg').onclick=()=>this.openPaste();$('closePasteSvg').onclick=()=>this.closePaste();this.use.onclick=()=>this.usePaste();
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.closePaste();});
    this.dialog.addEventListener('close',()=>{if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});});
    this.source.addEventListener('input',()=>{this.error.textContent='';this.error.removeAttribute('data-tone');});
    this.source.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();this.usePaste();}});
    document.addEventListener('dragenter',event=>{if(this.fileDrag(event)){this.depth++;this.showDrop();}});
    document.addEventListener('dragover',event=>{if(this.fileDrag(event)){event.preventDefault();event.dataTransfer.dropEffect=this.blocked()?'none':'copy';this.showDrop();}});
    document.addEventListener('dragleave',event=>{if(this.depth&&--this.depth===0)this.hideDrop();});
    document.addEventListener('drop',event=>{if(!this.fileDrag(event))return;event.preventDefault();this.hideDrop();this.files([...event.dataTransfer.files],event.dataTransfer.items);});
    document.addEventListener('dragend',()=>this.hideDrop());window.addEventListener('blur',()=>this.hideDrop());window.addEventListener('pagehide',()=>this.hideDrop());
    document.addEventListener('keydown',event=>{if(event.key==='Escape')this.hideDrop();});
    document.addEventListener('paste',event=>{
      if(event.defaultPrevented||editing(event.target)||this.blocked())return;
      const data=event.clipboardData;if(!data)return;
      const text=data.getData('image/svg+xml')||data.getData('text/plain');
      if(svgText(text)){event.preventDefault();this.files([new File([text],'Pasted artwork.svg',{type:'image/svg+xml'})]);return;}
      if(data.files.length){event.preventDefault();this.files([...data.files],data.items);}
    });
  }
  fileDrag(event){return !!event.dataTransfer&&([...event.dataTransfer.types].includes('Files')||event.dataTransfer.files.length>0);}
  blocked(){return this.isBusy()||!!document.querySelector('dialog[open]');}
  showDrop(){
    const modal=document.querySelector('dialog[open]'),parent=modal||document.body;if(this.overlay.parentElement!==parent)parent.append(this.overlay);
    const blocked=this.blocked();this.overlay.dataset.blocked=String(blocked);this.hint.textContent=blocked?'Close this panel or wait for the current operation, then try again.':'One SVG · up to 5 MB, or one .clock project · up to 12 MB';this.overlay.hidden=false;
  }
  hideDrop(){this.depth=0;this.overlay.hidden=true;}
  report(message){this.status.textContent=message;this.status.hidden=false;this.notify(message);}
  async files(files,items=[]){
    if(this.blocked()){this.report('Close this panel or wait for the current operation before importing.');return;}
    if([...items].some(item=>item.kind==='file'&&item.webkitGetAsEntry?.()?.isDirectory)){this.report('Choose a single SVG or .clock file instead of a folder.');return;}
    if(files.length!==1){this.report('Import one file at a time. Choose one SVG or one .clock project.');return;}
    const file=files[0],svg=/\.svg$/i.test(file.name)||file.type==='image/svg+xml',project=/\.clock$/i.test(file.name);
    if(!svg&&!project){this.report('This file type is not supported. Import an SVG or a saved .clock project.');return;}
    if(file.size>(project?MAX_PROJECT_BYTES:SVG_IMPORT_MAX_BYTES)){this.report(project?'Choose a .clock project smaller than 12 MB.':'Choose an SVG smaller than 5 MB.');return;}
    this.status.hidden=true;return project?this.onProject(file):this.onSVG(file);
  }
  openPaste(){
    if(this.pasting||this.blocked()){this.notify('Finish the current panel or operation, then paste your SVG.');return;}
    this.returnFocus=document.activeElement;this.error.textContent='';this.error.removeAttribute('data-tone');this.dialog.showModal();this.source.focus();
  }
  closePaste(){if(this.dialog.open)this.dialog.close();}
  async usePaste(){
    if(this.pasting||!this.dialog.open)return;
    const text=this.source.value,file=new File([text],'Pasted artwork.svg',{type:'image/svg+xml'});
    if(!text.trim()||!svgText(text)||file.size>SVG_IMPORT_MAX_BYTES){this.error.textContent=file.size>SVG_IMPORT_MAX_BYTES?'Choose SVG code smaller than 5 MB.':'Paste SVG code starting with <svg, then choose Use this SVG.';this.error.dataset.tone='error';this.source.focus();return;}
    this.pasting=true;this.use.disabled=true;this.error.textContent='Opening your SVG…';this.error.removeAttribute('data-tone');
    try{const opened=await this.onSVG(file);if(opened){this.source.value='';this.closePaste();}else if(this.dialog.open){this.error.textContent=this.svgError()||'The import was cancelled. You can edit the SVG code and try again.';this.error.dataset.tone='error';}}
    catch(error){this.error.textContent=error.message;this.error.dataset.tone='error';}
    finally{this.pasting=false;this.use.disabled=false;}
  }
}
