// Real OS-file drag events and native clipboard paste in the shipped sandboxed app.
// Run separately from other GUI suites: the OS clipboard and window focus are shared.
const assert=require('node:assert/strict');
const {app,clipboard,Menu}=require('electron');
const {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-quick-import-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Quick import checks exceeded 180 seconds.')),180000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All file drop, clipboard SVG and safe import checks passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));

async function run(window){
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true).catch(error=>{throw Error(error.message+' in '+fn.toString().slice(0,180));});
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const wait=async(fn,label,...args)=>{const end=Date.now()+30000;while(Date.now()<end){const value=await evaluate(fn,...args);if(value)return value;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out '+label+'; '+await evaluate(()=>document.getElementById('uploadStatus').textContent+'; '+document.getElementById('pasteSvgStatus').textContent+'; '+document.getElementById('toast').textContent));};
  const ready=name=>wait(name=>!document.getElementById('saveProject').disabled&&document.getElementById('artworkName').textContent===name,'artwork '+name,name);
  const set=(id,value,event='input')=>evaluate((id,value,event)=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event(event,{bubbles:true}));},id,value,event);
  async function hooks(){await evaluate(()=>{
    window.__importErrors=[];window.addEventListener('error',e=>window.__importErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__importErrors.push(String(e.reason)));
    window.__importFiles=[];window.__importBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__importBlobs.set(url,blob);return url;};HTMLAnchorElement.prototype.click=function(){if(this.download)window.__importFiles.push({name:this.download,url:this.href});};
  });}
  async function file(id='saveProject'){
    const value=await evaluate(async id=>{const count=window.__importFiles.length;document.getElementById(id).click();const end=performance.now()+30000;while(window.__importFiles.length===count&&performance.now()<end)await new Promise(r=>setTimeout(r,20));const f=window.__importFiles[count];if(!f)throw Error('No download: '+document.getElementById('toast').textContent);return Array.from(new Uint8Array(await window.__importBlobs.get(f.url).arrayBuffer()));},id);return Buffer.from(value);
  }
  async function nativeDrop(paths,{target='clockStage',beforeDrop}={}){
    window.focus();window.webContents.focus();
    const point=await evaluate(id=>{const e=document.getElementById(id);e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+Math.min(r.height/2,180))};},target);
    const data={items:[],files:paths,dragOperationsMask:1};
    for(const type of ['dragEnter','dragOver'])await window.webContents.debugger.sendCommand('Input.dispatchDragEvent',{type,...point,data});
    if(beforeDrop)await beforeDrop();
    await window.webContents.debugger.sendCommand('Input.dispatchDragEvent',{type:'drop',...point,data});
    assert.equal(await evaluate(()=>document.getElementById('fileDropOverlay').hidden),true);
  }
  async function nativePaste(text,target='clockStage'){
    window.focus();window.webContents.focus();
    clipboard.writeText(text);await evaluate(id=>document.getElementById(id).focus(),target);window.webContents.paste();
  }
  const preset=id=>evaluate(id=>document.querySelector(`[data-design="${id}"]`).click(),id);
  const svg=readFileSync(join(__dirname,'fixtures/bambu-colors.svg'),'utf8'),svgPath=join(profile,'Dropped colors.SVG');writeFileSync(svgPath,svg);
  const invalid=join(profile,'Broken.svg'),unsupported=join(profile,'Photo.png'),large=join(profile,'Too large.svg'),folder=join(profile,'A folder.svg');
  writeFileSync(invalid,'<svg xmlns="http://www.w3.org/2000/svg"><path');writeFileSync(unsupported,'not SVG');writeFileSync(large,' '.repeat(5*1024*1024+1));mkdirSync(folder);
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});await hooks();await click('dismissWelcome');
  await evaluate(async text=>{const input=document.getElementById('svgUpload'),data=new DataTransfer();data.items.add(new File([text],'From picker.svg',{type:'image/svg+xml'}));input.files=data.files;await input.onchange({target:input});},svg);
  await ready('From picker.svg');await set('diameter',180);await click('applyClockSetup');await set('deskStand',true);await set('standClearance',8);await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true','initial colors');
  const baseline=await file('export'),palette=JSON.parse(strFromU8(unzipSync(baseline)['Metadata/project_settings.config'])).filament_colour;assert.equal(palette.length,4);
  await preset('wave');
  await nativeDrop([svgPath],{beforeDrop:async()=>{assert.equal(await evaluate(()=>document.getElementById('fileDropOverlay').hidden),false);assert.equal(await evaluate(()=>document.getElementById('fileDropOverlay').dataset.blocked),'false');await evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));writeFileSync(join(tmpdir(),'clock-file-drop.png'),(await window.webContents.capturePage()).toPNG());}});
  await ready('Dropped colors.SVG');assert.equal(await evaluate(()=>document.getElementById('uploadPanel').hidden),false);assert.deepEqual(await file('export'),baseline,'file drops retain all geometry and Bambu colors');
  await click('undo');await wait(()=>document.querySelector('[data-design="wave"]').classList.contains('selected'),'single-step drop undo');await nativeDrop([svgPath],{target:'svgDropZone'});await ready('Dropped colors.SVG');
  console.log('PASS native file drops on the preview and upload zone, visible feedback, one-step undo, and byte-identical Bambu color exports');

  const before=await file();
  for(const [paths,message]of [[[svgPath,invalid],'one file'],[[unsupported],'not supported'],[[large],'5 MB'],[[folder],'instead of a folder']]){
    await nativeDrop(paths);await wait(message=>document.getElementById('quickImportStatus').textContent.includes(message),'rejected drop',message);assert.deepEqual(await file(),before,'rejected file drop preserves the complete current clock');
  }
  await nativeDrop([invalid]);await wait(()=>document.getElementById('uploadStatus').textContent.includes('Couldn’t import'),'invalid SVG');assert.deepEqual(await file(),before);assert.equal(window.webContents.getURL(),'clock://studio/index.html');
  await click('myProjects');await wait(()=>document.getElementById('projectsDialog').getAttribute('aria-busy')==='false','project library');
  await nativeDrop([svgPath],{target:'projectsHeading',beforeDrop:async()=>{assert.equal(await evaluate(()=>document.getElementById('fileDropOverlay').dataset.blocked),'true');assert.match(await evaluate(()=>document.getElementById('fileDropHint').textContent),/Close this panel/);}});
  assert.equal(await evaluate(()=>document.getElementById('projectsDialog').open),true);await click('closeProjects');assert.deepEqual(await file(),before);
  console.log('PASS multiple files, folders, oversized and unsupported files, malformed SVG, and open-panel protection without replacing the design');

  await nativePaste('ordinary clipboard text');await new Promise(r=>setTimeout(r,75));assert.deepEqual(await file(),before);
  await nativePaste(svg,'projectName');await wait(()=>document.getElementById('projectName').value!=='My Clock','normal text paste');assert.equal(await evaluate(()=>document.getElementById('artworkName').textContent),'Dropped colors.SVG');await set('projectName','My Clock');
  await preset('arch');await nativePaste('\uFEFF<?xml version="1.0"?>\n<!-- copied vector -->\n'+svg);await ready('Pasted artwork.svg');assert.deepEqual(await file('export'),baseline,'native clipboard import preserves detailed SVG colors and geometry');
  assert.equal(await evaluate(text=>{const data=new DataTransfer();data.items.add(new File(['preview'],'Preview.png',{type:'image/png'}));data.setData('image/svg+xml',text);const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data});document.getElementById('clockStage').dispatchEvent(event);return event.defaultPrevented;},svg),true);await ready('Pasted artwork.svg');assert.deepEqual(await file('export'),baseline,'SVG clipboard data takes priority over an accompanying raster preview');
  await click('pasteSvg');assert.equal(await evaluate(()=>document.getElementById('pasteSvgDialog').open),true);await click('usePastedSvg');assert.match(await evaluate(()=>document.getElementById('pasteSvgStatus').textContent),/Paste SVG code/);
  await set('pasteSvgSource','<svg xmlns="http://www.w3.org/2000/svg"><path');const intact=await file();await click('usePastedSvg');await wait(()=>document.getElementById('pasteSvgStatus').dataset.tone==='error','invalid code feedback');assert.equal(await evaluate(()=>document.getElementById('pasteSvgDialog').open),true);assert.deepEqual(await file(),intact);
  await evaluate(()=>{document.getElementById('pasteSvgSource').value='<svg>'+ 'é'.repeat(5*1024*1024/2+1)+'</svg>';});await click('usePastedSvg');assert.match(await evaluate(()=>document.getElementById('pasteSvgStatus').textContent),/5 MB/);
  await set('pasteSvgSource','');await nativePaste(svg,'pasteSvgSource');await wait(()=>document.getElementById('pasteSvgSource').value.includes('<svg'),'textarea clipboard paste');
  const undo=Menu.getApplicationMenu().items.find(item=>item.label==='Edit').submenu.items.find(item=>item.label==='Undo design change');undo.click(undo,window);await wait(()=>document.getElementById('pasteSvgSource').value==='','native text undo');
  await evaluate(()=>document.getElementById('usePastedSvg').focus());undo.click(undo,window);await new Promise(r=>setTimeout(r,75));assert.deepEqual(await file(),intact,'undo on a modal button cannot edit the clock behind it');
  await nativePaste(svg,'pasteSvgSource');await wait(text=>document.getElementById('pasteSvgSource').value===text,'corrected source',svg);window.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter',modifiers:['control']});window.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter',modifiers:['control']});await wait(()=>!document.getElementById('pasteSvgDialog').open,'keyboard SVG import');await ready('Pasted artwork.svg');assert.deepEqual(await file('export'),baseline);
  console.log('PASS native clipboard imports, XML declarations/comments, normal text fields, editable SVG errors, UTF-8 size limits, native text undo, and Ctrl+Enter');

  const project=await file(),projectPath=join(profile,'Saved clock.clock');writeFileSync(projectPath,project);
  await preset('petal');await nativeDrop([projectPath]);await ready('Pasted artwork.svg');assert.deepEqual(await file(),project,'dropped projects restore all original SVG, hours, stand, mechanism and colors');assert.deepEqual(await file('export'),baseline);
  const badProject=join(profile,'Broken.clock');writeFileSync(badProject,'{}');await nativeDrop([badProject]);await wait(()=>document.getElementById('toast').textContent.includes('Could not open project'),'invalid project');assert.deepEqual(await file(),project);
  await evaluate(()=>{const original=File.prototype.text;window.__lateRead=null;File.prototype.text=function(){if(this.name==='Dropped colors.SVG')return new Promise(resolve=>{window.__lateRead=()=>original.call(this).then(resolve);});return original.call(this);};});
  await nativeDrop([svgPath]);await wait(()=>!!window.__lateRead,'delayed SVG read');await click('reset');await preset('wave');await evaluate(()=>{window.__lateRead();});await new Promise(r=>setTimeout(r,150));assert.equal(await evaluate(()=>document.querySelector('.design-card.selected').dataset.design),'wave');assert.equal(await evaluate(()=>document.getElementById('artworkCard').hidden),true);
  console.log('PASS complete .clock file drops, corrupt-project preservation, and newer edits winning over delayed SVG reads');

  await click('uploadTab');
  for(const width of [320,390]){
    await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height:780,deviceScaleFactor:1,mobile:false});await evaluate(()=>document.getElementById('pasteSvg').focus());await click('pasteSvg');await set('pasteSvgSource',svg);
    const layout=await evaluate(()=>{const dialog=document.getElementById('pasteSvgDialog');return {fits:dialog.scrollWidth<=dialog.clientWidth,buttons:['closePasteSvg','usePastedSvg'].every(id=>document.getElementById(id).getBoundingClientRect().height>=44),focus:document.activeElement.id};});assert.equal(layout.fits,true);assert.equal(layout.buttons,true);assert.equal(layout.focus,'pasteSvgSource');
    if(width===390){await evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));writeFileSync(join(tmpdir(),'clock-paste-svg-mobile.png'),(await window.webContents.capturePage()).toPNG());}await click('closePasteSvg');await wait(()=>document.activeElement.id==='pasteSvg','return focus');
  }
  await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  assert.deepEqual(await evaluate(()=>window.__importErrors),[]);writeFileSync(join(tmpdir(),'clock-quick-import.3mf'),baseline);
  console.log('PASS 320/390 px layouts, touch targets, keyboard focus restoration, and no renderer errors');
}
require('../desktop/main.cjs');
