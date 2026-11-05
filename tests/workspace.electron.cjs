const assert=require('node:assert/strict');
const {app,session,nativeImage}=require('electron');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const profile=mkdtempSync(join(tmpdir(),'clock-workspace-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Workspace checks exceeded 180 seconds.')),180000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All expanded preview, precise editing, and native save receipt checks passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));

async function run(window){
  const {analyzeSTL}=await import('../mesh-analysis.js'),{parseProject}=await import('../project.js');
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value,event='input')=>evaluate((id,value,event)=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event(event,{bubbles:true}));},id,value,event);
  const key=(id,key)=>evaluate((id,key)=>document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),id,key);
  const wait=async(fn,label,...args)=>{const end=Date.now()+30000;while(Date.now()<end){const value=await evaluate(fn,...args);if(value)return value;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Timed out '+label+'; '+await evaluate(()=>document.getElementById('toast').textContent));};
  const metrics=(width,height=900)=>window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await evaluate(()=>{
    window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
    window.__blobs=new Map();window.__downloads=[];const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__blobs.set(url,blob);return url;};
    window.__nativeClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__downloads.push({name:this.download,url:this.href});};
    window.__builds=0;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(message,...args){if(message.alpha)window.__builds++;return post.call(this,message,...args);};
  });
  async function file(){
    const bytes=await evaluate(async()=>{const before=window.__downloads.length;document.getElementById('export').click();const end=performance.now()+30000;while(window.__downloads.length===before&&performance.now()<end)await new Promise(r=>setTimeout(r,20));const saved=window.__downloads[before];if(!saved)throw Error(document.getElementById('toast').textContent);return Array.from(new Uint8Array(await window.__blobs.get(saved.url).arrayBuffer()));});return Buffer.from(bytes);
  }
  async function nativeSave(id,path,{cancel=false}={}){
    const completed=new Promise((resolve,reject)=>session.defaultSession.once('will-download',(_,item)=>{
      item.once('done',(_event,state)=>resolve(state));try{if(cancel)item.cancel();else item.setSavePath(path);}catch(error){reject(error);}
    }));await click(id);return completed;
  }
  async function receipt(kind,state){return wait((kind,state)=>{const root=document.querySelector(`[data-file-feedback="${kind}"]`);return !root.hidden&&root.dataset.state===state&&root.textContent;},'native '+kind+' '+state,kind,state);}
  window.webContents.debugger.attach('1.3');await metrics(1380);await click('dismissWelcome');
  assert.deepEqual(await evaluate(()=>Object.keys(window.clockDesktop)),['onDownload']);assert.equal(await evaluate(()=>typeof window.require),'undefined');
  const preferences=window.webContents.getLastWebPreferences();assert.equal(preferences.sandbox,true);assert.equal(preferences.contextIsolation,true);assert.equal(preferences.nodeIntegration,false);

  await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());await set('markers',false);
  await set('thickness','');await set('diameterNumber',223);assert.equal(await evaluate(()=>document.getElementById('diameter').value),'223');
  await set('hole','');await set('diameterNumber',227);await set('thickness',3.5);assert.equal(await evaluate(()=>document.getElementById('export').disabled),true);await set('hole',8.3);
  const measured=analyzeSTL(await file());assert.ok(Math.abs(Math.max(...measured.dimensions.slice(0,2))-227)<.005);assert.ok(Math.abs(measured.dimensions[2]-3.5)<.00001);
  await set('diameterNumber','');await evaluate(()=>document.querySelector('[data-size="150"]').click());assert.equal(await evaluate(()=>document.getElementById('diameterNumber').value),'150');assert.equal(await evaluate(()=>document.getElementById('export').disabled),false);
  await set('diameterNumber',150.5);await set('diameter',211);assert.equal(await evaluate(()=>document.getElementById('diameterNumber').value),'211');assert.equal(await evaluate(()=>document.getElementById('export').disabled),false);
  console.log('PASS independently valid measurements are preserved, exported at the correct size, and recover through presets or the slider');

  await evaluate(()=>{document.getElementById('expandPreview').focus();window.__originalPreview=document.getElementById('preview');document.getElementById('preview').scrollIntoView({block:'center'});window.__scroll=scrollY;});
  const normalHeight=await evaluate(()=>document.getElementById('preview').getBoundingClientRect().height);
  await click('expandPreview');assert.equal(await evaluate(()=>document.getElementById('previewDialog').open),true);assert.equal(await evaluate(()=>document.getElementById('preview')===window.__originalPreview),true);
  assert.ok(await evaluate(height=>document.getElementById('preview').getBoundingClientRect().height>height,normalHeight));assert.equal(await evaluate(()=>document.querySelectorAll('#preview').length),1);assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas')!==null),false);
  const transform=await evaluate(()=>document.getElementById('clockObject').style.transform);await key('clockStage','ArrowLeft');await key('clockStage','+');assert.notEqual(await evaluate(()=>document.getElementById('clockObject').style.transform),transform);await key('clockStage','0');assert.equal(await evaluate(()=>document.getElementById('clockObject').style.transform),transform);
  window.webContents.sendInputEvent({type:'keyDown',keyCode:'TAB'});window.webContents.sendInputEvent({type:'keyUp',keyCode:'TAB'});assert.equal(await evaluate(()=>!!document.activeElement.closest('#previewDialog')),true);
  window.webContents.sendInputEvent({type:'keyDown',keyCode:'ESC'});window.webContents.sendInputEvent({type:'keyUp',keyCode:'ESC'});await wait(()=>!document.getElementById('previewDialog').open,'Escape closes preview');
  assert.equal(await evaluate(()=>document.activeElement.id),'expandPreview');assert.ok(await evaluate(()=>Math.abs(scrollY-window.__scroll)<2));assert.equal(await evaluate(()=>document.getElementById('preview').parentElement.classList.contains('preview-column')),true);

  await click('printPreview');await wait(()=>!document.getElementById('meshCanvas').hidden&&document.querySelector('#meshCanvas canvas')?.dataset.triangles,'real 3D preview');const original=await file();
  await evaluate(()=>{window.__originalCanvas=document.querySelector('#meshCanvas canvas');window.__modelLoads=window.__originalCanvas.dataset.modelLoads;window.__beforeBuilds=window.__builds;});
  await click('expandPreview');await wait(()=>document.querySelector('#meshCanvas canvas').width>800,'expanded GPU canvas');await evaluate(()=>document.querySelector('#meshCanvas canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'1',bubbles:true})));
  assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas').dataset.view),'front');await key('clockStage','ArrowUp');await key('clockStage','+');await key('clockStage','2');
  assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas')===window.__originalCanvas),true);assert.equal(await evaluate(()=>window.__originalCanvas.dataset.modelLoads===window.__modelLoads&&window.__builds===window.__beforeBuilds),true);
  await new Promise(resolve=>setTimeout(resolve,100));const capture=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});writeFileSync(join(tmpdir(),'clock-workspace-desktop.png'),Buffer.from(capture.data,'base64'));
  const bounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.ceil(r.x),y:Math.ceil(r.y),width:Math.floor(r.width)-1,height:Math.floor(r.height)-1};}),pixels=nativeImage.createFromBuffer(Buffer.from(capture.data,'base64')).crop(bounds).toBitmap();let dark=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<160&&pixels[i+1]<160&&pixels[i+2]<160)dark++;assert.ok(dark>1000,'expanded WebGL genuinely renders the clock');
  assert.equal(await evaluate(async()=>{document.getElementById('closePreview').click();document.getElementById('expandPreview').click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return document.getElementById('previewDialog').open&&document.getElementById('previewDialog').contains(document.getElementById('preview'));}),true,'an earlier close event cannot remove a newly expanded preview');
  await click('closePreview');assert.deepEqual(await file(),original,'expanded inspection preserves exact STL bytes');
  console.log('PASS expanded design and real 3D retain one preview, GPU geometry, print bytes, keyboard control, focus and scroll position');

  for(const width of [320,390]){
    await metrics(width,780);await click('expandPreview');await key('clockStage','3');
    assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas').dataset.view),'back');
    const outside=await evaluate(()=>[...document.querySelectorAll('#previewDialog button:not([hidden])')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1;}).map(e=>e.id));assert.deepEqual(outside,[]);
    assert.ok(await evaluate(()=>document.getElementById('clockStage').getBoundingClientRect().height>250));
    await new Promise(resolve=>setTimeout(resolve,80));const shot=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});
    const canvasBounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.ceil(r.x),y:Math.ceil(r.y),width:Math.floor(r.width)-1,height:Math.floor(r.height)-1};}),render=nativeImage.createFromBuffer(Buffer.from(shot.data,'base64')).crop(canvasBounds).toBitmap();let left=canvasBounds.width,right=0;
    for(let y=0;y<canvasBounds.height;y++)for(let x=0;x<canvasBounds.width;x++){const at=(y*canvasBounds.width+x)*4,b=render[at],g=render[at+1],r=render[at+2];if(r>g*1.2&&g>b*1.1&&r>70&&r<235){left=Math.min(left,x);right=Math.max(right,x);}}
    assert.ok(right>left&&left>4&&right<canvasBounds.width-5,`the complete clock fits at ${width}px: ${left}..${right} of ${canvasBounds.width}`);
    if(width===390)writeFileSync(join(tmpdir(),'clock-workspace-mobile.png'),Buffer.from(shot.data,'base64'));
    await click('closePreview');assert.equal(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await metrics(1380);await click('designPreview');await evaluate(()=>{HTMLAnchorElement.prototype.click=window.__nativeClick;});await set('projectName','Save test');
  const projectPath=join(profile,'Renamed project.clock');assert.equal(await nativeSave('saveProject',projectPath),'completed');assert.match(await receipt('project','completed'),/Renamed project\.clock/);assert.equal(parseProject(readFileSync(projectPath,'utf8')).settings.diameter,211);
  assert.equal(await nativeSave('export',null,{cancel:true}),'cancelled');assert.match(await receipt('print','cancelled'),/still ready/);
  const builds=await evaluate(()=>window.__builds);await set('diameter',258);const retryPath=join(profile,'Retried original.stl');
  const saved=new Promise((resolve,reject)=>session.defaultSession.once('will-download',(_,item)=>{try{assert.match(item.getFilename(),/211mm/);item.setSavePath(retryPath);item.once('done',(_,state)=>state==='completed'?resolve():reject(Error(state)));}catch(error){reject(error);}}));
  await evaluate(()=>document.querySelector('[data-file-feedback="print"] button').click());await saved;assert.match(await receipt('print','completed'),/Retried original\.stl/);assert.deepEqual(readFileSync(retryPath),original);assert.equal(await evaluate(()=>window.__builds),builds);
  writeFileSync(join(profile,'blocked'),'a file cannot contain another file');assert.equal(await nativeSave('saveProject',join(profile,'blocked','failed.clock')),'interrupted');assert.match(await receipt('project','interrupted'),/Could not save/);
  await click('showFitTest');const fitPath=join(profile,'Actual fit strip.stl');assert.equal(await nativeSave('downloadFitTest',fitPath),'completed');assert.match(await receipt('fit','completed'),/Actual fit strip/);assert.equal(analyzeSTL(readFileSync(fitPath)).components,1);
  assert.deepEqual(await evaluate(()=>window.__errors),[]);
  console.log('PASS genuine native saves, renamed files, cancellation, interrupted disk writes, and exact-original retries without mesh rebuilds');
}
require('../desktop/main.cjs');
