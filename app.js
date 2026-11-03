import { designs,shapePath } from './geometry.js';
import { prepareSVG, SVG_IMPORT_MAX_BYTES } from './svg-import.js';
import { listSavedSVGs, getSavedSVG, saveSVG, deleteSavedSVG } from './svg-library.js';
import { normalizeOrientation, transformOrientation, placementTransform, drawPlacedArtwork } from './svg-placement.js';
import { makeClockSTL } from './mesh.js';
const $=id=>document.getElementById(id);
const colors=[['Terracotta','#c47f62'],['Oat milk','#dfd5bd'],['Sage','#94a18a'],['Forest','#485c48'],['Ink','#434643'],['Lavender','#aaa0b5'],['Dusty rose','#c99d99']];
const initial={design:'petal',color:0,texture:'ripple',diameter:200,thickness:3,hole:8,markers:true};
let state={...initial};
let artworkOrientation=normalizeOrientation(null),restoreReference=null,restorePending=false;
try{
  const saved=JSON.parse(localStorage.getItem('clock-factory')||'null');
  const artworkId=typeof saved?.artworkId==='string'&&saved.artworkId.length<=128?saved.artworkId:null;
  const validDesign=saved&&(designs.some(d=>d.id===saved.design)||(saved.design==='custom'&&artworkId));
  if(validDesign&&Number.isInteger(saved.color)&&colors[saved.color]&&['smooth','ripple','grain'].includes(saved.texture)){
    state={design:saved.design==='custom'?'petal':saved.design,color:saved.color,texture:saved.texture,markers:typeof saved.markers==='boolean'?saved.markers:true};
    for(const [key,min,max,step]of[['diameter',100,300,10],['thickness',2,10,.5],['hole',5,15,.5]]){
      const value=Number(saved[key]);state[key]=Number.isFinite(value)?Math.min(max,Math.max(min,Math.round(value/step)*step)):initial[key];
    }
    artworkOrientation=normalizeOrientation(saved.artworkOrientation);
    if(artworkId){restoreReference={id:artworkId,useCustom:saved.design==='custom',orientation:[...artworkOrientation]};restorePending=true;}
  }
}catch{}
let activeArtwork=null,gallerySequence=0,deletingArtwork=false,settingsSaved=true;
let customSVG=null,customImage=null,customRevision=0,importSequence=0,importPending=false,zoom=1,rx=12,ry=-19,rz=-7;
const outlines=new Map(designs.map(d=>[d.id,shapePath(d.id)]));
const workerURL=new URL('./export-worker.js',document.currentScript?.src||location.href);
let toastTimer,saveTimer,previewKey='',exportCache=null,lastDownloadKey=null,exportController=null;
function geometryKey(settings=state){return JSON.stringify([settings.design,settings.design==='custom'?[customRevision,...artworkOrientation]:null,settings.diameter,settings.thickness,settings.hole,settings.texture,settings.markers]);}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function updateSaveLabel(){
  document.querySelector('.local-status').textContent=restorePending?'Opening saved SVG…':importPending?'Saving SVG…':!settingsSaved?'Session only':activeArtwork&&!activeArtwork.id?'SVG: session only':'Saved on this device';
}
function flushSave(){
  clearTimeout(saveTimer);if(restorePending)return;
  const reference=activeArtwork?.id||restoreReference?.id||null;
  let design=state.design;
  if(design==='custom'&&!reference)design='petal';
  if(restoreReference?.useCustom&&!activeArtwork)design='custom';
  try{localStorage.setItem('clock-factory',JSON.stringify({...state,design,artworkId:reference,artworkOrientation}));settingsSaved=true;}
  catch{settingsSaved=false;}
  updateSaveLabel();
}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,200);}
window.addEventListener('pagehide',flushSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();});
function faceMarkup(){return customSVG&&state.design==='custom'?`<g transform="${placementTransform(artworkOrientation)}">${customSVG}</g>`:`<path d="${outlines.get(state.design)||outlines.get('petal')}"/>`;}
function render({forceInputs=false}={}){
  const color=colors[state.color][1];
  const nextPreviewKey=JSON.stringify([state.design,state.color,state.texture,state.markers,customRevision,artworkOrientation]);
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
  updateArtworkUI();persist();
}
designs.forEach(d=>{const b=document.createElement('button');b.className='design-card';b.dataset.design=d.id;b.innerHTML=`<svg viewBox="0 0 400 400" aria-hidden="true"><path d="${outlines.get(d.id)}" fill="${d.id==='petal'?'#bf977b':'#c5c9b6'}"/><path d="M200 130V200L245 227" fill="none" stroke="#f7f5e9" stroke-width="10" stroke-linecap="round"/></svg>${d.name}`;b.onclick=()=>{cancelRestoration();state.design=d.id;render();};$('designGrid').append(b);});
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
$('reset').onclick=()=>{
  importSequence++;restorePending=false;restoreReference=null;importPending=false;activeArtwork=null;
  artworkOrientation=normalizeOrientation(null);$('uploadPanel').setAttribute('aria-busy','false');
  $('export').disabled=!!exportController;exportController?.abort();state={...initial};customSVG=customImage=null;lastDownloadKey=null;
  for(const id of ['thickness','hole'])delete $(id).dataset.editing;
  $('svgUpload').value='';$('uploadStatus').textContent='';tab(false);$('restoreView').click();render({forceInputs:true});validateDimensions();toast('A fresh start. Your saved SVGs are still available.');
};
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=$('gotIt').onclick=()=>$('helpDialog').close();
function cancelRestoration(){
  if(!restorePending&&!restoreReference&&!importPending)return;
  const wasLoading=importPending||restorePending;
  importSequence++;restorePending=false;restoreReference=null;importPending=false;
  $('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;
  if(wasLoading)$('uploadStatus').textContent='SVG loading cancelled.';
  updateSaveLabel();
}
function updateArtworkUI(){
  const busy=importPending||deletingArtwork;
  $('export').disabled=busy||restorePending||!!exportController;
  $('artworkCard').hidden=!activeArtwork;
  $('svgDropZone').classList.toggle('has-artwork',!!activeArtwork);
  $('artworkCard').setAttribute('aria-busy',String(busy));
  $('svgUpload').disabled=deletingArtwork;$('svgDropZone').setAttribute('aria-disabled',String(deletingArtwork));
  if(activeArtwork){
    $('artworkName').textContent=activeArtwork.name;$('artworkName').title=activeArtwork.name;
    $('artworkThumbnail').src=activeArtwork.thumbnail;
    $('artworkThumbnail').style.transform=`matrix(${artworkOrientation.join(',')},0,0)`;
    $('artworkDetails').textContent=`SVG · ${activeArtwork.size<1024*1024?Math.max(1,Math.round(activeArtwork.size/1024))+' KB':(activeArtwork.size/(1024*1024)).toFixed(1)+' MB'}`;
    $('artworkSavedStatus').textContent=busy?'Saving…':activeArtwork.id?'Saved on this device':'Session only — SVG not saved';
    $('artworkSavedStatus').classList.toggle('session-only',!busy&&!activeArtwork.id);
    $('useArtwork').hidden=state.design==='custom';
  }
  for(const id of ['useArtwork','replaceArtwork','removeArtwork','artRotateLeft','artRotateRight','artMirrorX','artMirrorY','artResetOrientation'])$(id).disabled=busy;
  for(const button of $('savedArtworks').querySelectorAll('button')){
    button.disabled=deletingArtwork;button.classList.toggle('selected',button.dataset.artworkId===activeArtwork?.id);
  }
  updateSaveLabel();
}
async function refreshGallery(){
  const sequence=++gallerySequence;
  try{
    const entries=await listSavedSVGs();if(sequence!==gallerySequence)return;
    $('savedArtworks').replaceChildren();
    $('savedArtworkSection').hidden=!entries.length;
    for(const entry of entries){
      const button=document.createElement('button');button.type='button';button.dataset.artworkId=entry.id;button.title=entry.name;button.setAttribute('aria-label',`Use saved SVG: ${entry.name}`);
      const image=document.createElement('img');image.src=entry.thumbnail;image.alt='';image.width=image.height=53;
      const name=document.createElement('span');name.textContent=entry.name;button.append(image,name);
      button.onclick=()=>{if(entry.id===activeArtwork?.id&&!importPending){state.design='custom';render();}else loadSavedArtwork(entry.id);};$('savedArtworks').append(button);
    }
    updateArtworkUI();
  }catch{ $('savedArtworkSection').hidden=true; }
}
function thumbnailFor(image){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const context=canvas.getContext('2d');context.drawImage(image,0,0,128,128);
  context.globalCompositeOperation='source-in';context.fillStyle='#6b8155';context.fillRect(0,0,128,128);
  return canvas.toDataURL('image/png');
}
function activateArtwork(prepared,record,{useCustom=true,orientation=null}={}){
  customSVG=prepared.markup;customImage=prepared.image;customRevision++;
  activeArtwork={...record};artworkOrientation=normalizeOrientation(orientation);
  if(useCustom)state.design='custom';
  render();
}
async function importArtwork(file){
  if(!file||deletingArtwork)return;
  cancelRestoration();const sequence=++importSequence;
  importPending=true;$('uploadPanel').setAttribute('aria-busy','true');$('export').disabled=true;
  $('uploadStatus').textContent=`Opening ${file.name}…`;updateArtworkUI();
  try{
    if(file.size>SVG_IMPORT_MAX_BYTES)throw Error('Please choose an SVG smaller than 5 MB.');
    const source=await file.text(),prepared=await prepareSVG(source);
    if(sequence!==importSequence)return;
    const record={id:null,name:file.name,source,size:file.size,thumbnail:thumbnailFor(prepared.image)};
    activateArtwork(prepared,record);
    let saved=false;
    try{
      const stored=await saveSVG(record);
      if(sequence!==importSequence){
        if(activeArtwork&&!activeArtwork.id&&activeArtwork.source===stored.source){activeArtwork={...stored};updateArtworkUI();persist();}
        refreshGallery();return;
      }
      activeArtwork={...stored};saved=true;
    }catch(error){if(sequence!==importSequence)return;$('uploadStatus').textContent=`Loaded ${file.name}. ${error.message}`;}
    if(sequence!==importSequence)return;
    if(saved)$('uploadStatus').textContent=`Loaded ${activeArtwork.name}. Saved on this device for next time.`;
    toast(saved?'Your SVG is ready and saved on this device.':'Your SVG is ready. It is available for this session only.');
    refreshGallery();
  }catch(error){
    if(sequence!==importSequence)return;
    $('uploadStatus').textContent=`Couldn’t import ${file.name}: ${error.message}`;toast(error.message);
  }finally{
    if(sequence===importSequence){importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;updateArtworkUI();persist();}
  }
}
async function loadSavedArtwork(id,{restoring=false,useCustom=true,orientation=null}={}){
  if(deletingArtwork)return;
  if(!restoring)cancelRestoration();const sequence=++importSequence;
  importPending=true;$('uploadPanel').setAttribute('aria-busy','true');$('export').disabled=true;
  $('uploadStatus').textContent='Opening saved SVG…';updateArtworkUI();
  let recordRead=false;
  try{
    const record=await getSavedSVG(id);if(sequence!==importSequence)return;
    if(!record){if(restoring)restoreReference=null;throw Error('This saved SVG is no longer available. Choose its original file to import it again.');}
    recordRead=true;const prepared=await prepareSVG(record.source);if(sequence!==importSequence)return;
    restoreReference=null;activateArtwork(prepared,record,{useCustom,orientation});
    $('uploadStatus').textContent=`Loaded ${record.name}. Saved on this device.`;
    if(useCustom)tab(true);
  }catch(error){
    if(sequence!==importSequence)return;
    if(restoring&&recordRead)restoreReference=null;
    $('uploadStatus').textContent=error.message;toast(error.message);
  }finally{
    if(sequence===importSequence){restorePending=false;importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;updateArtworkUI();persist();}
  }
}
$('svgUpload').onchange=async event=>{const file=event.target.files[0];event.target.value='';await importArtwork(file);};
$('svgDropZone').addEventListener('dragover',event=>{event.preventDefault();if(deletingArtwork)return;event.dataTransfer.dropEffect='copy';$('svgDropZone').classList.add('drag-active');});
$('svgDropZone').addEventListener('dragleave',()=>$('svgDropZone').classList.remove('drag-active'));
$('svgDropZone').addEventListener('drop',event=>{event.preventDefault();$('svgDropZone').classList.remove('drag-active');importArtwork(event.dataTransfer.files[0]);});
// Files dropped outside the upload area should never navigate away from the editor.
window.addEventListener('dragover',event=>{if([...event.dataTransfer.types].includes('Files'))event.preventDefault();});
window.addEventListener('drop',event=>{if([...event.dataTransfer.types].includes('Files'))event.preventDefault();});
$('replaceArtwork').onclick=()=>$('svgUpload').click();
$('useArtwork').onclick=()=>{if(activeArtwork&&!importPending){state.design='custom';render();}};
for(const [id,action]of[['artRotateLeft','left'],['artRotateRight','right'],['artMirrorX','mirrorX'],['artMirrorY','mirrorY'],['artResetOrientation','reset']])$(id).onclick=()=>{
  if(!activeArtwork||importPending||deletingArtwork)return;
  artworkOrientation=transformOrientation(artworkOrientation,action);state.design='custom';render();
};
$('removeArtwork').onclick=async()=>{
  if(!activeArtwork||importPending||deletingArtwork)return;
  const removed=activeArtwork;deletingArtwork=true;updateArtworkUI();
  try{
    if(removed.id)await deleteSavedSVG(removed.id);
    activeArtwork=null;customSVG=customImage=null;customRevision++;restoreReference=null;artworkOrientation=normalizeOrientation(null);
    if(state.design==='custom')state.design='petal';
    $('uploadStatus').textContent=`Removed ${removed.name} from saved artwork.`;render();await refreshGallery();
  }catch(error){toast(error.message);}
  finally{deletingArtwork=false;updateArtworkUI();persist();}
};
// Keep the editor responsive while the mesh is built. If a host blocks workers,
// retain a local fallback; the original outline is kept for that case.
function meshAsync(alpha,n,settings,signal){
  return new Promise((resolve,reject)=>{
    let worker=null,timer=null,settled=false,fallingBack=false;
    const clean=()=>{clearTimeout(timer);worker?.terminate();signal.removeEventListener('abort',abort);};
    const finish=(error,buffer)=>{if(settled)return;settled=true;clean();error?reject(error):resolve(buffer);};
    const abort=()=>finish(new DOMException('Export cancelled','AbortError'));
    const fallback=()=>{
      if(settled||fallingBack)return;fallingBack=true;clearTimeout(timer);worker?.terminate();
      setTimeout(()=>{if(settled)return;try{signal.throwIfAborted();finish(null,makeClockSTL(alpha,n,settings));}catch(error){finish(error);}},0);
    };
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted){abort();return;}
    try{
      worker=new Worker(workerURL);
      worker.onmessage=({data})=>{
        if(data.id!==1||settled)return;
        if(data.error){finish(new Error(data.error));return;}
        if(data.stage)$('exportStatus').textContent=data.stage==='outline'?'Smoothing your outline…':data.stage==='details'?'Adding your surface details…':'Finishing your print file…';
        if(data.buffer)finish(null,data.buffer);
      };
      worker.onerror=event=>{event.preventDefault();fallback();};
      const copy=alpha.buffer.slice(0);
      worker.postMessage({id:1,alpha:copy,n,settings},[copy]);
      timer=setTimeout(fallback,60000);
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
  if(importPending||deletingArtwork||restorePending||exportController||!validateDimensions(true))return;
  const settings={...state},key=geometryKey(settings),image=customImage,placement=[...artworkOrientation];
  if(exportCache?.key===key){downloadClock(exportCache.blob,settings,key);return;}
  const controller=new AbortController();exportController=controller;
  const button=$('export');button.disabled=true;button.textContent='Preparing your clock…';
  $('exportProgress').hidden=false;$('printSection').setAttribute('aria-busy','true');
  $('exportStatus').textContent='Preparing your shape… You can keep designing.';
  await new Promise(r=>setTimeout(r,0));
  try{
    controller.signal.throwIfAborted();
    const n=Math.ceil(settings.diameter/.15),canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.scale(n/400,n/400);
    if(settings.design==='custom')drawPlacedArtwork(ctx,image,placement);else{ctx.fillStyle='#fff';ctx.fill(new Path2D(outlines.get(settings.design)));}
    const pixels=ctx.getImageData(0,0,n,n).data,alpha=new Uint8Array(n*n);
    for(let i=0;i<alpha.length;i++)alpha[i]=pixels[i*4+3];
    controller.signal.throwIfAborted();
    $('exportStatus').textContent='Creating your print file… You can keep designing.';
    const buffer=await meshAsync(alpha,n,settings,controller.signal);
    controller.signal.throwIfAborted();
    const blob=new Blob([buffer],{type:'model/stl'});exportCache={key,blob};
    downloadClock(blob,settings,key);
  }catch(error){
    if(error.name==='AbortError')toast('Download cancelled. Your design is still here.');
    else toast('Could not export: '+error.message);
  }finally{
    exportController=null;button.disabled=importPending||deletingArtwork||restorePending;button.innerHTML='Download STL <span>↓</span>';
    $('exportProgress').hidden=true;$('printSection').setAttribute('aria-busy','false');
  }
};
render();view();
refreshGallery();
if(restoreReference){
  const reference={...restoreReference};if(reference.useCustom)tab(true);
  loadSavedArtwork(reference.id,{restoring:true,useCustom:reference.useCustom,orientation:reference.orientation});
}
