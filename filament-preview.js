import {filamentPaint,dominantArtworkColor} from './bambu-paint.js';
import {filamentColors} from './filament-colors.js';
import {usesSVGBacking} from './svg-details.js';

function analyze(painting,settings,workerURL,signal){
  return new Promise((resolve,reject)=>{
    let worker,timer,fallbackTimer,settled=false,fallingBack=false;
    const finish=(error,result)=>{
      if(settled)return;settled=true;clearTimeout(timer);clearTimeout(fallbackTimer);worker?.terminate();signal.removeEventListener('abort',abort);
      if(error)reject(error);else resolve(result);
    };
    const abort=()=>finish(new DOMException('Color preview cancelled','AbortError'));
    const fallback=()=>{
      if(settled||fallingBack)return;fallingBack=true;clearTimeout(timer);worker?.terminate();
      fallbackTimer=setTimeout(()=>{try{
        signal.throwIfAborted();
        const base=settings.bambuBackColor==='background'?dominantArtworkColor(painting,settings.faceColor):settings.faceColor;
        const {palette,map,width}=filamentPaint(painting,base,settings.filamentCount);finish(null,{palette,map,width});
      }catch(error){finish(error);}},0);
    };
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
    try{
      worker=new Worker(workerURL,{name:'clock-filament-preview'});
      worker.onmessage=({data})=>{if(data.id===2)finish(data.error?new Error(data.error):null,data);};
      worker.onerror=event=>{event.preventDefault();fallback();};
      const rgba=painting.rgba.slice();
      worker.postMessage({id:2,operation:'filament-proof',settings,artwork:{painting:{...painting,rgba}}},[rgba.buffer]);
      timer=setTimeout(fallback,60000);
    }catch{fallback();}
  });
}

// This preview uses the export's raster and palette algorithm, without building
// a mesh. Recoloring only changes filament assignments, so it reuses analysis.
export class FilamentPreview{
  constructor({workerURL,prepareRaster,onColorChange,onReset}){
    this.workerURL=workerURL;this.prepareRaster=prepareRaster;this.onColorChange=onColorChange;
    this.root=document.getElementById('filamentPreview');this.body=document.getElementById('filamentProofBody');
    this.status=document.getElementById('filamentProofStatus');this.canvas=document.getElementById('filamentProofCanvas');
    this.editors=document.getElementById('filamentEditors');this.reset=document.getElementById('resetFilamentColors');this.retry=document.getElementById('filamentProofRetry');
    this.mode='print';
    for(const [id,mode]of [['proofOriginal','original'],['proofPrinted','print']])document.getElementById(id).onclick=()=>{this.mode=mode;this.draw();};
    this.editors.addEventListener('input',event=>{if(event.target.matches('input[type="color"]'))onColorChange(event.target.dataset.source,event.target.value,false);});
    this.editors.addEventListener('change',event=>{if(event.target.matches('input[type="color"]'))onColorChange(event.target.dataset.source,event.target.value,true);});
    this.reset.onclick=onReset;this.retry.onclick=()=>{this.cached=null;this.update(this.current);};
  }
  cancel(){clearTimeout(this.timer);this.controller?.abort();this.controller=null;this.jobKey=null;}
  dispose(){this.cancel();this.cached=null;}
  update(current){
    this.current=current;this.root.hidden=!current.enabled;
    if(!current.enabled){this.cancel();return;}
    if(current.busy){this.cancel();this.loading('Opening your artwork…');return;}
    if(this.cached?.key===current.key){if(this.jobKey&&this.jobKey!==current.key)this.cancel();this.draw();return;}
    if(this.jobKey===current.key)return;
    this.cancel();this.jobKey=current.key;this.loading('Preparing your printable colors…');
    const controller=new AbortController();this.controller=controller;
    this.timer=setTimeout(()=>this.build(current,controller),250);
  }
  loading(message){
    this.root.dataset.ready='false';this.root.setAttribute('aria-busy','true');this.body.hidden=true;this.status.textContent=message;this.retry.hidden=true;this.reset.disabled=true;
  }
  async build(current,controller){
    try{
      controller.signal.throwIfAborted();
      const painting=this.prepareRaster(current.snapshot),paint=await analyze(painting,current.snapshot.settings,this.workerURL,controller.signal);
      controller.signal.throwIfAborted();
      if(this.current.key!==current.key||!this.current.enabled||this.current.busy)return;
      this.cached={key:current.key,painting,paint};this.draw();
    }catch(error){
      if(error.name!=='AbortError'&&this.current.key===current.key){this.status.textContent='Color preview unavailable. You can still export, or try the preview again.';this.retry.hidden=false;}
    }finally{
      if(this.controller===controller){this.controller=null;this.jobKey=null;this.root.setAttribute('aria-busy','false');}
    }
  }
  draw(){
    if(!this.cached||!this.current?.enabled||this.cached.key!==this.current.key||this.current.busy)return;
    const {painting,paint}=this.cached,{overrides,snapshot}=this.current;
    const displayKey=JSON.stringify([this.cached.key,overrides,this.mode,snapshot.settings.hole]);
    if(this.displayKey===displayKey&&this.root.dataset.ready==='true')return;
    this.displayKey=displayKey;
    const mapped=filamentColors(paint.palette,overrides),merged=paint.palette.length-mapped.palette.length;
    this.root.dataset.ready='true';this.root.setAttribute('aria-busy','false');this.body.hidden=false;this.retry.hidden=true;
    this.status.textContent=`${mapped.palette.length} printable filament${mapped.palette.length===1?'':'s'}${merged?` · ${merged} matching color${merged===1?'':'s'} merged`:''}.`;
    this.reset.disabled=!Object.keys(overrides).length;
    document.getElementById('proofOriginal').setAttribute('aria-pressed',String(this.mode==='original'));
    document.getElementById('proofPrinted').setAttribute('aria-pressed',String(this.mode==='print'));
    this.canvas.setAttribute('aria-label',this.mode==='original'?'Original artwork colors, front view':'Printable filament colors, front view');
    const signature=paint.palette.join(',');
    if(this.signature!==signature){
      this.signature=signature;this.editors.replaceChildren();
      paint.palette.forEach((source,i)=>{
        const row=document.createElement('div'),label=document.createElement('label'),dot=document.createElement('i'),text=document.createElement('span'),small=document.createElement('small'),input=document.createElement('input'),value=document.createElement('span');
        row.className='filament-editor';dot.style.background=source;text.textContent=i?'Artwork region '+(i+1):'Back & face';small.textContent=source;text.append(small);label.append(dot,text);
        input.type='color';input.id='filamentColor'+i;input.dataset.source=source;input.setAttribute('aria-label',`Filament color for ${source}`);label.htmlFor=input.id;
        value.className='filament-color-value';row.append(label,input,value);this.editors.append(row);
      });
    }
    [...this.editors.children].forEach((row,i)=>{
      const input=row.querySelector('input');if(input.value.toUpperCase()!==mapped.colors[i])input.value=mapped.colors[i];
      row.querySelector('.filament-color-value').textContent=`${mapped.indices[i]+1} · ${mapped.colors[i]}`;
    });
    const n=painting.width,size=this.canvas.width,context=this.canvas.getContext('2d'),image=context.createImageData(size,size),{frame,rgba}=painting;
    const span=snapshot.settings.diameter/frame.scale*1.08,palette=mapped.palette.map(color=>[1,3,5].map(at=>parseInt(color.slice(at,at+2),16)));
    const radius=snapshot.settings.hole/2/frame.scale,backed=usesSVGBacking(snapshot.settings),backRadius=snapshot.settings.diameter/2/frame.scale;
    const originalBase=[1,3,5].map(at=>parseInt(paint.palette[0].slice(at,at+2),16));
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const px=frame.cx+((x+.5)/size-.5)*span,py=frame.cy+((y+.5)/size-.5)*span;
      const distance=(px-frame.cx)**2+(py-frame.cy)**2,target=(y*size+x)*4;
      if(distance<radius**2||(backed&&distance>backRadius**2))continue;
      if(backed){image.data.set(this.mode==='original'?originalBase:palette[0],target);image.data[target+3]=255;}
      if(px<0||py<0||px>=n||py>=n)continue;
      const pixel=Math.floor(py)*n+Math.floor(px),source=pixel*4;
      if(this.mode==='original'){
        if(backed){const alpha=rgba[source+3]/255;for(let k=0;k<3;k++)image.data[target+k]=rgba[source+k]*alpha+originalBase[k]*(1-alpha);}
        else image.data.set(rgba.subarray(source,source+4),target);
      }
      else if(rgba[source+3]>=128){image.data.set(palette[mapped.indices[paint.map[pixel]]],target);image.data[target+3]=255;}
    }
    context.putImageData(image,0,0);
  }
}
