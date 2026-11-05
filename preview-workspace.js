// Expand the existing preview rather than creating another renderer or model.
// The placeholder preserves the page's scroll position while the dialog is open.
export class PreviewWorkspace{
  constructor({onResize=()=>{}}={}){
    this.preview=document.getElementById('preview');this.dialog=document.getElementById('previewDialog');this.button=document.getElementById('expandPreview');this.onResize=onResize;
    this.button.onclick=()=>this.open();document.getElementById('closePreview').onclick=()=>this.close();
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
    this.dialog.addEventListener('close',()=>{if(!this.dialog.open)this.restore();});
  }
  open(){
    if(this.dialog.open)return;
    this.returnFocus=document.activeElement;this.placeholder=document.createElement('div');this.placeholder.style.height=this.preview.getBoundingClientRect().height+'px';this.preview.before(this.placeholder);
    document.getElementById('expandedPreview').append(this.preview);this.button.setAttribute('aria-expanded','true');
    document.documentElement.classList.add('preview-expanded');this.dialog.showModal();this.onResize();
    (this.preview.querySelector('#meshCanvas:not([hidden]) canvas')||document.getElementById('clockStage')).focus({preventScroll:true});
  }
  close(){this.dialog.close();this.restore();}
  restore(){
    if(!this.placeholder)return;
    this.placeholder.replaceWith(this.preview);this.placeholder=null;this.button.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('preview-expanded');this.onResize();
    if(this.returnFocus?.isConnected)this.returnFocus.focus({preventScroll:true});
  }
}
