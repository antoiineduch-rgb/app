import { designs,shapePath,makeSTL } from './geometry.js';
import { prepareSVG } from './svg-import.js';
const $=id=>document.getElementById(id);
const colors=[['Terracotta','#c47f62'],['Oat milk','#dfd5bd'],['Sage','#94a18a'],['Forest','#485c48'],['Ink','#434643'],['Lavender','#aaa0b5'],['Dusty rose','#c99d99']];
const initial={design:'petal',color:0,texture:'ripple',diameter:200,thickness:3,hole:8,markers:true};
let state={...initial};
try{
  const saved=JSON.parse(localStorage.getItem('clock-factory')||'null');
  if(saved&&designs.some(d=>d.id===saved.design)&&Number.isInteger(saved.color)&&colors[saved.color]&&['smooth','ripple','grain'].includes(saved.texture)){
    state={design:saved.design,color:saved.color,texture:saved.texture,markers:typeof saved.markers==='boolean'?saved.markers:true};
    for(const [key,min,max,step]of[['diameter',100,300,10],['thickness',2,10,.5],['hole',5,15,.5]]){
      const value=Number(saved[key]);state[key]=Number.isFinite(value)?Math.min(max,Math.max(min,Math.round(value/step)*step)):initial[key];
    }
  }
}catch{}
let customSVG=null,customImage=null,customRevision=0,importSequence=0,importPending=false,zoom=1,rx=12,ry=-19,rz=-7;
const outlines=new Map(designs.map(d=>[d.id,shapePath(d.id)]));
const workerURL=new URL('./export-worker.js',document.currentScript?.src||location.href);
let toastTimer,saveTimer,previewKey='',exportCache=null,lastDownloadKey=null,exportController=null;
function geometryKey(settings=state){return JSON.stringify([settings.design,settings.design==='custom'?customRevision:null,settings.diameter,settings.thickness,settings.hole,settings.texture,settings.markers]);}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function flushSave(){clearTimeout(saveTimer);try{localStorage.setItem('clock-factory',JSON.stringify({...state,design:state.design==='custom'?'petal':state.design}));}catch{document.querySelector('.local-status').textContent='Session only';}}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,200);}
window.addEventListener('pagehide',flushSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();});
function faceMarkup(){return customSVG&&state.design==='custom'?customSVG:`<path d="${outlines.get(state.design)}"/>`;}
function render({forceInputs=false}={}){
  const color=colors[state.color][1];
  const nextPreviewKey=JSON.stringify([state.design,state.color,state.texture,state.markers,customRevision]);
  if(nextPreviewKey!==previewKey){
  let ticks='';
  if(state.markers)for(let i=0;i<12;i++)ticks+=`<rect x="197.5" y="76" width="5" height="${i%3===0?17:10}" rx="2" transform="rotate(${i*30} 200 200)" fill="#f5e5cd" opacity=".9"/>`;
  $('clockSvg').innerHTML=`<defs><mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><g fill="white" stroke="none">${faceMarkup()}</g></mask><pattern id="ridges" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M-4 4L4 12M4 -4L12 4" stroke="#402e21" opacity=".12" stroke-width=".8"/><path d="M8 0L0 8" stroke="#fff" opacity=".14" stroke-width=".7"/></pattern><radialGradient id="light" cx="30%" cy="20%" r="90%"><stop stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#24190d" stop-opacity=".13"/></radialGradient></defs><g mask="url(#faceMask)"><rect width="400" height="400" fill="${color}"/>${state.texture==='ripple'?Array.from({length:44},(_,i)=>`<circle cx="200" cy="200" r="${12+i*4}" fill="none" stroke="${i%2?'#fff0da':'#774832'}" stroke-opacity="${i%2?'.18':'.23'}" stroke-width=".8"/>`).join(''):state.texture==='grain'?'<rect width="400" height="400" fill="url(#ridges)"/>':''}<rect width="400" height="400" fill="url(#light)"/>${ticks}</g><g style="filter:drop-shadow(1px 3px 2px #0003)"><path d="M197 206L193 142Q193 138 197 138L202 138L204 206Z" transform="rotate(-59 200 200)" fill="#f4ebd7"/><path d="M197 212L197 102Q197 98 200 98Q203 98 203 102L203 212Z" transform="rotate(49 200 200)" fill="#f4ebd7"/><circle cx="200" cy="200" r="8" fill="#e6ce9d"/><circle cx="200" cy="200" r="3" fill="#c1a46e"/></g>`;
  previewKey=nextPreviewKey;
  }
  document.querySelectorAll('.design-card').forEach(b=>{b.classList.toggle('selected',b.dataset.design===state.design);b.setAttribute('aria-pressed',b.dataset.design===state.design);});
  document.querySelectorAll('.swatch').forEach((b,i)=>{b.classList.toggle('selected',i===state.color);b.setAttribute('aria-pressed',i===state.color);});
  document.querySelectorAll('[data-texture]').forEach(b=>{b.classList.toggle('selected',b.dataset.texture===state.texture);b.setAttribute('aria-pressed',b.dataset.texture===state.texture);});
  ['diameter','thickness','hole','markers'].forEach(id=>{
    const input=$(id);
    if(id==='markers')input.checked=state[id];
    else if(forceInputs||id==='diameter'||(document.activeElement!==input&&!input.dataset.editing))input.value=state[id];
  });
  $('diameterValue').textContent=state.diameter;$('diameter').setAttribute('aria-valuetext',`${state.diameter/10} centimeters across`);$('colorName').textContent=colors[state.color][0];$('measure').textContent=state.diameter+' mm';
  $('exportSize').textContent=`${state.diameter} mm across · ${state.thickness} mm thick`;
  $('sizeHint').textContent=`${state.diameter/10} cm across — ${state.diameter<=160?'a compact clock for a shelf or desk.':state.diameter<=220?'a lovely size for a desk or small wall.':'a statement piece for your wall. Check your printer’s bed size.'}`;
  document.querySelectorAll('[data-size]').forEach(b=>{const active=Number(b.dataset.size)===state.diameter;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
  $('downloadGuide').hidden=lastDownloadKey!==geometryKey();
  const d=designs.find(d=>d.id===state.design);
  $('designTitle').innerHTML=d?`The ${d.name} Clock <span>↗</span>`:'Your Custom Clock <span>↗</span>';
  $('designDescription').textContent=d?.description||'Your own shape. Your own sense of time.';
  $('clockObject').style.filter=`drop-shadow(3px ${Math.round(state.thickness*1.5)}px 0 ${color} ) drop-shadow(9px 19px 12px #726b4f30)`;
  persist();
}
designs.forEach(d=>{const b=document.createElement('button');b.className='design-card';b.dataset.design=d.id;b.innerHTML=`<svg viewBox="0 0 400 400" aria-hidden="true"><path d="${outlines.get(d.id)}" fill="${d.id==='petal'?'#bf977b':'#c5c9b6'}"/><path d="M200 130V200L245 227" fill="none" stroke="#f7f5e9" stroke-width="10" stroke-linecap="round"/></svg>${d.name}`;b.onclick=()=>{state.design=d.id;render();};$('designGrid').append(b);});
colors.forEach(([name,color],i)=>{const b=document.createElement('button');b.className='swatch';b.style.background=color;b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>{state.color=i;render();};$('swatches').append(b);});
document.querySelectorAll('[data-texture]').forEach(b=>b.onclick=()=>{state.texture=b.dataset.texture;render();});
function validateDimensions(focus=false){
  const invalid=['thickness','hole'].map($).find(input=>input.value===''||!input.validity.valid);
  for(const id of ['thickness','hole'])$(id).setAttribute('aria-invalid',String($(id).value===''||!$(id).validity.valid));
  $('dimensionError').hidden=!invalid;
  if(invalid){
    $('dimensionError').textContent=`Enter ${invalid.id==='hole'?'a center hole from 5 to 15':'a face thickness from 2 to 10'} mm, in steps of 0.5 mm.`;
    if(focus){document.querySelector('.advanced-settings').open=true;invalid.focus();}
  }
  return !invalid;
}
['diameter','thickness','hole','markers'].forEach(id=>$(id).addEventListener('input',()=>{
  const input=$(id);
  if(id==='markers')state[id]=input.checked;
  else{
    if(id!=='diameter')input.dataset.editing='true';
    if(!input.validity.valid||input.value===''){validateDimensions();return;}
    state[id]=Number(input.value);
  }
  validateDimensions();render();
}));
for(const id of ['thickness','hole'])$(id).addEventListener('blur',()=>{if(validateDimensions()){delete $(id).dataset.editing;$(id).value=state[id];}});
function tab(upload){$('uploadPanel').hidden=!upload;$('presetPanel').hidden=upload;for(const [id,active]of[['uploadTab',upload],['presetsTab',!upload]]){$(id).classList.toggle('selected',active);$(id).setAttribute('aria-selected',active);}}
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{state.diameter=Number(b.dataset.size);render();});
$('showGuide').onclick=()=>$('helpDialog').showModal();
$('uploadTab').onclick=()=>tab(true);$('presetsTab').onclick=()=>tab(false);
$('designNav').onclick=()=>{tab(false);$('designGrid').scrollIntoView({behavior:'smooth',block:'center'});toast('Six shapes. Endless possibilities. Pick your starting point.');};
$('editorLink').onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});};
function view(){ $('clockObject').style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${zoom})`;const front=rx===0&&ry===0;$('frontView').classList.toggle('selected',front);$('angleView').classList.toggle('selected',!front);}
$('frontView').onclick=()=>{rx=ry=rz=0;view();};$('angleView').onclick=()=>{rx=12;ry=-19;rz=-7;view();};
$('restoreView').onclick=()=>{zoom=1;rx=12;ry=-19;rz=-7;view();};
$('zoomIn').onclick=()=>{zoom=Math.min(1.4,zoom+.1);view();};$('zoomOut').onclick=()=>{zoom=Math.max(.6,zoom-.1);view();};
let drag=null;$('clockStage').onpointerdown=e=>{drag=[e.clientX,e.clientY,rx,ry];$('clockStage').setPointerCapture(e.pointerId);};
let viewFrame=null;
function scheduleView(){if(viewFrame===null)viewFrame=requestAnimationFrame(()=>{viewFrame=null;view();});}
$('clockStage').onpointermove=e=>{if(!drag)return;ry=Math.max(-60,Math.min(60,drag[3]+(e.clientX-drag[0])*.3));rx=Math.max(-50,Math.min(50,drag[2]-(e.clientY-drag[1])*.3));scheduleView();};
$('clockStage').onpointerup=$('clockStage').onpointercancel=()=>drag=null;
$('clockStage').addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(1.4,Math.max(.6,zoom-e.deltaY*.001));scheduleView();},{passive:false});
$('reset').onclick=()=>{importSequence++;importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;exportController?.abort();state={...initial};customSVG=customImage=null;lastDownloadKey=null;for(const id of ['thickness','hole'])delete $(id).dataset.editing;$('svgUpload').value='';$('uploadStatus').textContent='';tab(false);$('restoreView').click();render({forceInputs:true});validateDimensions();toast('A fresh start. Make something yours.');};
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=$('gotIt').onclick=()=>$('helpDialog').close();
$('svgUpload').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  e.target.value='';
  const sequence=++importSequence;
  importPending=true;$('uploadPanel').setAttribute('aria-busy','true');$('export').disabled=true;
  $('uploadStatus').textContent=`Opening ${file.name}…`;
  try{
    if(file.size>1024*1024)throw Error('Please choose an SVG smaller than 1 MB.');
    const prepared=await prepareSVG(await file.text());
    if(sequence!==importSequence)return;
    customSVG=prepared.markup;customImage=prepared.image;customRevision++;
    state.design='custom';render();
    $('uploadStatus').textContent=`Loaded ${file.name}. Your artwork is fitted to the clock face. Custom uploads last for this session.`;
    toast('Your SVG is ready. Its filled shapes and outlines form your clock face.');
  }catch(error){
    if(sequence!==importSequence)return;
    $('uploadStatus').textContent=`Couldn’t import ${file.name}: ${error.message}`;toast(error.message);
  }finally{
    if(sequence===importSequence){importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;}
  }
};
// Keep the editor responsive while the mesh is built. If a host blocks workers,
// retain a local fallback; the original height grid is kept for that case.
function meshAsync(heights,n,signal){
  return new Promise((resolve,reject)=>{
    let worker=null,timer=null,settled=false,fallingBack=false;
    const clean=()=>{clearTimeout(timer);worker?.terminate();signal.removeEventListener('abort',abort);};
    const finish=(error,buffer)=>{if(settled)return;settled=true;clean();error?reject(error):resolve(buffer);};
    const abort=()=>finish(new DOMException('Export cancelled','AbortError'));
    const fallback=()=>{
      if(settled||fallingBack)return;fallingBack=true;clearTimeout(timer);worker?.terminate();
      setTimeout(()=>{if(settled)return;try{signal.throwIfAborted();finish(null,makeSTL(heights,n,1));}catch(error){finish(error);}},0);
    };
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted){abort();return;}
    try{
      worker=new Worker(workerURL);
      worker.onmessage=({data})=>{
        if(data.id!==1||settled)return;
        if(data.error){finish(new Error(data.error));return;}
        if(data.buffer)finish(null,data.buffer);
      };
      worker.onerror=event=>{event.preventDefault();fallback();};
      const copy=heights.buffer.slice(0);
      worker.postMessage({id:1,heights:copy,n,step:1},[copy]);
      timer=setTimeout(fallback,15000);
    }catch{fallback();}
  });
}
function downloadClock(blob,settings,key){
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`clock-factory-${settings.design}-${settings.diameter}mm.stl`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  lastDownloadKey=key;$('downloadGuide').hidden=geometryKey()!==key;
  toast(geometryKey()===key?'Your print file is ready. Next steps are below the download button.':`Your ${settings.diameter} mm clock was exported. Download again to include your latest edits.`);
}
$('cancelExport').onclick=()=>exportController?.abort();
$('export').onclick=async()=>{
  if(importPending||exportController||!validateDimensions(true))return;
  const settings={...state},key=geometryKey(settings),image=customImage;
  if(exportCache?.key===key){downloadClock(exportCache.blob,settings,key);return;}
  const controller=new AbortController();exportController=controller;
  const button=$('export');button.disabled=true;button.textContent='Preparing your clock…';
  $('exportProgress').hidden=false;$('printSection').setAttribute('aria-busy','true');
  $('exportStatus').textContent='Preparing your shape… You can keep designing.';
  await new Promise(r=>setTimeout(r,0));
  try{
    controller.signal.throwIfAborted();
    const n=settings.diameter,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.scale(n/400,n/400);
    if(settings.design==='custom')ctx.drawImage(image,0,0,400,400);else{ctx.fillStyle='#fff';ctx.fill(new Path2D(outlines.get(settings.design)));}
    // Normalize the silhouette around its bounding box so the largest
    // dimension spans the requested diameter rather than the SVG's whitespace.
    const source=ctx.getImageData(0,0,n,n);let minX=n,minY=n,maxX=-1,maxY=-1;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(source.data[(y*n+x)*4+3]>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(maxX<0)throw Error('This shape has no printable filled area. Try another SVG.');
    const extent=Math.max(maxX-minX+1,maxY-minY+1)/2,centerX=(minX+maxX+1)/2,centerY=(minY+maxY+1)/2;
    const copy=document.createElement('canvas');copy.width=copy.height=n;copy.getContext('2d').putImageData(source,0,0);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,n,n);ctx.drawImage(copy,centerX-extent,centerY-extent,extent*2,extent*2,0,0,n,n);
    const pixels=ctx.getImageData(0,0,n,n).data,heights=new Float32Array(n*n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const dx=x+.5-n/2,dy=y+.5-n/2,r=Math.hypot(dx,dy),i=y*n+x;
      if(pixels[i*4+3]<128||r<settings.hole/2)continue;
      let h=settings.thickness;
      if(settings.texture==='ripple'&&Math.floor(r/2)%2===0)h+=.4;
      if(settings.texture==='grain'&&(Math.floor((dx+dy)/2)%3===0||Math.floor((dx-dy)/2)%3===0))h+=.4;
      if(settings.markers){const a=Math.atan2(dx,-dy),nearest=Math.round(a/(Math.PI/6))*(Math.PI/6);if(r>n*.265&&r<n*.31&&Math.abs(Math.sin(a-nearest)*r)<1.3)h=settings.thickness+.8;}
      heights[(n-1-y)*n+x]=Math.round(h*10)/10;
    }
    if(!heights.some(h=>h>0))throw Error('This shape has no printable filled area. Try another SVG.');
    controller.signal.throwIfAborted();
    $('exportStatus').textContent='Creating your print file… You can keep designing.';
    const buffer=await meshAsync(heights,n,controller.signal);
    controller.signal.throwIfAborted();
    const blob=new Blob([buffer],{type:'model/stl'});exportCache={key,blob};
    downloadClock(blob,settings,key);
  }catch(error){
    if(error.name==='AbortError')toast('Download cancelled. Your design is still here.');
    else toast('Could not export: '+error.message);
  }finally{
    exportController=null;button.disabled=importPending;button.innerHTML='Download STL <span>↓</span>';
    $('exportProgress').hidden=true;$('printSection').setAttribute('aria-busy','false');
  }
};
render();view();
