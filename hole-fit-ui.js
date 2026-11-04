import {fitTestPlan,makeFitTestSTL} from './hole-fit.js';

const paths=polygons=>polygons.map(polygon=>polygon.map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('')+'Z').join('')).join('');
function buildStrip(center,workerURL,signal){
  return new Promise((resolve,reject)=>{
    let worker,timer,fallbackTimer,settled=false,fallingBack=false;
    const finish=(error,buffer)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(fallbackTimer);worker?.terminate();signal.removeEventListener('abort',abort);if(error)reject(error);else resolve(buffer);};
    const abort=()=>finish(new DOMException('Fit test cancelled','AbortError'));
    const fallback=()=>{if(settled||fallingBack)return;fallingBack=true;clearTimeout(timer);worker?.terminate();fallbackTimer=setTimeout(()=>{try{signal.throwIfAborted();finish(null,makeFitTestSTL(center));}catch(error){finish(error);}},0);};
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
    try{
      worker=new Worker(workerURL,{name:'clock-fit-test'});worker.onmessage=({data})=>{if(data.id===3)finish(data.error?new Error(data.error):null,data.buffer);};worker.onerror=event=>{event.preventDefault();fallback();};
      worker.postMessage({id:3,operation:'fit-test',center});timer=setTimeout(fallback,60000);
    }catch{fallback();}
  });
}

export class HoleFitDialog{
  constructor({workerURL,getHole,isBusy,getHeight,onSelect}){
    this.workerURL=workerURL;this.getHole=getHole;this.isBusy=isBusy;this.getHeight=getHeight;this.onSelect=onSelect;
    this.dialog=document.getElementById('fitTestDialog');this.openButton=document.getElementById('showFitTest');this.downloadButton=document.getElementById('downloadFitTest');this.newButton=document.getElementById('newFitTest');this.choices=document.getElementById('fitTestChoices');this.status=document.getElementById('fitTestStatus');
    this.openButton.onclick=()=>{
      if(isBusy())return;
      this.controller?.abort();
      if(!this.plan||!this.prepared)this.setPlan(getHole());
      this.dialog.showModal();this.update();
    };
    document.getElementById('closeFitTest').onclick=()=>{this.controller?.abort();this.dialog.close();};
    this.dialog.addEventListener('cancel',()=>this.controller?.abort());
    this.dialog.addEventListener('close',()=>{if(!this.dialog.open)this.controller?.abort();});
    this.newButton.onclick=()=>{if(!this.pending&&!isBusy())this.setPlan(getHole());};
    this.downloadButton.onclick=()=>this.download();
    document.getElementById('cancelFitTest').onclick=()=>this.controller?.abort();
  }
  setPlan(center){
    this.plan=fitTestPlan(center);this.buffer=null;this.prepared=false;
    const plan=this.plan,svg=document.getElementById('fitTestPreview');
    svg.setAttribute('viewBox',`${-plan.width/2-2} ${-plan.depth/2-2} ${plan.width+4} ${plan.depth+4}`);
    svg.setAttribute('aria-label','Fit strip with holes '+plan.sizes.map(value=>value.toFixed(1)).join(', ')+' millimeters');
    svg.innerHTML=`<g transform="scale(1 -1)"><path d="${paths(plan.base)}" fill="#dde5d3" fill-rule="evenodd" stroke="#91a77b" stroke-width="0.15"/>${plan.labels.map(label=>`<path d="${paths(label.polygons)}" fill="#3b5531" fill-rule="evenodd"/>`).join('')}</g>`;
    document.getElementById('fitTestDimensions').textContent=`${plan.width} × ${plan.depth} mm · 2 mm base + 0.6 mm raised labels`;
    this.choices.replaceChildren(...plan.sizes.map(size=>{
      const button=document.createElement('button'),value=document.createElement('strong'),unit=document.createElement('small');button.type='button';button.dataset.hole=String(size);button.setAttribute('aria-label',`Use ${size.toFixed(1)} mm center hole`);value.textContent=size.toFixed(1);unit.textContent='mm';button.append(value,unit);
      button.onclick=()=>{if(this.pending||this.isBusy())return;this.onSelect(size);this.status.textContent=`Clock center hole set to ${size.toFixed(1)} mm. This strip keeps its printed sizes.`;this.update();};return button;
    }));
    this.status.textContent='Print the strip, try your movement shaft, then choose the matching size below.';this.update();
  }
  update(){
    const busy=this.isBusy();this.openButton.disabled=busy;
    if(!this.plan)return;
    const hole=this.getHole(),height=this.getHeight();
    document.getElementById('fitTestCenter').textContent=`Test centered on ${this.plan.center.toFixed(1)} mm`;
    document.getElementById('fitTestCurrent').textContent=`Clock hole: ${hole.toFixed(1)} mm`;
    document.getElementById('fitTestClockHeight').textContent=`${height.measured?'Measured model height:':'Model height: up to'} ${Number(height.value.toFixed(1))} mm`;
    this.newButton.hidden=hole===this.plan.center;this.newButton.textContent=`New test around ${hole.toFixed(1)} mm`;this.newButton.disabled=busy||!!this.pending;
    this.downloadButton.disabled=busy||!!this.pending;this.downloadButton.textContent=this.pending?'Preparing fit test…':this.prepared?'Download this strip again':'Download fit test STL';
    document.getElementById('cancelFitTest').hidden=!this.pending;
    for(const button of this.choices.children){button.disabled=busy||!!this.pending;button.setAttribute('aria-pressed',String(Number(button.dataset.hole)===hole));}
    this.dialog.setAttribute('aria-busy',String(!!this.pending));
  }
  async download(){
    if(this.pending||this.isBusy()||!this.plan)return;
    const controller=new AbortController(),center=this.plan.center;this.controller=controller;this.pending=true;this.update();this.status.textContent='Preparing the labeled test strip…';
    try{
      const buffer=this.buffer||await buildStrip(center,this.workerURL,controller.signal);controller.signal.throwIfAborted();
      if(!this.dialog.open)return;
      this.buffer=buffer;this.prepared=true;
      const url=URL.createObjectURL(new Blob([buffer],{type:'model/stl'})),link=document.createElement('a');link.href=url;link.download=`clock-factory-fit-test-${center.toFixed(1)}mm.stl`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      this.status.textContent='Your test file is ready. Print it flat with the same material and slicer settings as your clock, then select the best-fitting size.';
    }catch(error){this.status.textContent=error.name==='AbortError'?'Fit test cancelled. You can prepare it again.':'Could not prepare the fit test: '+error.message;}
    finally{if(this.controller===controller){this.controller=null;this.pending=false;this.update();}}
  }
  dispose(){this.controller?.abort();this.buffer=null;}
}
