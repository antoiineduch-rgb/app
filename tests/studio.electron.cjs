// Full desktop workflow, including real software WebGL rendering. The shipped
// app keeps its normal graphics settings; deterministic flags are test-only.
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {app,Menu,session,nativeImage}=require('electron');
const profile=mkdtempSync(join(tmpdir(),'clock-studio-tests-'));
app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let finished=false;
const watchdog=setTimeout(()=>finish(Error('Studio checks exceeded 180 seconds.')),180000);
function finish(error){if(finished)return;finished=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All project, history, print inspection, and 3D studio regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});
process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_event,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));

async function run(window){
  const {analyzeSTL}=await import('../mesh-analysis.js');
  const {parseProject}=await import('../project.js');
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value,event='input')=>evaluate((id,value,event)=>{const input=document.getElementById(id);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));},id,value,event);
  const wait=async(fn,description)=>{const deadline=Date.now()+30000;while(Date.now()<deadline){const result=await evaluate(fn);if(result)return result;await new Promise(resolve=>setTimeout(resolve,30));}throw Error('Timed out: '+description+'; '+await evaluate(()=>document.getElementById('meshStateText').textContent+'; '+document.getElementById('toast').textContent));};
  async function hooks(){await evaluate(()=>{
    window.__studioErrors=[];window.addEventListener('error',event=>window.__studioErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__studioErrors.push(String(event.reason)));
    window.__studioDownloads=[];window.__studioBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__studioBlobs.set(url,blob);return url;};
    window.__studioAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__studioDownloads.push({name:this.download,url:this.href});};
    window.__studioBuilds=0;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(message,...rest){if(message.alpha)window.__studioBuilds++;return post.call(this,message,...rest);};
  });}
  async function download(id='export'){
    const result=await evaluate(async id=>{
      const before=window.__studioDownloads.length;document.getElementById(id).click();const deadline=performance.now()+30000;
      while(window.__studioDownloads.length===before&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
      const file=window.__studioDownloads[before];if(!file)throw Error('Download failed: '+document.getElementById('toast').textContent);
      return {name:file.name,bytes:Array.from(new Uint8Array(await window.__studioBlobs.get(file.url).arrayBuffer()))};
    },id);
    return {name:result.name,buffer:Buffer.from(result.bytes)};
  }
  async function upload(id,text,name){await evaluate(async(id,text,name)=>{const input=document.getElementById(id),files=new DataTransfer();files.items.add(new File([text],name,{type:id==='svgUpload'?'image/svg+xml':'application/json'}));input.files=files.files;await input.onchange({target:input});},id,text,name);}
  async function modelReady(){return wait(()=>!document.getElementById('meshCanvas').hidden&&!!document.querySelector('#meshCanvas canvas')&&document.querySelector('#meshCanvas canvas').dataset.triangles,'real 3D mesh');}
  const diameter=()=>evaluate(()=>Number(document.getElementById('diameter').value));
  await hooks();
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  await click('dismissWelcome');assert.equal(await evaluate(()=>document.getElementById('welcome').hidden),true);
  assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas')!==null),false,'3D is not initialized until requested');
  await set('diameter',150);await set('diameter',170);await set('diameter',187);await evaluate(()=>document.getElementById('diameter').dispatchEvent(new Event('change',{bubbles:true})));
  await click('undo');assert.equal(await diameter(),200,'one slider gesture is one undo');await click('redo');assert.equal(await diameter(),187);
  await evaluate(()=>{document.getElementById('clockStage').focus();document.getElementById('clockStage').dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));});assert.equal(await diameter(),200);
  await click('redo');assert.equal(await diameter(),187);
  const edit=Menu.getApplicationMenu().items.find(item=>item.label==='Edit').submenu;
  edit.items.find(item=>item.label==='Undo design change').click(null,window);await wait(()=>document.getElementById('diameter').value==='200','native menu undo');
  await click('redo');
  await set('diameterNumber',193);assert.equal(await diameter(),193,'exact sizes do not round to ten millimeters');
  await set('diameterNumber','');assert.equal(await evaluate(()=>document.getElementById('export').disabled),true);assert.equal(await evaluate(()=>document.getElementById('sizeError').hidden),false);
  await set('diameterNumber',187);await set('showHands',false,'change');assert.equal(await evaluate(()=>document.getElementById('previewHands').hasAttribute('hidden')),true);
  await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());await set('markers',false);
  console.log('PASS undo/redo, grouped sliders, keyboard/native menus, exact sizing, validation, and optional preview hands');

  await click('printPreview');const printed=await download();await modelReady();
  const stats=analyzeSTL(printed.buffer),canvasCount=await evaluate(()=>Number(document.querySelector('#meshCanvas canvas').dataset.triangles));
  assert.equal(stats.triangles,canvasCount);assert.equal(await evaluate(()=>window.__studioBuilds),1,'3D and download reuse one mesh build');
  assert.equal(await evaluate(()=>document.getElementById('printCheckStatus').dataset.checked),'true');assert.equal(await evaluate(()=>document.getElementById('modelParts').textContent),'1');
  assert.ok(Math.abs(Math.max(...stats.dimensions.slice(0,2))-187)<.002&&Math.abs(stats.dimensions[2]-3)<1e-6,JSON.stringify(stats.dimensions));
  await click('frontView');await click('angleView');await click('zoomIn');await click('zoomOut');await set('meshWireframe',true,'change');await set('meshWireframe',false,'change');
  assert.equal(await evaluate(()=>window.__studioBuilds),1,'view changes do not rebuild geometry');
  console.log('PASS a real WebGL print view uses the exported mesh and shares its build with download');

  const detailed=readFileSync(join(__dirname,'fixtures/detailed-artwork.svg'),'utf8');
  await upload('svgUpload',detailed,'detailed-artwork.svg');await set('projectName','Mon horloge');await evaluate(()=>document.getElementById('projectName').blur());
  await click('artRotateRight');await click('artMirrorX');await modelReady();
  const saved=await download('saveProject'),project=parseProject(saved.buffer.toString('utf8'));
  assert.equal(saved.name,'Mon horloge.clock');assert.equal(project.artwork.source,detailed);assert.deepEqual(project.orientation,[0,1,1,0]);assert.equal(project.settings.diameter,187);
  await click('reset');assert.match(await evaluate(()=>document.getElementById('designTitle').textContent),/Petal/);await click('undo');
  await wait(()=>!document.getElementById('undo').disabled&&document.getElementById('designTitle').textContent.includes('Custom'),'undo reset with SVG');
  assert.equal(await evaluate(()=>document.getElementById('projectName').value),'Mon horloge');assert.ok(await evaluate(()=>!!document.getElementById('originalArtwork')));
  await click('reset');await upload('projectUpload',saved.buffer.toString('utf8'),saved.name);
  assert.equal(await evaluate(()=>document.getElementById('projectName').value),'Mon horloge');assert.equal(await diameter(),187);
  assert.ok(await evaluate(()=>!!document.getElementById('originalArtwork')));
  const reopened=parseProject((await download('saveProject')).buffer.toString('utf8'));assert.deepEqual(reopened,project);
  await upload('projectUpload','{"format":"broken"}','broken.clock');assert.equal(await evaluate(()=>document.getElementById('projectName').value),'Mon horloge');assert.match(await evaluate(()=>document.getElementById('toast').textContent),/Could not open project/);
  console.log('PASS portable projects keep settings, source SVG and orientation; reset can be undone; invalid files preserve current work');

  await set('diameterNumber',257);await set('bedWidth',180);await set('bedDepth',180);await click('checkModel');
  await wait(()=>!document.getElementById('fitToBed').hidden,'oversized build plate warning');assert.equal(await evaluate(()=>document.getElementById('bedStatus').dataset.tone),'warning');
  await click('fitToBed');assert.ok(await diameter()<=176);await click('checkModel');
  await wait(()=>document.getElementById('bedStatus').dataset.tone==='success','resized model fits');
  const fitted=analyzeSTL((await download()).buffer);assert.ok(fitted.dimensions[0]<180&&fitted.dimensions[1]<180);
  const islands='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160"><circle cx="65" cy="80" r="50" fill="#24382d"/><circle cx="235" cy="80" r="50" fill="#6c9264"/></svg>';
  await upload('svgUpload',islands,'two-pieces.svg');await click('checkModel');
  await wait(()=>document.getElementById('modelParts').textContent==='2','separate component detection');assert.equal(await evaluate(()=>document.getElementById('printCheckStatus').dataset.tone),'warning');
  console.log('PASS actual build plate checks, one-click resize, and disconnected-part detection match exported geometry');

  await upload('projectUpload',saved.buffer.toString('utf8'),saved.name);await click('printPreview');await modelReady();
  await evaluate(()=>{
    window.__meshTextureDecodeStarted=false;window.__meshTextureDecodeDone=false;window.__releaseMeshTexture=null;
    const original=Image.prototype.decode;window.__normalMeshDecode=original;
    Image.prototype.decode=async function(...args){const ready=original.apply(this,args);if(this.src.startsWith('blob:')){window.__meshTextureDecodeStarted=true;await new Promise(resolve=>window.__releaseMeshTexture=resolve);}try{return await ready;}finally{window.__meshTextureDecodeDone=true;}};
  });
  await set('diameterNumber',199);await evaluate(()=>document.getElementById('diameterNumber').dispatchEvent(new Event('change',{bubbles:true})));
  await wait(()=>window.__meshTextureDecodeStarted,'delayed mesh texture decoding');
  await click('undo');await wait(()=>!document.getElementById('undo').disabled&&document.getElementById('diameter').value==='187','undo while a new 3D texture is decoding');
  await evaluate(()=>{Image.prototype.decode=window.__normalMeshDecode;window.__releaseMeshTexture();});await wait(()=>window.__meshTextureDecodeDone,'obsolete texture decode to finish');
  await new Promise(resolve=>setTimeout(resolve,50));
  assert.ok(Math.abs(await evaluate(()=>Number(document.querySelector('#meshCanvas canvas').dataset.span))-187)<.002,'an obsolete texture job cannot replace the restored 3D geometry');
  console.log('PASS undo during asynchronous texture loading keeps the current printable mesh');
  await evaluate(()=>document.getElementById('preview').scrollIntoView({block:'start'}));await new Promise(resolve=>setTimeout(resolve,150));
  const capture=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));if(screenshot)writeFileSync(screenshot.slice('--screenshot-output='.length),Buffer.from(capture.data,'base64'));
  const bounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
  const bitmap=nativeImage.createFromBuffer(Buffer.from(capture.data,'base64')).crop(bounds).toBitmap();let red=0,blue=0,green=0;
  for(let i=0;i<bitmap.length;i+=4){const b=bitmap[i],g=bitmap[i+1],r=bitmap[i+2];if(r>b+25&&r>g+15)red++;if(b>r+25&&b>g+15)blue++;if(g>r+10&&g>b+8)green++;}
  assert.ok(red>100&&blue>100&&green>150,`the actual 3D frame contains the SVG red, blue and green details: ${JSON.stringify({red,blue,green,bounds})}`);
  const count=await evaluate(()=>window.__studioBuilds);await evaluate(()=>document.querySelectorAll('.swatch')[2].click());await modelReady();assert.equal(await evaluate(()=>window.__studioBuilds),count,'filament recoloring reuses the mesh');
  await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'the mobile workspace has no horizontal overflow');
  await click('designPreview');await evaluate(()=>document.getElementById('artworkCard').scrollIntoView({block:'start'}));
  const mobile=process.argv.find(arg=>arg.startsWith('--mobile-screenshot-output='));if(mobile){const image=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});writeFileSync(mobile.slice('--mobile-screenshot-output='.length),Buffer.from(image.data,'base64'));}
  assert.deepEqual(await evaluate(()=>window.__studioErrors),[]);
  console.log('PASS painted 3D rendering, cached recoloring, and the responsive mobile workspace');

  await evaluate(()=>{HTMLAnchorElement.prototype.click=window.__studioAnchorClick;});
  const nativePath=join(profile,'native-project.clock');
  const nativeDownload=new Promise((resolve,reject)=>{
    session.defaultSession.once('will-download',(_event,item)=>{try{assert.equal(item.getFilename(),'Mon horloge.clock');assert.ok(item.getSaveDialogOptions().filters.some(filter=>filter.extensions.includes('clock')));item.setSavePath(nativePath);item.once('done',(_event,state)=>state==='completed'?resolve():reject(Error('Native project save: '+state)));}catch(error){reject(error);}});
  });
  await click('saveProject');await nativeDownload;assert.equal(parseProject(readFileSync(nativePath,'utf8')).artwork.source,detailed);
  console.log('PASS the Windows desktop download path supports genuine .clock project files');

  window.webContents.debugger.detach();await new Promise(resolve=>{window.webContents.once('did-finish-load',resolve);window.webContents.reload();});await hooks();
  await wait(()=>!!document.getElementById('originalArtwork'),'saved SVG restoration');assert.equal(await evaluate(()=>document.getElementById('welcome').hidden),true);
  await evaluate(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){return type.startsWith('webgl')?null:get.call(this,type,...rest);};});
  await click('printPreview');await wait(()=>!document.getElementById('meshRetry').hidden,'3D graphics fallback');
  assert.equal(await evaluate(()=>document.getElementById('printCheckStatus').dataset.checked),'true');assert.ok(analyzeSTL((await download()).buffer).triangles>100);
  await click('designPreview');assert.equal(await evaluate(()=>document.getElementById('clockObject').hidden),false);
  console.log('PASS unavailable 3D graphics preserve print checks, SVG design, and downloads');
}
require('../desktop/main.cjs');
