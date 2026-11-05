import { designs,shapePath } from './geometry.js';
import { prepareSVG, SVG_IMPORT_MAX_BYTES } from './svg-import.js';
import { listSavedSVGs, getSavedSVG, saveSVG, deleteSavedSVG } from './svg-library.js';
import { normalizeOrientation, transformOrientation, placementTransform, drawPlacedArtwork } from './svg-placement.js';
import { makeClockSTL } from './mesh.js';
import { hourNumeralMarkup } from './hour-numerals.js';
import { stlTo3MF } from './export-3mf.js';
import { stlToBambu3MF } from './export-bambu.js';
import { artworkFrame,usesSVGBacking,backingDepth,artworkSurfaceHeight } from './svg-details.js';
import { DEFAULT_SETTINGS,normalizeSettings,projectName,parseProject,serializeProject,projectFilename,MAX_PROJECT_BYTES } from './project.js';
import { DesignHistory } from './history.js';
import { MeshStore } from './mesh-store.js';
import { analyzeSTL,bedFit } from './mesh-analysis.js';
import {FilamentPreview} from './filament-preview.js';
import {normalizeFilamentOverrides} from './filament-colors.js';
import {HoleFitDialog} from './hole-fit-ui.js';
import {autoHourFit,fitHourLayout,hourLayoutMarkup} from './hour-layout.js';
import {RECESS_SKIN,recessDimensions} from './mechanism-recess.js';
import {raisedMechanismBox,flatFrontOnBed,boxDimensions} from './mechanism-box.js';
import {artworkPlacement} from './artwork-surface.js';
import {flatColorClock} from './quick-setup.js';
import {printReadiness} from './print-readiness.js';
import {defaultHourInk,hourInkColors} from './hour-contrast.js';
import {standDimensions} from './stand-settings.js';
import {sourceKey,frameKey,layoutKey,paintKey,filamentKey} from './artwork-keys.js';
import {downloadFile} from './file-downloads.js';
import {PreviewWorkspace} from './preview-workspace.js';
const $=id=>document.getElementById(id);
const colors=[['Terracotta','#c47f62'],['Oat milk','#dfd5bd'],['Sage','#94a18a'],['Forest','#485c48'],['Ink','#434643'],['Lavender','#aaa0b5'],['Dusty rose','#c99d99']];
const initial=DEFAULT_SETTINGS;
let state={...initial};
let artworkOrientation=normalizeOrientation(null),restoreReference=null,restorePending=false;
try{
  const saved=JSON.parse(localStorage.getItem('clock-factory')||'null');
  const artworkId=typeof saved?.artworkId==='string'&&saved.artworkId.length<=128?saved.artworkId:null;
  const validDesign=saved&&(designs.some(d=>d.id===saved.design)||(saved.design==='custom'&&artworkId));
  if(validDesign&&Number.isInteger(saved.color)&&colors[saved.color]&&['smooth','ripple','grain'].includes(saved.texture)){
    state=normalizeSettings(saved);if(state.design==='custom')state.design='petal';
    artworkOrientation=normalizeOrientation(saved.artworkOrientation);
    if(artworkId){restoreReference={id:artworkId,useCustom:saved.design==='custom',orientation:[...artworkOrientation]};restorePending=true;}
  }
}catch{}
let activeArtwork=null,gallerySequence=0,deletingArtwork=false,settingsSaved=true;
let customSVG=null,customArtwork=null,customImage=null,customRevision=0,revisionCounter=0,importSequence=0,importPending=false,zoom=1,rx=12,ry=-19,rz=-7;
const outlines=new Map(designs.map(d=>[d.id,shapePath(d.id)]));
const workerURL=new URL('./export-worker.js',document.currentScript?.src||location.href);
const meshViewURL=new URL('./mesh-view.js',document.currentScript?.src||location.href);
const history=new DesignHistory(),meshStore=new MeshStore(2);
let toastTimer,saveTimer,previewKey='',exportCache=null,lastDownloadKey=null,exportController=null,applyingHistory=false,backingViewCache=null,sourceInfoCache=null,lastGeometryError=null,meshCameraView='angle';
let sourceRasterCache=null,frameInfoCache=null,layoutInfoCache=null,paintCache=null,loadedTextureKey=null;
function clearArtworkCache(){sourceRasterCache=frameInfoCache=layoutInfoCache=sourceInfoCache=paintCache=backingViewCache=null;filamentPreview.clear();}
let previewMode='design',meshView=null,loadedMeshKey=null,meshPreviewKey=null,meshPreviewController=null,meshPreviewTimer=null,checkController=null,checkKey=null;
let bed={width:220,depth:220},bedPreset='custom';
try{const saved=JSON.parse(localStorage.getItem('clock-factory-bed')||'null');if(saved&&[saved.width,saved.depth].every(v=>Number.isInteger(v)&&v>=80&&v<=500)){bed={width:saved.width,depth:saved.depth};if(saved.preset==='a1'&&saved.width===256&&saved.depth===256)bedPreset='a1';}}catch{}
function originalArtwork(settings=state){return settings.design==='custom'&&settings.svgDetail==='artwork';}
function geometryKey(settings=state){return JSON.stringify([settings.design,settings.design==='custom'?[customRevision,...artworkOrientation,flatFrontOnBed(settings)?'flat':[settings.svgDetail,settings.svgRelief,settings.svgTone],settings.svgBacking,settings.svgBacking?[settings.svgBackingThickness,settings.svgBackingMargin]:null,settings.hourFit]:null,settings.diameter,settings.thickness,settings.hole,originalArtwork(settings)||flatFrontOnBed(settings)?'smooth':settings.texture,settings.markers,settings.markers?settings.hourStyle:null,settings.markers&&settings.hourStyle!=='ticks'?[settings.numberSize,settings.numberPosition]:null,settings.mechanismRecess?[settings.mechanismMount,settings.mechanismFlatFront,settings.mechanismWall,settings.recessWidth,settings.recessHeight,settings.recessDepth,settings.recessClearance]:false,settings.deskStand?[settings.standWidth,settings.standDepth,settings.standLean,settings.standClearance,settings.recessHeight,settings.recessClearance]:false]);}
function fileKey(settings=state){return JSON.stringify([geometryKey(settings),settings.exportFormat,settings.exportFormat==='3mf'?[paintKey({settings:{...settings,faceColor:colors[settings.color][1]},revision:customRevision,placement:artworkOrientation}),settings.threeMFTarget,settings.threeMFTarget==='bambu-a1'?[settings.filamentCount,settings.bambuBackColor,Object.entries(settings.bambuColors).sort()]:null]:null]);}
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
function backingViewTransform(){
  const key=JSON.stringify([customRevision,artworkOrientation,state.diameter,state.svgBackingMargin]);
  if(backingViewCache?.key===key)return backingViewCache.transform;
  const {frame,n}=sourceInfo(designSnapshot()),scale=frame.scale*n/400*360/state.diameter;
  const transform=`matrix(${scale} 0 0 ${scale} ${200-frame.cx*frame.scale*360/state.diameter} ${200-frame.cy*frame.scale*360/state.diameter})`;
  backingViewCache={key,transform};return transform;
}
function faceMarkup(){
  const markup=customSVG&&state.design==='custom'?`<g transform="${placementTransform(artworkOrientation)}">${customSVG}</g>`:`<path d="${outlines.get(state.design)||outlines.get('petal')}"/>`;
  return usesSVGBacking(state)?`<g transform="${backingViewTransform()}">${markup}</g>`:markup;
}
function render({forceInputs=false,historyGroup=null,recordHistory=true}={}){
  const color=colors[state.color][1],detailed=originalArtwork(),backed=usesSVGBacking(state),flat=flatFrontOnBed(state),visibleTexture=flat?'smooth':state.texture,hourInk=defaultHourInk({...state,faceColor:color});
  const nextPreviewKey=JSON.stringify([state.design,state.color,visibleTexture,state.markers,state.hourStyle,state.hourColor,state.numberSize,state.numberPosition,state.diameter,state.svgDetail,customRevision,artworkOrientation,backed,state.hourFit,backed||autoHourFit(state)?[state.svgBackingMargin,state.hole]:null]);
  if(nextPreviewKey!==previewKey){
  let ticks='',numberClearance='';
  if(state.markers&&state.hourStyle!=='ticks'){ticks=`<g id="hourNumerals" fill="${hourInk}">${hourNumeralMarkup(state)}</g>`;numberClearance=`<mask id="numberClearanceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill="white"/><g fill="black" stroke="black" stroke-width="${1.2*400/state.diameter}" stroke-linejoin="round">${hourNumeralMarkup(state)}</g></mask>`;}
  if(state.markers&&state.hourStyle==='ticks')for(let i=0;i<12;i++)ticks+=`<rect x="197.5" y="76" width="5" height="${i%3===0?17:10}" rx="2" transform="rotate(${i*30} 200 200)" fill="${hourInk}" opacity=".9"/>`;
  if(backed)ticks=`<g transform="translate(200 200) scale(0.9) translate(-200 -200)">${ticks}</g>`;
  if(autoHourFit(state)){
    const {layout,frame,n,hourColors}=sourceInfo(designSnapshot()),project=backed?(x,y)=>[200+x*360/state.diameter,200-y*360/state.diameter]:(x,y)=>[(x/frame.scale+frame.cx)*400/n,(frame.cy-y/frame.scale)*400/n];
    const markup=hourLayoutMarkup(layout,project,hourColors);ticks=`<g id="hourOverlay" fill="${hourInk}"><g${state.hourStyle!=='ticks'?' id="hourNumerals"':''}>${markup}</g></g>`;
    if(state.hourStyle!=='ticks')numberClearance=`<mask id="numberClearanceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill="white"/><g fill="black" stroke="black" stroke-width="${1.2*(backed?360/state.diameter:400/(n*frame.scale))}" stroke-linejoin="round">${hourLayoutMarkup(layout,project)}</g></mask>`;
  }
  $('clockSvg').innerHTML=`<defs><mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><g fill="white" stroke="none">${faceMarkup()}</g></mask>${numberClearance}<pattern id="ridges" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M-4 4L4 12M4 -4L12 4" stroke="#402e21" opacity=".12" stroke-width=".8"/><path d="M8 0L0 8" stroke="#fff" opacity=".14" stroke-width=".7"/></pattern><radialGradient id="light" cx="30%" cy="20%" r="90%"><stop stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#24190d" stop-opacity=".13"/></radialGradient></defs><g mask="url(#faceMask)"><rect width="400" height="400" fill="${color}"/><g${numberClearance?' mask="url(#numberClearanceMask)"':''}>${visibleTexture==='ripple'?Array.from({length:44},(_,i)=>`<circle cx="200" cy="200" r="${12+i*4}" fill="none" stroke="${i%2?'#fff0da':'#774832'}" stroke-opacity="${i%2?'.18':'.23'}" stroke-width=".8"/>`).join(''):visibleTexture==='grain'?'<rect width="400" height="400" fill="url(#ridges)"/>':''}</g><rect width="400" height="400" fill="url(#light)"/>${ticks}</g><g id="previewHands" style="filter:drop-shadow(1px 3px 2px #0003)"><path d="M197 206L193 142Q193 138 197 138L202 138L204 206Z" transform="rotate(-59 200 200)" fill="#f4ebd7"/><path d="M197 212L197 102Q197 98 200 98Q203 98 203 102L203 212Z" transform="rotate(49 200 200)" fill="#f4ebd7"/><circle cx="200" cy="200" r="8" fill="#e6ce9d"/><circle cx="200" cy="200" r="3" fill="#c1a46e"/></g>`;
  if(detailed){
    const painted=document.createElementNS('http://www.w3.org/2000/svg','g');
    painted.id='originalArtwork';painted.setAttribute('transform',`${backed?backingViewTransform()+' ':''}${placementTransform(artworkOrientation)}`);painted.innerHTML=customArtwork;
    const face=$('clockSvg').querySelector('g[mask="url(#faceMask)"]');
    face.innerHTML=ticks;face.before(painted);
  }
  if(backed){
    const svg=$('clockSvg'),ns='http://www.w3.org/2000/svg',circle=document.createElementNS(ns,'circle'),mask=document.createElementNS(ns,'mask'),group=document.createElementNS(ns,'g');
    if(autoHourFit(state)&&$('hourOverlay'))svg.insertBefore($('hourOverlay'),$('previewHands'));
    circle.id='svgBackingPreview';circle.setAttribute('cx','200');circle.setAttribute('cy','200');circle.setAttribute('r','180');circle.setAttribute('fill',color);svg.insertBefore(circle,svg.querySelector('defs').nextSibling);
    mask.id='backingShaftMask';mask.setAttribute('maskUnits','userSpaceOnUse');mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','400');mask.setAttribute('height','400');mask.innerHTML=`<rect width="400" height="400" fill="white"/><circle cx="200" cy="200" r="${state.hole/state.diameter*180}" fill="black"/>`;svg.querySelector('defs').append(mask);
    if(!autoHourFit(state))svg.querySelector('#numberClearanceMask g')?.setAttribute('transform','translate(200 200) scale(0.9) translate(-200 -200)');
    group.setAttribute('mask','url(#backingShaftMask)');for(const child of [...svg.children])if(child.tagName.toLowerCase()!=='defs'&&child.id!=='previewHands')group.append(child);svg.insertBefore(group,$('previewHands'));
  }
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
  $('exportSize').textContent=`${state.diameter} mm across · ${Number(artworkSurfaceHeight(state).toFixed(1))} mm ${backed?'base + backing':'base'}${raisedMechanismBox(state)?' + '+state.recessDepth+' mm rear box':''}`;
  if(state.deskStand)$('exportSize').textContent=`${state.diameter} mm across · ${Number((artworkSurfaceHeight(state)+state.standDepth).toFixed(1))} mm overall · rear stand`;
  $('thicknessLabelText').textContent=backed?'Artwork thickness':'Base thickness';
  $('fitHint').textContent=`The threaded shaft must pass through the face and leave room for the nut.${backed?' The backing adds '+backingDepth(state)+' mm below the artwork; include it and any relief when checking shaft length.':''}`;
  if(raisedMechanismBox(state)||state.deskStand)$('fitHint').textContent=`The movement rests on the back of the ${Number(artworkSurfaceHeight(state).toFixed(1))} mm face. Rear accessories add height behind it; they do not add to the thickness the shaft passes through. Leave room for the washer and nut.`;
  $('svgBacking').checked=state.svgBacking;$('svgBackingOptions').hidden=!state.svgBacking;
  for(const id of ['svgBackingThickness','svgBackingMargin']){$(id).value=state[id];$(id+'Value').textContent=state[id];}
  $('sizeHint').textContent=`${state.diameter/10} cm across — ${state.diameter<=160?'a compact clock for a shelf or desk.':state.diameter<=220?'a lovely size for a desk or small wall.':'a statement piece for your wall. Check your printer’s bed size.'}`;
  document.querySelectorAll('[data-size]').forEach(b=>{const active=Number(b.dataset.size)===state.diameter;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
  $('downloadGuide').hidden=lastDownloadKey!==fileKey();
  $('hourStyle').value=state.hourStyle;$('hourStyle').disabled=!state.markers;$('hourColor').value=state.hourColor;$('hourColor').disabled=!state.markers;
  $('hourFit').checked=state.hourFit;$('hourFitControls').hidden=state.design!=='custom'||!state.markers;
  const fitted=autoHourFit(state)?sourceInfo(designSnapshot()).layout:null;
  $('hourFitStatus').textContent=fitted?`${fitted.labels.length}/12 hours fit${fitted.scale<.999?' · '+Math.round(fitted.scale*100)+'% of requested size':''}.${fitted.missing.length?' A round backing can support the remaining hours.':''}`:'Manual circle placement. Numbers may be clipped at the SVG edge.';
  $('hourFitStatus').dataset.tone=fitted?.missing.length?'warning':'success';$('backingForHours').hidden=!fitted?.missing.length;
  $('numeralOptions').hidden=!state.markers||state.hourStyle==='ticks';
  $('numberPrintHelp').textContent=flat?'Numbers stay upright and use flat color in 3MF. Turn off “Flat front on bed” to restore raised numbers.':'Numbers stay upright and print in relief. SVG fitting adjusts their size and distance when needed; turn it off for manual placement.';
  for(const id of ['numberSize','numberPosition']){$(id).value=state[id];$(id+'Value').textContent=state[id];}
  $('svgDetailControls').hidden=state.design!=='custom';$('svgDetail').value=state.svgDetail;
  $('svgReliefControls').hidden=!detailed||flat;$('svgRelief').value=state.svgRelief;$('svgReliefValue').textContent=state.svgRelief.toFixed(1);$('svgTone').value=state.svgTone;
  $('texture').hidden=$('textureLabel').hidden=detailed||flat;
  $('faceColorHint').textContent=detailed?'Your SVG keeps its original colors. This filament color is used for the back and edges.':'A preview of your filament color. Choose the matching filament when you print.';
  if(detailed&&state.exportFormat==='3mf'&&state.threeMFTarget==='bambu-a1'&&state.bambuBackColor==='background')$('faceColorHint').textContent='The back starts with the SVG background color. Adjust it in “See your print colors”, or choose “Use selected face color” in the export options to use this swatch.';
  updateExportFormatUI();
  const d=designs.find(d=>d.id===state.design);
  $('designTitle').innerHTML=d?`The ${d.name} Clock <span>↗</span>`:'Your Custom Clock <span>↗</span>';
  $('designDescription').textContent=d?.description||'Your own shape. Your own sense of time.';
  $('clockObject').style.filter=`drop-shadow(3px ${Math.round(artworkSurfaceHeight(state)*1.5)}px 0 ${color} ) drop-shadow(9px 19px 12px #726b4f30)`;
  if(forceInputs||(document.activeElement!==$('diameterNumber')&&!$('diameterNumber').dataset.editing))$('diameterNumber').value=state.diameter;
  if(forceInputs||document.activeElement!==$('projectName'))$('projectName').value=state.projectName;
  $('showHands').checked=state.showHands;const hands=$('clockSvg').querySelector('#previewHands');if(hands)hands.toggleAttribute('hidden',!state.showHands);
  $('mechanismQuickSummary').textContent=raisedMechanismBox(state)?`${state.recessWidth} × ${state.recessHeight} mm movement · ${state.recessDepth} mm box · ${Number(artworkSurfaceHeight(state).toFixed(1))} mm face`:state.mechanismRecess?`${state.recessWidth} × ${state.recessHeight} mm pocket · ${state.recessDepth} mm deep`:`${state.hole.toFixed(1)} mm center hole · optional rear box`;
  if(state.deskStand&&!state.mechanismRecess)$('mechanismQuickSummary').textContent=`${state.recessWidth} × ${state.recessHeight} mm movement · ${state.recessDepth} mm deep · ${state.hole.toFixed(1)} mm shaft hole`;
  if(state.deskStand)$('mechanismQuickSummary').textContent+=` · ${state.standLean}° desk stand`;
  $('mechanismRecess').checked=state.mechanismRecess;$('recessOptions').hidden=!(state.mechanismRecess||state.deskStand);$('mountTypeControl').hidden=!state.mechanismRecess;
  $('mechanismMount').value=state.mechanismMount;$('mechanismFlatFront').checked=state.deskStand||state.mechanismFlatFront;$('mechanismFlatFront').disabled=state.deskStand;
  const box=state.mechanismMount==='box';
  for(const id of ['recessWidth','recessHeight','recessDepth','recessClearance','mechanismWall','standWidth','standDepth','standLean','standClearance'])if(forceInputs||(document.activeElement!==$(id)&&!$(id).dataset.editing)){$(id).value=state[id];if(forceInputs)delete $(id).dataset.editing;}
  $('boxWallControl').hidden=!state.mechanismRecess||!box;$('flatFrontControl').hidden=$('flatFrontHelp').hidden=!(raisedMechanismBox(state)||state.deskStand);
  $('flatFrontHelp').textContent=state.mechanismFlatFront?'Keeps SVG colors and numbers flat in color 3MF. Raised front details are paused; STL contains the shape and box only.':'Raised front details are retained. Turn this on for a flat front against the print bed, with flat color artwork and numbers.';
  if(state.deskStand)$('flatFrontHelp').textContent='The stand prints with a flat front. SVG artwork and numbers use flat color in 3MF. Turn off the stand to restore your front-relief preference.';
  $('recessDepthLabel').textContent=!state.mechanismRecess?'Movement depth · mm':box?'Box height · mm':'Pocket depth · mm';
  $('mountHelp').textContent=!state.mechanismRecess?'Match your movement body. The stand reserves this space even when you do not print a rear mount.':box?'Adds four walls on the back, open at the top. The clock face stays at your chosen thickness.':'Cuts a pocket into the back. Enabling it thickens the face or backing enough to retain 1.2 mm of front material.';
  const pocket=box?boxDimensions(state):recessDimensions(state),mm=value=>Number(value.toFixed(2));
  $('recessSummary').textContent=box?`Box: ${mm(pocket.width)} × ${mm(pocket.height)} mm inside · ${pocket.depth} mm high · ${pocket.wall} mm walls. Outside: ${mm(pocket.outerWidth)} × ${mm(pocket.outerHeight)} mm. Verify your movement dimensions before printing.`:`Pocket: ${pocket.width} × ${pocket.height} mm · ${pocket.depth} mm deep. Keeps at least ${RECESS_SKIN} mm of front material. Verify your movement dimensions before printing.`;
  if(!state.mechanismRecess)$('recessSummary').textContent=`Movement: ${state.recessWidth} × ${state.recessHeight} × ${state.recessDepth} mm · ${state.recessClearance} mm fit allowance per side.`;
  $('mountPrintHelp').textContent=state.deskStand?'Use Print mesh → Desk to inspect the movement and stand. The print file stays front-down.':flat?'Use Print mesh → Back to inspect the open box. Export is already front-down with the walls pointing up.':box?'Use Print mesh → Back to inspect the box. Raised front details need a suitable print orientation and may need supports.':'Use Print mesh → Back to inspect it. The rear pocket may need supports; check orientation and bridging in your slicer.';
  $('supportBadge').textContent=flat?'Flat front · box walls up':state.mechanismRecess?(box?'Rear box · check supports':'Rear pocket · check supports'):'No supports needed';
  $('printabilitySummary').textContent=flat?'✓ Flat front on bed · open box grows upward':state.mechanismRecess?'Mechanism mount · review orientation and supports':'✓ Flat back · no supports needed';
  $('deskStand').checked=state.deskStand;$('standOptions').hidden=!state.deskStand;
  const stand=standDimensions(state);$('standSummary').textContent=`${stand.width} mm wide · ${stand.depth} mm behind the face · ${stand.lean}° backward lean. Leaves at least ${stand.clearance} mm below the movement body. The support is included in STL and 3MF.`;
  if(state.deskStand){$('supportBadge').textContent='Flat front · rear desk stand';$('printabilitySummary').textContent='✓ Flat front on bed · rear stand grows upward';}
  if(meshCameraView==='desk'&&!state.deskStand)meshCameraView='angle';$('deskView').hidden=previewMode!=='print'||!state.deskStand;
  updateArtworkUI();validateDimensions();persist();
  if(recordHistory)checkpointHistory(historyGroup);updateHistoryUI();updatePrintSummary();scheduleMeshPreview();
}
function captureSnapshot(){return {settings:{...state},orientation:[...artworkOrientation],artwork:activeArtwork?{...activeArtwork}:null,mask:customSVG,paint:customArtwork,image:customImage,revision:customRevision};}
function snapshotKey(){return JSON.stringify([state,artworkOrientation,activeArtwork?customRevision:null]);}
function checkpointHistory(group=null){if(!importPending&&!restorePending&&!applyingHistory)history.commit(captureSnapshot(),snapshotKey(),{group});}
function updateHistoryUI(){
  const busy=importPending||restorePending||deletingArtwork||applyingHistory;
  $('undo').disabled=busy||!history.canUndo;$('redo').disabled=busy||!history.canRedo;
  $('openProject').disabled=$('saveProject').disabled=busy;$('projectUpload').disabled=busy;
  $('applyClockSetup').disabled=busy;
}
async function restoreHistory(action){
  if(importPending||restorePending||deletingArtwork||applyingHistory)return;
  const snapshot=history[action]();if(!snapshot)return;
  const sequence=++importSequence;applyingHistory=true;importPending=!!snapshot.artwork;
  restoreReference=null;restorePending=false;state={...snapshot.settings};artworkOrientation=[...snapshot.orientation];
  if(customRevision!==snapshot.revision)clearArtworkCache();
  customSVG=snapshot.mask;customArtwork=snapshot.paint;customImage=snapshot.image;customRevision=snapshot.revision;
  activeArtwork=snapshot.artwork?{...snapshot.artwork,id:null}:null;
  for(const id of ['thickness','hole','diameterNumber'])delete $(id).dataset.editing;
  tab(state.design==='custom');render({forceInputs:true,recordHistory:false});
  try{if(activeArtwork){const saved=await saveSVG(activeArtwork);if(sequence===importSequence)activeArtwork=saved;}}
  catch(error){if(sequence===importSequence)$('uploadStatus').textContent=error.message;}
  finally{if(sequence===importSequence){applyingHistory=false;importPending=false;render({forceInputs:true,recordHistory:false});refreshGallery();toast(action==='undo'?'Previous design restored.':'Design change restored.');}}
}
$('undo').onclick=()=>restoreHistory('undo');$('redo').onclick=()=>restoreHistory('redo');
$('projectName').addEventListener('input',()=>{state.projectName=$('projectName').value;render({historyGroup:'projectName'});});
$('projectName').addEventListener('blur',()=>{state.projectName=projectName(state.projectName);render();history.endGroup();});
document.addEventListener('change',event=>{if(event.target.matches('input[type="range"]'))history.endGroup();});
$('showHands').onchange=()=>{state.showHands=$('showHands').checked;render();};
try{$('welcome').hidden=localStorage.getItem('clock-factory-welcome-hidden')==='true';}catch{}
$('dismissWelcome').onclick=()=>{$('welcome').hidden=true;try{localStorage.setItem('clock-factory-welcome-hidden','true');}catch{}};
for(const list of document.querySelectorAll('[role="tablist"]'))list.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const tabs=[...list.querySelectorAll('[role="tab"]')],index=tabs.indexOf(document.activeElement);if(index<0)return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowLeft'?-1:1)+tabs.length)%tabs.length;
  tabs[next].focus();tabs[next].click();
});
document.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
  const key=event.key.toLowerCase(),editing=event.target instanceof Element&&event.target.closest('textarea,[contenteditable="true"],input:not([type="range"]):not([type="checkbox"])');
  if(key==='s'){event.preventDefault();$('saveProject').click();}
  else if(key==='o'){event.preventDefault();$('openProject').click();}
  else if(!editing&&(key==='z'||key==='y')){event.preventDefault();restoreHistory(key==='y'||event.shiftKey?'redo':'undo');}
});
designs.forEach(d=>{const b=document.createElement('button');b.className='design-card';b.dataset.design=d.id;b.innerHTML=`<svg viewBox="0 0 400 400" aria-hidden="true"><path d="${outlines.get(d.id)}" fill="${d.id==='petal'?'#bf977b':'#c5c9b6'}"/><path d="M200 130V200L245 227" fill="none" stroke="#f7f5e9" stroke-width="10" stroke-linecap="round"/></svg>${d.name}`;b.onclick=()=>{cancelRestoration();state.design=d.id;render();};$('designGrid').append(b);});
colors.forEach(([name,color],i)=>{const b=document.createElement('button');b.className='swatch';b.style.background=color;b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>{state.color=i;render();};$('swatches').append(b);});
document.querySelectorAll('[data-texture]').forEach(b=>b.onclick=()=>{state.texture=b.dataset.texture;render();});
const mountFields=()=>['recessWidth','recessHeight','recessDepth','recessClearance',...(state.mechanismMount==='box'?['mechanismWall']:[])];
const movementFields=['recessWidth','recessHeight','recessDepth','recessClearance'];
const accessoryFields=()=>[...(state.mechanismRecess?mountFields():state.deskStand?movementFields:[]),...(state.deskStand?['standWidth','standDepth','standLean','standClearance']:[])];
function validateDimensions(focus=false){
  const ids=['diameterNumber','thickness','hole',...accessoryFields()],invalid=ids.map($).find(input=>input.value===''||!input.validity.valid);
  for(const id of ids)$(id).setAttribute('aria-invalid',String($(id).value===''||!$(id).validity.valid));
  $('dimensionError').hidden=!invalid||invalid.id==='diameterNumber'||accessoryFields().includes(invalid.id);$('sizeError').hidden=!invalid||invalid.id!=='diameterNumber';
  if(invalid){
    const size=invalid.id==='diameterNumber';
    if(invalid.id.startsWith('stand')){$('standError').hidden=false;$('standError').textContent='Desk stand: use the displayed measurement ranges and steps.';}
    else if(mountFields().includes(invalid.id)){$('recessError').hidden=false;$('recessError').textContent='Movement: enter dimensions within the displayed ranges and steps.';}
    else $(size?'sizeError':'dimensionError').textContent=size?'Enter a diameter from 100 to 300 mm, in steps of 1 mm.':invalid.id==='hole'?'Enter a center hole from 5 to 15 mm, in steps of 0.1 mm.':'Enter a face thickness from 2 to 10 mm, in steps of 0.5 mm.';
    if(focus){if(!size)document.querySelector('.advanced-settings').open=true;invalid.focus();}
  }
  $('export').disabled=!!invalid||importPending||deletingArtwork||restorePending||!!exportController;
  updateReadiness();
  $('showFitTest').disabled=$('hole').value===''||!$('hole').validity.valid||importPending||deletingArtwork||restorePending||!!exportController;
  return !invalid;
}
$('diameterNumber').addEventListener('input',()=>{
  $('diameterNumber').dataset.editing='true';validateDimensions();if($('diameterNumber').value===''||!$('diameterNumber').validity.valid)return;
  state.diameter=Number($('diameterNumber').value);render({historyGroup:'diameter'});
});
$('diameterNumber').addEventListener('blur',()=>{if(validateDimensions())delete $('diameterNumber').dataset.editing;});
function makeRecessRoom(){
  if(!state.mechanismRecess||raisedMechanismBox(state))return;
  const required=state.recessDepth+RECESS_SKIN;
  if(usesSVGBacking(state))state.svgBackingThickness=Math.max(state.svgBackingThickness,Math.ceil((required-1e-7)*5)/5);
  else{state.thickness=Math.max(state.thickness,Math.ceil((required-1e-7)*2)/2);delete $('thickness').dataset.editing;$('thickness').value=state.thickness;}
}
function enableSupportingBacking(){state.svgBacking=true;makeRecessRoom();render({forceInputs:true});}
$('backingForHours').onclick=enableSupportingBacking;$('backingForRecess').onclick=enableSupportingBacking;$('backingForStand').onclick=enableSupportingBacking;
$('inspectStand').onclick=()=>{if(!state.deskStand||importPending||restorePending||deletingArtwork)return;setPreviewMode('print');meshCamera('desk');$('preview').scrollIntoView({behavior:'smooth',block:'start'});};
['diameter','thickness','hole','markers','svgBacking','hourFit','mechanismRecess','mechanismFlatFront','deskStand'].forEach(id=>$(id).addEventListener('input',()=>{
  const input=$(id);
  if(['markers','svgBacking','hourFit','mechanismRecess','mechanismFlatFront','deskStand'].includes(id)){state[id]=input.checked;if((id==='mechanismRecess'||id==='svgBacking')&&input.checked)makeRecessRoom();}
  else{
    if(id!=='diameter')input.dataset.editing='true';
    if(!input.validity.valid||input.value===''){validateDimensions();return;}
    state[id]=Number(input.value);
    if(id==='diameter'){delete $('diameterNumber').dataset.editing;$('diameterNumber').value=state.diameter;}
  }
  validateDimensions();render({historyGroup:['markers','svgBacking','hourFit','mechanismRecess','mechanismFlatFront','deskStand'].includes(id)?null:id});
  if(id==='deskStand'&&state.deskStand){setPreviewMode('print');meshCamera('desk');}
}));
for(const id of ['recessWidth','recessHeight','recessDepth','recessClearance','mechanismWall','standWidth','standDepth','standLean','standClearance'])$(id).addEventListener('input',()=>{
  $(id).dataset.editing='true';
  $(id).setAttribute('aria-invalid',String($(id).value===''||!$(id).validity.valid));
  if($(id).value===''||!$(id).validity.valid){validateDimensions();return;}
  state[id]=Number($(id).value);if(id==='recessDepth')makeRecessRoom();render({historyGroup:id});
});
for(const id of ['recessWidth','recessHeight','recessDepth','recessClearance','mechanismWall','standWidth','standDepth','standLean','standClearance'])$(id).addEventListener('blur',()=>{if($(id).value!==''&&$(id).validity.valid){delete $(id).dataset.editing;$(id).value=state[id];}});
for(const id of ['hourStyle','hourColor','exportFormat','svgDetail','svgTone','threeMFTarget','filamentCount','bambuBackColor','mechanismMount'])$(id).addEventListener('change',()=>{
  const value=id==='filamentCount'?Number($(id).value):$(id).value,allowed={hourStyle:['ticks','arabic','roman'],hourColor:['light','dark','auto'],exportFormat:['stl','3mf'],svgDetail:['artwork','silhouette'],svgTone:['contrast','dark','light'],threeMFTarget:['bambu-a1','standard'],filamentCount:[2,4],bambuBackColor:['background','face'],mechanismMount:['box','recess']}[id];
  if(!allowed.includes(value))return;state[id]=value;if(id==='mechanismMount')makeRecessRoom();render();
});
for(const id of ['numberSize','numberPosition','svgRelief','svgBackingThickness','svgBackingMargin'])$(id).addEventListener('input',()=>{
  if(!$(id).validity.valid)return;state[id]=Number($(id).value);render({historyGroup:id});
});
function updateExportFormatUI(){
  const format=state.exportFormat.toUpperCase();$('exportFormat').value=state.exportFormat;
  const bambu=state.exportFormat==='3mf'&&state.threeMFTarget==='bambu-a1';
  const single=state.exportFormat==='stl';
  const flat=flatFrontOnBed(state);$('flatFrontNotice').hidden=!flat;
  $('flatFrontNotice').textContent=`Flat front on bed: SVG colors and hour numbers stay flat in color 3MF. STL contains the outline and ${state.deskStand?'rear support':'rear box'}; front relief is paused.`;
  for(const [id,selected]of [['singleColorPrint',single],['bambuColorPrint',bambu]]){$(id).classList.toggle('selected',selected);$(id).setAttribute('aria-pressed',String(selected));}
  $('printModeLabel').textContent=single?'One-color print':bambu?'Bambu A1 · color':'Standard 3MF';
  $('printModeHint').textContent=single?'A simple print in one filament. Your SVG details can still stand out in relief.':bambu?`A1 / 0.4 mm · up to ${state.filamentCount} filaments. SVG colors become printable color regions; gradients become solid colors.`:'Original SVG colors are stored as a texture. Check that your software supports 3MF textures; this option does not assign filaments.';
  $('exportOptionsSummary').textContent=single?'STL · one color':bambu?`A1 / 0.4 mm · up to ${state.filamentCount} colors`:'Standard 3MF · color texture';
  $('exportType').textContent=bambu?'3MF · Bambu A1':`${format} file`;
  $('exportFormatHint').textContent=originalArtwork()?(state.exportFormat==='3mf'?'3MF keeps the SVG relief and original artwork as a color texture. Texture color support depends on your slicer.':'STL keeps the SVG details as relief. STL stores geometry; use 3MF to keep the artwork colors too.'):(state.exportFormat==='3mf'?'3MF includes the mesh, millimeter units, and selected face color.':'STL exports the printable mesh. Colors are a filament preview.');
  $('threeMFOptions').hidden=state.exportFormat!=='3mf';$('threeMFTarget').value=state.threeMFTarget;$('filamentCount').value=state.filamentCount;$('bambuBackColor').value=state.bambuBackColor;$('bambuOptions').hidden=!bambu;
  if(bambu)$('exportFormatHint').textContent='Open the .3mf as a project in Bambu Studio. Check your A1 0.4 mm and filament presets, then map the numbered colors to your AMS spools before slicing.';
  if(flat&&single){$('printModeHint').textContent=`A flat face and ${state.deskStand?'rear stand':'raised rear box'} in one piece. Use Bambu A1 · colors to print the SVG artwork and hour numbers in color.`;$('exportFormatHint').textContent=`STL contains the outline and ${state.deskStand?'rear stand':'open rear box'}. Flat SVG artwork and numbers need a color 3MF; raised front details are paused for bed contact.`;}
  else if(flat&&!bambu)$('exportFormatHint').textContent='3MF keeps the flat SVG artwork and numbers as a color texture. Export is front-down with the rear accessories pointing up. Texture support depends on your slicer.';
  showFilamentPalette(exportCache?.key===fileKey()?exportCache.palette:null);
  updateFilamentPreview();
  updateMeshAppearance();
  if(!exportController)$('export').innerHTML=`Download ${format} <span>↓</span>`;
}
function showFilamentPalette(palette){
  $('filamentPalette').replaceChildren();
  $('paletteSummary').hidden=!palette?.length;
  if(!palette?.length)return;
  palette.forEach((color,i)=>{const chip=document.createElement('span'),dot=document.createElement('i');dot.style.backgroundColor=color;chip.append(dot,document.createTextNode(`${i+1} · ${color}`));$('filamentPalette').append(chip);});
}
$('singleColorPrint').onclick=()=>{state.exportFormat='stl';render();};
$('bambuColorPrint').onclick=()=>{
  state.exportFormat='3mf';state.threeMFTarget='bambu-a1';
  setBuildPlate(256,256,'a1');render();
};
$('applyClockSetup').onclick=()=>{
  if(importPending||restorePending||deletingArtwork||applyingHistory)return;
  history.endGroup();state=flatColorClock(state);setBuildPlate(256,256,'a1');render({forceInputs:true});history.endGroup();
  toast('A1 color setup applied: flat front, 55 mm rear box and 12 fitted numbers.');
};
$('editMechanism').onclick=()=>{document.querySelector('.advanced-settings').open=true;const target=$(state.deskStand&&!state.mechanismRecess?'recessHeight':'mechanismRecess');target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});};
$('downloadAgain').onclick=()=>$('export').click();
for(const id of ['thickness','hole'])$(id).addEventListener('blur',()=>{if(validateDimensions()){delete $(id).dataset.editing;$(id).value=state[id];}});
function tab(upload){$('uploadPanel').hidden=!upload;$('presetPanel').hidden=upload;for(const [id,active]of[['uploadTab',upload],['presetsTab',!upload]]){$(id).classList.toggle('selected',active);$(id).setAttribute('aria-selected',active);$(id).tabIndex=active?0:-1;}}
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{state.diameter=Number(b.dataset.size);delete $('diameterNumber').dataset.editing;$('diameterNumber').value=state.diameter;render();});
$('showGuide').onclick=()=>$('helpDialog').showModal();
$('uploadTab').onclick=()=>tab(true);$('presetsTab').onclick=()=>tab(false);
$('designNav').onclick=()=>{tab(false);$('designGrid').scrollIntoView({behavior:'smooth',block:'center'});toast('Six shapes. Endless possibilities. Pick your starting point.');};
$('editorLink').onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});};
function view(){ $('clockObject').style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${zoom})`;const front=rx===0&&ry===0;$('frontView').classList.toggle('selected',front);$('angleView').classList.toggle('selected',!front);}
function meshCamera(mode){if(mode==='desk'&&!state.deskStand)mode='angle';meshCameraView=mode;$('meshBedLabel').textContent=mode==='desk'?'Desk surface':'Build plate';$('previewBadge').textContent=mode==='desk'?'Desk preview · file prints flat':'Actual print model';meshView?.setView(mode);$('meshBed').disabled=mode===(flatFrontOnBed(state)?'front':'back');for(const [id,view]of [['frontView','front'],['angleView','angle'],['backView','back'],['deskView','desk']])$(id).classList.toggle('selected',mode===view);}
$('frontView').onclick=()=>{if(previewMode==='print'){meshCamera('front');return;}rx=ry=rz=0;view();};$('angleView').onclick=()=>{if(previewMode==='print'){meshCamera('angle');return;}rx=12;ry=-19;rz=-7;view();};
$('backView').onclick=()=>meshCamera('back');$('deskView').onclick=()=>meshCamera('desk');
$('restoreView').onclick=()=>{if(previewMode==='print'){meshCamera('angle');return;}zoom=1;rx=12;ry=-19;rz=-7;view();};
$('zoomIn').onclick=()=>{if(previewMode==='print'){meshView?.zoom(1/1.12);return;}zoom=Math.min(1.4,zoom+.1);view();};$('zoomOut').onclick=()=>{if(previewMode==='print'){meshView?.zoom(1.12);return;}zoom=Math.max(.6,zoom-.1);view();};
let drag=null;$('clockStage').onpointerdown=e=>{if(previewMode==='print')return;drag=[e.clientX,e.clientY,rx,ry];$('clockStage').setPointerCapture(e.pointerId);};
let viewFrame=null;
function scheduleView(){if(viewFrame===null)viewFrame=requestAnimationFrame(()=>{viewFrame=null;view();});}
$('clockStage').onpointermove=e=>{if(!drag)return;ry=Math.max(-60,Math.min(60,drag[3]+(e.clientX-drag[0])*.3));rx=Math.max(-50,Math.min(50,drag[2]-(e.clientY-drag[1])*.3));scheduleView();};
$('clockStage').onpointerup=$('clockStage').onpointercancel=()=>drag=null;
$('clockStage').addEventListener('wheel',e=>{if(previewMode==='print')return;e.preventDefault();zoom=Math.min(1.4,Math.max(.6,zoom-e.deltaY*.001));scheduleView();},{passive:false});
const previewWorkspace=new PreviewWorkspace({onResize:()=>meshView?.resize()});
$('clockStage').addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
  const key=event.key.toLowerCase(),actions={'+':'zoomIn','=':'zoomIn','-':'zoomOut','0':'restoreView','1':'frontView','2':'angleView',...(previewMode==='print'?{'3':'backView',...(state.deskStand?{'4':'deskView'}:{})}:{})};
  if(actions[key]){event.preventDefault();$(actions[key]).click();}
  else if(key==='f'){event.preventDefault();previewWorkspace.open();}
  else if(key.startsWith('arrow')){
    event.preventDefault();
    if(previewMode==='print')meshView?.orbit(key==='arrowleft'?.12:key==='arrowright'?-.12:0,key==='arrowup'?.12:key==='arrowdown'?-.12:0);
    else{if(key==='arrowleft'||key==='arrowright')ry=Math.max(-60,Math.min(60,ry+(key==='arrowleft'?-5:5)));else rx=Math.max(-50,Math.min(50,rx+(key==='arrowup'?-5:5)));view();}
  }
});
$('reset').onclick=()=>{
  setPreviewMode('design');
  applyingHistory=false;
  importSequence++;restorePending=false;restoreReference=null;importPending=false;activeArtwork=null;
  artworkOrientation=normalizeOrientation(null);$('uploadPanel').setAttribute('aria-busy','false');
  $('export').disabled=!!exportController;exportController?.abort();state={...initial};customSVG=customArtwork=customImage=null;lastDownloadKey=null;
  clearArtworkCache();
  for(const id of ['thickness','hole','diameterNumber'])delete $(id).dataset.editing;
  $('svgUpload').value='';$('uploadStatus').textContent='';tab(false);$('restoreView').click();render({forceInputs:true});validateDimensions();toast('A fresh start. Your saved SVGs are still available.');
};
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=$('gotIt').onclick=()=>$('helpDialog').close();
function cancelRestoration(){
  if(!restorePending&&!restoreReference&&!importPending)return;
  const wasLoading=importPending||restorePending;
  importSequence++;restorePending=false;restoreReference=null;importPending=false;applyingHistory=false;
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
  for(const id of ['useArtwork','replaceArtwork','removeArtwork','artRotateLeft','artRotateRight','artMirrorX','artMirrorY','artResetOrientation','svgDetail','svgRelief','svgTone','svgBacking','svgBackingThickness','svgBackingMargin'])$(id).disabled=busy;
  for(const button of $('savedArtworks').querySelectorAll('button')){
    button.disabled=deletingArtwork;button.classList.toggle('selected',button.dataset.artworkId===activeArtwork?.id);
  }
  updateSaveLabel();updateHistoryUI();updateFilamentPreview();holeFit.update();
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
  return canvas.toDataURL('image/png');
}
function activateArtwork(prepared,record,{useCustom=true,orientation=null}={}){
  clearArtworkCache();
  customSVG=prepared.markup;customArtwork=prepared.artworkMarkup;customImage=prepared.image;customRevision=++revisionCounter;
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
    if(sequence===importSequence){importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;updateArtworkUI();persist();checkpointHistory();updateHistoryUI();scheduleMeshPreview();}
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
    if(sequence===importSequence){restorePending=false;importPending=false;$('uploadPanel').setAttribute('aria-busy','false');$('export').disabled=!!exportController;updateArtworkUI();persist();if(restoring)history.reset(captureSnapshot(),snapshotKey());else checkpointHistory();updateHistoryUI();scheduleMeshPreview();}
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
    activeArtwork=null;customSVG=customArtwork=customImage=null;customRevision=++revisionCounter;restoreReference=null;artworkOrientation=normalizeOrientation(null);clearArtworkCache();
    if(state.design==='custom')state.design='petal';
    $('uploadStatus').textContent=`Removed ${removed.name} from saved artwork.`;render();await refreshGallery();
  }catch(error){toast(error.message);}
  finally{deletingArtwork=false;updateArtworkUI();persist();}
};
// Keep the editor responsive while the mesh is built. If a host blocks workers,
// retain a local fallback; the original outline is kept for that case.
function meshAsync(alpha,n,settings,signal,cachedSTL=null,artwork=null,onStage=()=>{},cachedStats=null){
  return new Promise((resolve,reject)=>{
    let worker=null,timer=null,settled=false,fallingBack=false;
    const clean=()=>{clearTimeout(timer);worker?.terminate();signal.removeEventListener('abort',abort);};
    const finish=(error,buffer)=>{if(settled)return;settled=true;clean();error?reject(error):resolve(buffer);};
    const abort=()=>finish(new DOMException('Export cancelled','AbortError'));
    const fallback=()=>{
      if(settled||fallingBack)return;fallingBack=true;clearTimeout(timer);worker?.terminate();
      setTimeout(()=>{if(settled)return;try{signal.throwIfAborted();const mesh=cachedSTL||makeClockSTL(alpha,n,settings,undefined,artwork),stats=cachedStats||analyzeSTL(mesh);let buffer=mesh,palette=null;if(settings.exportFormat==='3mf'){if(settings.threeMFTarget==='bambu-a1'){const result=stlToBambu3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor,painting:artwork?.painting,analysis:artwork?.analysis,maxColors:settings.filamentCount,backColor:settings.bambuBackColor,colorOverrides:settings.bambuColors});buffer=result.buffer;palette=result.palette;}else buffer=stlTo3MF(mesh,{name:'Clock Factory clock face',color:settings.faceColor,artwork:artwork?.texture});}finish(null,{buffer,stlBuffer:mesh,stats,palette});}catch(error){finish(error);}},0);
    };
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted){abort();return;}
    try{
      worker=new Worker(workerURL);
      worker.onmessage=({data})=>{
        if(data.id!==1||settled)return;
        if(data.error){finish(new Error(data.error));return;}
        if(data.stage)onStage(data.stage);
        if(data.buffer)finish(null,{buffer:data.buffer,stlBuffer:data.stlBuffer||data.buffer,stats:data.stats,palette:data.palette});
      };
      worker.onerror=event=>{event.preventDefault();fallback();};
      const copy=(cachedSTL||alpha.buffer).slice(0);
      const transferredArtwork=artwork?{rgba:artwork.rgba?.slice(),texture:artwork.texture&&!(settings.exportFormat==='3mf'&&settings.threeMFTarget==='bambu-a1')?{...artwork.texture,png:artwork.texture.png.slice()}:null,painting:artwork.painting?{...artwork.painting,rgba:artwork.analysis?undefined:artwork.painting.rgba.slice()}:null,analysis:artwork.analysis?{...artwork.analysis,map:artwork.analysis.map.slice()}:null}:null;
      const transfers=[copy];
      if(transferredArtwork?.rgba)transfers.push(transferredArtwork.rgba.buffer);
      if(transferredArtwork?.texture)transfers.push(transferredArtwork.texture.png.buffer);
      if(transferredArtwork?.painting?.rgba)transfers.push(transferredArtwork.painting.rgba.buffer);
      if(transferredArtwork?.analysis)transfers.push(transferredArtwork.analysis.map.buffer);
      worker.postMessage({id:1,...(cachedSTL?{stlBuffer:copy}:{alpha:copy}),n,settings,artwork:transferredArtwork,stats:cachedStats},transfers);
      timer=setTimeout(fallback,60000);
    }catch{fallback();}
  });
}
function downloadClock(blob,settings,key){
  downloadFile(blob,`clock-factory-${settings.design}-${settings.diameter}mm${settings.exportFormat==='3mf'&&settings.threeMFTarget==='bambu-a1'?'-bambu-a1':''}.${settings.exportFormat}`);
  lastDownloadKey=key;$('downloadGuide').hidden=fileKey()!==key;
  const bambu=settings.exportFormat==='3mf'&&settings.threeMFTarget==='bambu-a1';
  const steps=bambu?[
    'Open the .3mf in Bambu Studio and choose “Open as project” to load its colors.',
    'Choose your actual filament presets and match each numbered color to an AMS spool.',
    flatFrontOnBed(settings)?`Keep the flat front on the plate and the ${settings.deskStand?'rear stand':'open box'} pointing up; review flushing volumes, then slice and print.`:settings.mechanismRecess?'Inspect the rear mount, print orientation and supports; review flushing volumes, then slice and print.':'Check the flat side is on the plate, review flushing volumes, then slice and print.'
  ]:[
    `Open the .${settings.exportFormat} file in your printer’s slicer.`,
    flatFrontOnBed(settings)?`Keep the flat front on the print bed, with the ${settings.deskStand?'rear stand':'open box'} pointing up. Check the dimensions.`:settings.mechanismRecess?'Review the rear mount, print orientation and support settings in your slicer.':'Place the flat side on the print bed and check the dimensions.',
    'Slice and print, then fit your clock movement and hands.'
  ];
  $('downloadSteps').replaceChildren(...steps.map(text=>{const item=document.createElement('li');item.textContent=text;return item;}));
  $('downloadNote').textContent=bambu?'A1 · 0.4 mm nozzle. Up to 4 colors with one AMS Lite. Reopen your .clock project in Clock Factory to edit the design.':settings.exportFormat==='stl'?'STL contains the shape and raised details. For colored SVG artwork on your A1, choose Bambu A1 · colors above.':'Standard 3MF contains a color texture. For AMS filament assignments, choose Bambu A1 · colors above.';
  if(flatFrontOnBed(settings)&&settings.exportFormat==='stl')$('downloadNote').textContent=`STL contains the flat clock shape and ${settings.deskStand?'rear stand':'rear box'}. Choose Bambu A1 · colors to keep flat SVG artwork and hour numbers in the print.`;
  toast(fileKey()===key?'Your print file is ready. Next steps are below the download button.':`Your ${settings.diameter} mm file is ready. Download again to include your latest edits.`);
}
function paintHourDetails(context,settings,frame=null,layout=null,hourColors=null){
  if(!settings.markers)return;
  context.save();context.fillStyle=defaultHourInk(settings);
  if(layout){
    const scale=400/(frame.n*frame.scale);context.transform(scale,0,0,-scale,frame.cx*400/frame.n,frame.cy*400/frame.n);
    for(const label of layout.labels){context.fillStyle=hourColors?.[label.hour]||defaultHourInk(settings);const path=label.polygons.map(p=>p.map(r=>r.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join('')+'Z').join('')).join('');context.fill(new Path2D(path),'evenodd');}
  }else{
    if(frame&&usesSVGBacking(settings)){const scale=settings.diameter/(frame.n*frame.scale);context.transform(scale,0,0,scale,frame.cx*400/frame.n-200*scale,frame.cy*400/frame.n-200*scale);}
    if(settings.hourStyle!=='ticks'){
      const svg=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${hourNumeralMarkup(settings)}</svg>`,'image/svg+xml');for(const path of svg.querySelectorAll('path'))context.fill(new Path2D(path.getAttribute('d')),'evenodd');
    }else for(let i=0;i<12;i++){context.save();context.translate(200,200);context.rotate(i*Math.PI/6);context.beginPath();context.roundRect(-2.5,-124,5,i%3===0?17:10,2);context.fill();context.restore();}
  }
  context.restore();
}
function designSnapshot(){const settings={...state,faceColor:colors[state.color][1]};return {settings,geometry:geometryKey(settings),image:customImage,placement:[...artworkOrientation],revision:customRevision};}
function sourceRaster(snapshot){
  const key=sourceKey(snapshot);if(sourceRasterCache?.key===key)return sourceRasterCache;
  const {settings,image,placement}=snapshot,n=Math.ceil(settings.diameter/.15),canvas=document.createElement('canvas');canvas.width=canvas.height=n;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.scale(n/400,n/400);
  if(settings.design==='custom')drawPlacedArtwork(context,image,placement);else{context.fillStyle='#fff';context.fill(new Path2D(outlines.get(settings.design)));}
  const rgba=context.getImageData(0,0,n,n).data,alpha=new Uint8Array(n*n);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
  sourceRasterCache={key,canvas,n,rgba,alpha};return sourceRasterCache;
}
function sourceInfo(snapshot,raw=null){
  const s=snapshot.settings,fkey=frameKey(snapshot),lkey=layoutKey(snapshot),key=JSON.stringify([lkey,s.hourColor,s.hourColor==='auto'?[s.faceColor,s.svgDetail]:null]);
  if(sourceInfoCache?.key===key)return sourceInfoCache;
  raw ||=sourceRaster(snapshot);
  if(frameInfoCache?.key!==fkey)frameInfoCache={key:fkey,frame:artworkFrame(raw.alpha,raw.n,s.diameter,s)};
  const frame=frameInfoCache.frame;
  if(layoutInfoCache?.key!==lkey)layoutInfoCache={key:lkey,layout:autoHourFit(s)?fitHourLayout(raw.alpha,raw.n,frame,s):null};
  const layout=layoutInfoCache.layout;
  sourceInfoCache={key,frame,n:raw.n,layout,hourColors:layout?hourInkColors(raw.rgba,raw.n,frame,layout,s):null};return sourceInfoCache;
}
function paintedRaster(snapshot,raw=null){
  const key=paintKey(snapshot);if(paintCache?.key===key)return paintCache;
  const settings=snapshot.settings;raw ||=sourceRaster(snapshot);
  const {frame:sourceFrame,layout,hourColors}=sourceInfo(snapshot,raw),n=raw.n,backed=usesSVGBacking(settings),canvas=document.createElement('canvas');canvas.width=canvas.height=n;
  const context=canvas.getContext('2d',{willReadFrequently:true});let frame=sourceFrame;
  if(!backed)context.drawImage(raw.canvas,0,0);
  context.scale(n/400,n/400);
  if(backed){
    context.save();const scale=sourceFrame.scale*n/settings.diameter;context.transform(scale,0,0,scale,200-sourceFrame.cx*sourceFrame.scale*400/settings.diameter,200-sourceFrame.cy*sourceFrame.scale*400/settings.diameter);drawPlacedArtwork(context,snapshot.image,snapshot.placement);context.restore();
    frame={scale:settings.diameter/n,cx:n/2,cy:n/2,n};
  }
  if(!originalArtwork(settings)){context.globalCompositeOperation='source-in';context.fillStyle=settings.faceColor;context.fillRect(0,0,400,400);}
  context.globalCompositeOperation=backed&&autoHourFit(settings)?'source-over':'source-atop';paintHourDetails(context,settings,frame,layout,hourColors);
  paintCache={key,canvas,frame,sourceFrame,n,rgba:context.getImageData(0,0,n,n).data};return paintCache;
}
function paintedPNG(paint){
  if(!paint.png)paint.png=new Promise(resolve=>paint.canvas.toBlob(resolve,'image/png')).then(async blob=>{
    if(!blob)throw Error('The SVG color artwork could not be prepared.');return new Uint8Array(await blob.arrayBuffer());
  }).catch(error=>{paint.png=null;throw error;});
  return paint.png;
}
async function ensureMesh(snapshot,signal,onStage=()=>{},{withTexture=true}={}){
  const {settings,geometry}=snapshot;
  try{
    const mesh=await meshStore.get(geometry,async(jobSignal,stage)=>{
      jobSignal.throwIfAborted();stage('outline');const raw=sourceRaster(snapshot),artwork=originalArtwork(settings)&&!flatFrontOnBed(settings)?{rgba:raw.rgba}:null;
      const result=await meshAsync(raw.alpha,raw.n,{...settings,exportFormat:'stl'},jobSignal,null,artwork,stage);
      const frame=usesSVGBacking(settings)?{scale:settings.diameter/raw.n,cx:raw.n/2,cy:raw.n/2,n:raw.n}:sourceInfo(snapshot,raw).frame;
      return {stlBuffer:result.stlBuffer,stats:result.stats,artwork:{surface:artworkPlacement(settings,frame)}};
    },{signal,onStage});
    signal.throwIfAborted();let artwork=mesh.artwork;
    if(withTexture&&(originalArtwork(settings)||flatFrontOnBed(settings))){const paint=paintedRaster(snapshot),png=await paintedPNG(paint);signal.throwIfAborted();artwork={...artwork,texture:{png,...artworkPlacement(settings,paint.frame)}};}
    if(lastGeometryError?.key===geometry)lastGeometryError=null;updatePrintSummary();return {...mesh,artwork};
  }catch(error){if(error.name!=='AbortError'){lastGeometryError={key:geometry,message:error.message};updatePrintSummary();}throw error;}
}
function prepareFilamentRaster(snapshot){
  const paint=paintedRaster(snapshot);return {rgba:paint.rgba,width:paint.n,height:paint.n,...artworkPlacement(snapshot.settings,paint.frame)};
}
function updateFilamentPreview(){
  const snapshot=designSnapshot();
  filamentPreview.update({enabled:state.exportFormat==='3mf'&&state.threeMFTarget==='bambu-a1',busy:importPending||restorePending||deletingArtwork,key:filamentKey(snapshot),snapshot,overrides:state.bambuColors});
}
const stageMessage=stage=>({outline:'Tracing the clock outline…',details:'Adding the printable details…',mesh:'Closing the print mesh…',package:'Preparing your 3MF file…',filaments:'Mapping your SVG colors to printable filaments…'}[stage]||'Checking your model…');
let readinessKey='',readinessAction=null;
function updateReadiness(){
  const key=geometryKey(),loading=importPending||restorePending||deletingArtwork;
  const invalid=['diameterNumber','thickness','hole',...accessoryFields()].find(id=>$(id).value===''||!$(id).validity.valid);
  const report=printReadiness({settings:state,stats:meshStore.peek(key)?.stats,error:lastGeometryError?.key===key?lastGeometryError.message:null,hours:!loading&&autoHourFit(state)?sourceInfo(designSnapshot()).layout:null,invalid,plate:bed,plateValid:[$('bedWidth'),$('bedDepth')].every(input=>input.value!==''&&input.validity.valid),loading,checking:!!checkController&&key===checkKey});
  readinessAction=report.action;
  $('readinessAction').hidden=!report.action;$('readinessAction').textContent=report.label||'Check this design';
  const signature=JSON.stringify(report);if(signature===readinessKey)return;readinessKey=signature;
  $('printReadiness').dataset.tone=report.tone;$('readinessHeading').textContent=report.title;
  $('readinessBadge').textContent=report.tone==='success'?'Checked':report.tone==='error'?'Needs attention':report.tone==='warning'?'Review':'Needs a check';
  $('readinessList').replaceChildren(...report.items.map(item=>{
    const li=document.createElement('li'),text=document.createElement('span');li.dataset.tone=item.tone;li.dataset.check=item.id;text.textContent=item.text;li.append(text);
    if(item.action&&item.action!==report.action){const button=document.createElement('button');button.type='button';button.className='readiness-link';button.dataset.action=item.action;button.textContent=item.label;li.append(button);}return li;
  }));
}
async function runReadinessAction(action){
  if(importPending||restorePending||deletingArtwork)return;
  if(action==='dimensions'){validateDimensions(true);return;}
  if(action==='stand'){document.querySelector('.advanced-settings').open=true;$('standWidth').focus();return;}
  if(action==='printer'){$('bedSettings').open=true;$('bedWidth').focus();return;}
  if(action==='hours'||action==='backing'){enableSupportingBacking();await $('checkModel').onclick();return;}
  if(action==='room'){makeRecessRoom();render({forceInputs:true});await $('checkModel').onclick();return;}
  if(action==='colors'){$('bambuColorPrint').click();return;}
  if(action==='fit'){$('fitToBed').click();await $('checkModel').onclick();return;}
  if(action==='desk'){$('inspectStand').click();return;}
  if(action==='back'){setPreviewMode('print');meshCamera('back');$('preview').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(action==='preview'){setPreviewMode('print');$('preview').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(action==='check')await $('checkModel').onclick();
}
$('readinessAction').onclick=()=>runReadinessAction(readinessAction);
$('readinessList').onclick=event=>{const button=event.target.closest('button[data-action]');if(button)runReadinessAction(button.dataset.action);};
function updatePrintSummary(){
  const key=geometryKey(),result=meshStore.peek(key),stats=result?.stats;
  if(checkController&&key!==checkKey)checkController.abort();
  $('modelDimensions').textContent=stats?stats.dimensions.map(value=>Number(value.toFixed(1))).join(' × '):`${state.diameter} mm span`;
  $('modelVolume').textContent=stats?(stats.volume/1000).toFixed(1):'—';$('modelParts').textContent=stats?String(stats.components):'—';
  $('printCheckStatus').textContent=stats?(stats.components>1?`${stats.components} separate pieces. Plan a backing or assembly before printing.`:'Closed print mesh checked. Add the movement and hands after printing.'):'Check the model to see its exact dimensions, relief, and separate parts.';
  $('printCheckStatus').dataset.tone=stats?(stats.components>1?'warning':'success'):'neutral';
  $('printCheckStatus').dataset.checked=String(!!stats);
  const invalidPocket=(state.mechanismRecess||state.deskStand)&&(state.mechanismRecess?mountFields():movementFields).some(id=>$(id).value===''||!$(id).validity.valid);
  const pocketError=invalidPocket?'Movement: enter dimensions within the displayed ranges and steps.':state.mechanismRecess&&lastGeometryError?.key===key&&/^Rear (pocket|box):/.test(lastGeometryError.message)?lastGeometryError.message:null;
  $('recessError').hidden=!pocketError;$('recessError').textContent=pocketError||'';
  $('backingForRecess').hidden=!state.mechanismRecess||state.design!=='custom'||(state.svgBacking&&(raisedMechanismBox(state)||state.svgBackingThickness>=state.recessDepth+RECESS_SKIN));
  $('backingForRecess').textContent=raisedMechanismBox(state)?'Use a round backing under the box':'Use a thick round backing for the pocket';
  if(pocketError){$('printCheckStatus').textContent=pocketError;$('printCheckStatus').dataset.tone='warning';}
  const valid=[$('bedWidth'),$('bedDepth')].every(input=>input.value!==''&&input.validity.valid);
  const fit=stats?bedFit(stats.dimensions,bed.width,bed.depth):null;
  $('bedLabel').textContent=`${bed.width} × ${bed.depth} mm${valid&&fit?(fit.fits?' · Fits':' · Too small'):''}`;
  $('bedLabel').dataset.tone=valid&&fit?(fit.fits?'success':'warning'):'neutral';
  $('printerPreset').value=bedPreset;
  if(stats&&valid&&!fit.fits){$('printCheckStatus').textContent=`${stats.components>1?stats.components+' separate pieces.':'Closed mesh checked.'} Too large for your ${bed.width} × ${bed.depth} mm build plate.`;$('printCheckStatus').dataset.tone='warning';}
  $('bedStatus').textContent=!valid?'Enter build plate dimensions from 80 to 500 mm.':!fit?'Check the model to verify its fit on this build plate.':fit.fits?(fit.rotated?'Fits after a quarter turn on the build plate.':'Fits on your build plate.'): 'This model is larger than your build plate. Reduce its size or choose a larger printer.';
  $('bedStatus').dataset.tone=valid&&fit?(fit.fits?'success':'warning'):'neutral';
  $('fitToBed').hidden=!valid||!fit||fit.fits;
  $('connectArtwork').hidden=state.design!=='custom'||state.svgBacking||!stats||stats.components<2;$('connectArtwork').disabled=!!checkController||importPending||restorePending||deletingArtwork;
  holeFit.update();
  const standError=state.deskStand&&['standWidth','standDepth','standLean','standClearance'].some(id=>$(id).value===''||!$(id).validity.valid)?'Desk stand: use the displayed measurement ranges and steps.':state.deskStand&&lastGeometryError?.key===key&&lastGeometryError.message.startsWith('Desk stand:')?lastGeometryError.message:null;
  $('standError').hidden=!standError;$('standError').textContent=standError||'';$('backingForStand').hidden=!state.deskStand||state.design!=='custom'||state.svgBacking;
  if(meshView)meshView.setBed(bed.width,bed.depth,fit?.fits!==false,$('meshBed').checked);
  updateReadiness();
}
function saveBuildPlate(){try{localStorage.setItem('clock-factory-bed',JSON.stringify({...bed,preset:bedPreset}));}catch{}}
function setBuildPlate(width,depth,preset='custom'){
  bed={width,depth};bedPreset=preset;$('bedWidth').value=width;$('bedDepth').value=depth;saveBuildPlate();
}
$('printerPreset').onchange=()=>{
  if($('printerPreset').value==='a1')setBuildPlate(256,256,'a1');
  else{bedPreset='custom';saveBuildPlate();}
  updatePrintSummary();
};
for(const [id,key]of [['bedWidth','width'],['bedDepth','depth']]){
  $(id).value=bed[key];
  $(id).addEventListener('input',()=>{
    bedPreset='custom';
    if([$('bedWidth'),$('bedDepth')].every(input=>input.value!==''&&input.validity.valid)){
      bed={width:Number($('bedWidth').value),depth:Number($('bedDepth').value)};
      saveBuildPlate();
    }
    updatePrintSummary();
  });
}
$('fitToBed').onclick=()=>{
  const stats=meshStore.peek(geometryKey())?.stats;if(!stats)return;
  const [x,y]=stats.dimensions,scale=Math.max(Math.min((bed.width-4)/x,(bed.depth-4)/y),Math.min((bed.width-4)/y,(bed.depth-4)/x));
  const diameter=Math.min(300,Math.floor(state.diameter*scale));
  if(diameter<100){toast('This design needs a larger build plate at the minimum 100 mm size.');return;}
  state.diameter=diameter;render({forceInputs:true});toast(`Resized to ${diameter} mm, with space around the print.`);
};
$('checkModel').onclick=async()=>{
  if(checkController||importPending||restorePending||deletingArtwork||!validateDimensions(true))return;
  const controller=new AbortController(),snapshot=designSnapshot();checkController=controller;checkKey=snapshot.geometry;
  $('checkModel').disabled=true;$('checkModel').textContent='Checking…';
  updateReadiness();
  try{await ensureMesh(snapshot,controller.signal,stage=>{if(snapshot.geometry===geometryKey())$('printCheckStatus').textContent=stageMessage(stage);},{withTexture:false});}
  catch(error){if(error.name!=='AbortError')toast('Could not check model: '+error.message);}
  finally{if(checkController===controller){checkController=null;$('checkModel').disabled=false;$('checkModel').textContent='Check model';updatePrintSummary();}}
};
$('connectArtwork').onclick=async()=>{
  if(state.design!=='custom'||checkController||importPending||restorePending||deletingArtwork)return;
  state.svgBacking=true;makeRecessRoom();render({forceInputs:true});const requested=geometryKey();await $('checkModel').onclick();
  if(requested===geometryKey()&&meshStore.peek(requested)?.stats.components===1)toast('Your SVG now prints as one piece on a round backing.');
};
function setPreviewMode(mode){
  previewMode=mode;
  for(const [id,active]of [['designPreview',mode==='design'],['printPreview',mode==='print']]){$(id).classList.toggle('selected',active);$(id).setAttribute('aria-selected',String(active));$(id).tabIndex=active?0:-1;}
  $('preview').dataset.mode=mode;$('clockObject').hidden=$('clockShadow').hidden=$('measureLine').hidden=mode==='print';
  $('showHandsRow').hidden=mode==='print';$('meshOptions').hidden=mode!=='print';$('previewBadge').textContent=mode==='print'?'Actual print model':'Design preview';
  $('backView').hidden=mode!=='print';$('deskView').hidden=mode!=='print'||!state.deskStand;if(mode==='print')meshCamera(meshCameraView);else{$('backView').classList.remove('selected');$('deskView').classList.remove('selected');view();}
  if(mode==='design'){clearTimeout(meshPreviewTimer);meshPreviewTimer=null;meshPreviewController?.abort();meshPreviewController=null;meshPreviewKey=null;$('meshCanvas').hidden=$('meshState').hidden=true;meshView?.setVisible(false);}
  else scheduleMeshPreview(true);
  updateMeshAppearance();
}
function inspectionKey(snapshot=designSnapshot()){return JSON.stringify([snapshot.geometry,originalArtwork(snapshot.settings)||flatFrontOnBed(snapshot.settings)?paintKey(snapshot):null]);}
function scheduleMeshPreview(immediate=false){
  if(previewMode!=='print')return;
  const snapshot=designSnapshot(),key=snapshot.geometry,textureKey=originalArtwork(snapshot.settings)||flatFrontOnBed(snapshot.settings)?paintKey(snapshot):null,requestedView=inspectionKey(snapshot);
  if(importPending||restorePending||deletingArtwork){
    clearTimeout(meshPreviewTimer);meshPreviewTimer=null;meshPreviewController?.abort();meshPreviewController=null;meshPreviewKey=null;$('meshCanvas').hidden=true;$('meshState').hidden=false;$('meshStateText').textContent='Opening your artwork…';return;
  }
  if(key===loadedMeshKey&&textureKey===loadedTextureKey&&meshView){clearTimeout(meshPreviewTimer);meshPreviewTimer=null;meshPreviewController?.abort();meshPreviewController=null;meshPreviewKey=requestedView;updateMeshAppearance();$('meshState').hidden=true;$('meshCanvas').hidden=false;meshView.setVisible(true);return;}
  if(requestedView===meshPreviewKey&&(meshPreviewController||meshPreviewTimer))return;
  clearTimeout(meshPreviewTimer);meshPreviewController?.abort();meshPreviewKey=requestedView;
  meshView?.setVisible(false);
  $('meshCanvas').hidden=true;$('meshState').hidden=false;$('meshRetry').hidden=true;$('meshStateText').textContent='Preparing your printable model…';$('meshState').dataset.loading='true';
  meshPreviewTimer=setTimeout(async()=>{
    meshPreviewTimer=null;const controller=new AbortController();meshPreviewController=controller;
    try{
      const result=await ensureMesh(snapshot,controller.signal,stage=>{if(!controller.signal.aborted)$('meshStateText').textContent=stageMessage(stage);});
      controller.signal.throwIfAborted();
      if(previewMode!=='print'||requestedView!==inspectionKey())return;
      if(!meshView){const {PrintView}=await import(meshViewURL.href);controller.signal.throwIfAborted();meshView=new PrintView($('meshCanvas'),{onError:error=>{meshView?.dispose();meshView=null;loadedMeshKey=loadedTextureKey=null;$('meshCanvas').hidden=true;$('meshState').hidden=false;$('meshStateText').textContent=error.message;$('meshRetry').hidden=false;}});}
      if(loadedMeshKey===key)await meshView.setTexture(result.artwork?.texture,{signal:controller.signal});
      else await meshView.setModel(result,snapshot.settings,{signal:controller.signal});controller.signal.throwIfAborted();meshCamera(meshCameraView);
      if(previewMode!=='print'||requestedView!==inspectionKey())return;
      loadedMeshKey=key;loadedTextureKey=textureKey;$('meshCanvas').dataset.textureKey=textureKey||'';$('meshCanvas').dataset.geometryKey=key;$('meshCanvas').dataset.triangles=String(result.stats.triangles);
      $('meshCanvas').hidden=false;$('meshState').hidden=true;updateMeshAppearance();meshView.setVisible(true);updatePrintSummary();
    }catch(error){if(error.name!=='AbortError'&&previewMode==='print'&&requestedView===inspectionKey()){$('meshState').hidden=false;$('meshState').dataset.loading='false';$('meshStateText').textContent=meshStore.peek(key)?'The print model is checked, but 3D graphics are unavailable on this device. You can still download your model.':`Could not prepare this model: ${error.message}`;$('meshRetry').hidden=false;meshPreviewKey=null;}}
    finally{if(meshPreviewController===controller)meshPreviewController=null;}
  },immediate?0:400);
}
$('designPreview').onclick=()=>setPreviewMode('design');$('printPreview').onclick=()=>setPreviewMode('print');
$('meshRetry').onclick=()=>{loadedMeshKey=loadedTextureKey=meshPreviewKey=null;scheduleMeshPreview(true);};
function updateMeshAppearance(){
  const showMovement=state.deskStand&&$('movementGuide').checked,guideShown=showMovement&&previewMode==='print';
  $('previewWorkspaceHint').textContent=guideShown?'Blue outline: mechanism space · not printed':'Take a closer look at your clock';
  $('expandedPreviewDescription').textContent=guideShown?'The blue outline reserves mechanism space. It is not included in print files.':'Your current design and print mesh, with more room to inspect.';
  if(!meshView||loadedMeshKey!==geometryKey())return;
  meshView.setMovementSpace(state,showMovement);
  const proof=filamentPreview.meshColors();meshView.setFilaments(proof);meshView.setAppearance(colors[state.color][1],$('meshColors').checked,$('meshWireframe').checked);
  $('meshColorLabel').textContent=proof?'Print colors':'SVG colors';
}
for(const id of ['meshColors','meshWireframe','movementGuide'])$(id).onchange=updateMeshAppearance;
$('meshBed').onchange=updatePrintSummary;
$('openProject').onclick=()=>$('projectUpload').click();
$('saveProject').onclick=()=>{
  if(importPending||restorePending||deletingArtwork)return;
  try{const text=serializeProject(state,activeArtwork,artworkOrientation);downloadFile(new Blob([text],{type:'application/json'}),projectFilename(state.projectName),'project');toast('Your project file is ready, with your settings and original SVG. Open the saved .clock file to continue on another device.');}
  catch(error){toast('Could not save project: '+error.message);}
};
$('projectUpload').onchange=async event=>{
  const file=event.target.files[0];event.target.value='';if(!file||deletingArtwork)return;
  cancelRestoration();const sequence=++importSequence;importPending=true;updateArtworkUI();
  try{
    if(file.size>MAX_PROJECT_BYTES)throw Error('Choose a project smaller than 12 MB.');
    const project=parseProject(await file.text()),prepared=project.artwork?await prepareSVG(project.artwork.source):null;
    if(sequence!==importSequence)return;
    state={...project.settings};artworkOrientation=project.orientation;
    if(prepared){customSVG=prepared.markup;customArtwork=prepared.artworkMarkup;customImage=prepared.image;activeArtwork={...project.artwork,id:null,size:new TextEncoder().encode(project.artwork.source).byteLength,thumbnail:thumbnailFor(prepared.image)};}
    else{customSVG=customArtwork=customImage=null;activeArtwork=null;}
    customRevision=++revisionCounter;clearArtworkCache();render({forceInputs:true});tab(state.design==='custom');
    if(activeArtwork){try{const saved=await saveSVG(activeArtwork);if(sequence!==importSequence)return;activeArtwork=saved;}catch(error){if(sequence!==importSequence)return;$('uploadStatus').textContent=error.message;}}
    if(sequence!==importSequence)return;
    if(activeArtwork)$('uploadStatus').textContent=`Loaded ${activeArtwork.name}. ${activeArtwork.id?'Saved on this device.':'Available for this session.'}`;
    toast(`Opened ${state.projectName}. Your settings and artwork are restored.`);refreshGallery();
  }catch(error){if(sequence===importSequence)toast('Could not open project: '+error.message);}
  finally{if(sequence===importSequence){importPending=false;updateArtworkUI();persist();checkpointHistory();updateHistoryUI();updatePrintSummary();scheduleMeshPreview();}}
};
window.addEventListener('pagehide',()=>{meshPreviewController?.abort();checkController?.abort();meshView?.dispose();filamentPreview.dispose();holeFit.dispose();});
$('cancelExport').onclick=()=>exportController?.abort();
$('export').onclick=async()=>{
  if(importPending||deletingArtwork||restorePending||exportController||!validateDimensions(true))return;
  const snapshot=designSnapshot(),settings=snapshot.settings,key=fileKey(settings);
  if(exportCache?.key===key){showFilamentPalette(exportCache.palette);downloadClock(exportCache.blob,settings,key);return;}
  const controller=new AbortController();exportController=controller;
  holeFit.update();
  const button=$('export');button.disabled=true;button.textContent='Preparing your clock…';
  $('exportProgress').hidden=false;$('printSection').setAttribute('aria-busy','true');
  $('exportStatus').textContent='Preparing your shape… You can keep designing.';
  await new Promise(r=>setTimeout(r,0));
  try{
    controller.signal.throwIfAborted();
    const onStage=stage=>{$('exportStatus').textContent=stageMessage(stage);const progress=$('exportProgress').querySelector('progress');progress.max=100;progress.value={outline:15,details:40,mesh:70,filaments:80,package:90}[stage]||5;};
    const mesh=await ensureMesh(snapshot,controller.signal,onStage,{withTexture:settings.exportFormat==='3mf'&&settings.threeMFTarget==='standard'});
    let artwork=mesh.artwork;
    if(settings.exportFormat==='3mf'&&settings.threeMFTarget==='bambu-a1'){onStage('filaments');artwork={...artwork,painting:prepareFilamentRaster(snapshot),analysis:filamentPreview.analysisFor(filamentKey(snapshot))};await new Promise(resolve=>setTimeout(resolve,0));controller.signal.throwIfAborted();}
    const result=settings.exportFormat==='3mf'?await meshAsync(null,0,settings,controller.signal,mesh.stlBuffer,artwork,onStage,mesh.stats):{buffer:mesh.stlBuffer};
    controller.signal.throwIfAborted();
    const blob=new Blob([result.buffer],{type:settings.exportFormat==='3mf'?'model/3mf':'model/stl'});exportCache={key,blob,palette:result.palette};showFilamentPalette(result.palette);
    downloadClock(blob,settings,key);
  }catch(error){
    if(error.name==='AbortError')toast('Download cancelled. Your design is still here.');
    else toast('Could not export: '+error.message);
  }finally{
    exportController=null;button.disabled=importPending||deletingArtwork||restorePending;updateExportFormatUI();validateDimensions();
    $('exportProgress').hidden=true;$('printSection').setAttribute('aria-busy','false');holeFit.update();
  }
};
const holeFit=new HoleFitDialog({workerURL,getHole:()=>state.hole,isBusy:()=>importPending||restorePending||deletingArtwork||!!exportController||$('hole').value===''||!$('hole').validity.valid,getHeight:()=>{
  const stats=meshStore.peek(geometryKey())?.stats;
  const extra=flatFrontOnBed(state)?0:originalArtwork()?state.svgRelief+(state.markers?.8:0):Math.max(state.texture==='smooth'?0:.4,state.markers?.8:0);
  return {value:stats?.dimensions[2]??artworkSurfaceHeight(state)+extra+(state.deskStand?state.standDepth:raisedMechanismBox(state)?state.recessDepth:0),measured:!!stats};
},onSelect:hole=>{state.hole=hole;delete $('hole').dataset.editing;render();}});
const filamentPreview=new FilamentPreview({workerURL,prepareRaster:prepareFilamentRaster,onReady:updateMeshAppearance,onColorChange:(source,color,final)=>{
  const overrides={...state.bambuColors};if(source===color.toUpperCase())delete overrides[source];else overrides[source]=color;
  state.bambuColors=normalizeFilamentOverrides(overrides);render({historyGroup:'filament-'+source});if(final)history.endGroup();
},onReset:()=>{state.bambuColors={};render();}});
render();view();
refreshGallery();
if(restoreReference){
  const reference={...restoreReference};if(reference.useCustom)tab(true);
  loadSavedArtwork(reference.id,{restoring:true,useCustom:reference.useCustom,orientation:reference.orientation});
}
