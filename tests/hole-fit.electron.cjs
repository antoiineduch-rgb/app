const assert=require('node:assert/strict');
const {app,session}=require('electron');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-hole-fit-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
let done=false;const watchdog=setTimeout(()=>finish(Error('Hole-fit checks exceeded 150 seconds.')),150000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All hole-fit desktop regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));
async function run(window){
  const {analyzeSTL}=await import('../mesh-analysis.js');
  const {makeFitTestSTL}=await import('../hole-fit.js');
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value)=>evaluate((id,value)=>{const input=document.getElementById(id);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));},id,value);
  const wait=async(fn,label,...args)=>{const deadline=Date.now()+30000;while(Date.now()<deadline){const value=await evaluate(fn,...args);if(value)return value;await new Promise(resolve=>setTimeout(resolve,20));}throw Error('Timed out: '+label+'; '+await evaluate(()=>document.getElementById('fitTestStatus').textContent));};
  await evaluate(()=>{
    window.__fitErrors=[];window.addEventListener('error',event=>window.__fitErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__fitErrors.push(String(event.reason)));
    window.__fitDownloads=[];window.__fitBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__fitBlobs.set(url,blob);return url;};
    window.__fitAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__fitDownloads.push({name:this.download,url:this.href});};
    window.__fitJobs=0;window.__fitClockBuilds=0;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(data,...rest){if(data.operation==='fit-test')window.__fitJobs++;if(data.alpha)window.__fitClockBuilds++;return post.call(this,data,...rest);};
  });
  async function download(id){return evaluate(async id=>{
    const before=window.__fitDownloads.length;document.getElementById(id).click();const deadline=performance.now()+30000;
    while(window.__fitDownloads.length===before&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,15));
    const file=window.__fitDownloads[before];if(!file)throw Error('No download: '+document.getElementById('fitTestStatus').textContent+'; '+document.getElementById('toast').textContent);return {name:file.name,bytes:Array.from(new Uint8Array(await window.__fitBlobs.get(file.url).arrayBuffer()))};
  },id).then(file=>({name:file.name,buffer:Buffer.from(file.bytes)}));}
  const choices=()=>evaluate(()=>[...document.getElementById('fitTestChoices').children].map(button=>Number(button.dataset.hole)));
  await set('markers',false);await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());await click('bambuColorPrint');
  await evaluate(()=>document.querySelector('.advanced-settings').open=true);await click('showFitTest');assert.equal(await evaluate(()=>document.getElementById('fitTestDialog').open),true);
  assert.deepEqual(await choices(),[7.6,7.8,8,8.2,8.4]);
  const first=await download('downloadFitTest'),firstStats=analyzeSTL(first.buffer);
  assert.equal(first.name,'clock-factory-fit-test-8.0mm.stl');assert.equal(firstStats.components,1);assert.ok(Math.abs(firstStats.dimensions[2]-2.6)<.001);assert.deepEqual(first.buffer,Buffer.from(makeFitTestSTL(8)));
  assert.equal(await evaluate(()=>window.__fitClockBuilds),0,'calibration does not build the full clock');
  await evaluate(()=>document.querySelector('#fitTestChoices [data-hole="8.2"]').click());
  assert.equal(await evaluate(()=>document.getElementById('hole').value),'8.2');assert.equal(await evaluate(()=>document.getElementById('hole').validity.valid),true);
  assert.deepEqual(await choices(),[7.6,7.8,8,8.2,8.4],'the printed strip keeps its original sizes after a choice');
  assert.equal(await evaluate(()=>document.getElementById('exportFormat').value),'3mf');assert.equal(await evaluate(()=>document.getElementById('threeMFTarget').value),'bambu-a1');
  assert.deepEqual((await download('downloadFitTest')).buffer,first.buffer);assert.equal(await evaluate(()=>window.__fitJobs),1,'repeat downloads use the prepared strip');
  console.log('PASS the labeled STL is ready before building a clock; applying its 8.2 mm choice preserves the strip, print format and cache');

  await click('closeFitTest');await click('undo');assert.equal(await evaluate(()=>document.getElementById('hole').value),'8');await click('redo');assert.equal(await evaluate(()=>document.getElementById('hole').value),'8.2');
  const clock=await download('export'),xml=strFromU8(unzipSync(clock.buffer)['3D/3dmodel.model']);
  const radii=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>Math.hypot(Number(m[1]),Number(m[2])));assert.ok(Math.abs(Math.min(...radii)*2-8.2)<.003,'the actual clock uses the tested diameter');
  const project=await download('saveProject');assert.equal(JSON.parse(project.buffer.toString('utf8')).settings.hole,8.2);
  await click('reset');await evaluate(async text=>{const input=document.getElementById('projectUpload'),files=new DataTransfer();files.items.add(new File([text],'fitted.clock',{type:'application/json'}));input.files=files.files;await input.onchange({target:input});},project.buffer.toString('utf8'));
  assert.equal(await evaluate(()=>document.getElementById('hole').value),'8.2');
  await click('showFitTest');await click('newFitTest');assert.deepEqual(await choices(),[7.8,8,8.2,8.4,8.6]);assert.match((await download('downloadFitTest')).name,/8\.2mm\.stl$/);
  console.log('PASS the calibrated hole reaches the clock file and survives undo, redo, project reopening and a new fit strip');

  await click('closeFitTest');await set('hole',8.1);await click('showFitTest');await click('newFitTest');
  await evaluate(()=>{window.__fitRealWorker=window.Worker;window.Worker=class{constructor(){throw Error('Workers unavailable');}};});
  const fallback=await download('downloadFitTest');assert.match(fallback.name,/8\.1mm\.stl$/);assert.equal(analyzeSTL(fallback.buffer).components,1);
  await evaluate(()=>{window.Worker=window.__fitRealWorker;});await click('closeFitTest');
  await set('hole',8.25);assert.equal(await evaluate(()=>document.getElementById('showFitTest').disabled),true);assert.equal(await evaluate(()=>document.getElementById('export').disabled),true);
  await set('hole',8.3);await click('showFitTest');await click('newFitTest');const before=await evaluate(()=>window.__fitDownloads.length);
  await evaluate(()=>{window.__fitTerminated=0;window.Worker=class{postMessage(){}terminate(){window.__fitTerminated++;}};});
  await click('downloadFitTest');await wait(()=>document.getElementById('fitTestDialog').getAttribute('aria-busy')==='true','pending strip');await click('closeFitTest');
  await wait(()=>document.getElementById('fitTestDialog').getAttribute('aria-busy')==='false','cancelled strip');assert.equal(await evaluate(()=>window.__fitDownloads.length),before);assert.ok(await evaluate(()=>window.__fitTerminated>0));
  await evaluate(()=>{window.Worker=window.__fitRealWorker;});await click('showFitTest');
  console.log('PASS worker fallback exports a real strip; invalid precision blocks a file; closing a pending test cancels without a late download');

  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));if(screenshot){await new Promise(resolve=>setTimeout(resolve,60));writeFileSync(screenshot.slice('--screenshot-output='.length),(await window.webContents.capturePage()).toPNG());}
  for(const width of [320,390]){
    await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    assert.ok(await evaluate(()=>document.getElementById('fitTestDialog').scrollWidth<=document.getElementById('fitTestDialog').clientWidth+1),'no horizontal overflow inside the test dialog');
    assert.ok(await evaluate(()=>[...document.querySelectorAll('#fitTestChoices button')].every(button=>button.getBoundingClientRect().width>=44&&button.getBoundingClientRect().height>=44)),'size choices have accessible touch targets');
  }
  await evaluate(()=>{HTMLAnchorElement.prototype.click=window.__fitAnchorClick;});
  const nativePath=join(profile,'hole-fit.stl'),saved=new Promise((resolve,reject)=>session.defaultSession.once('will-download',(_,item)=>{
    try{assert.equal(item.getFilename(),'clock-factory-fit-test-8.3mm.stl');assert.equal(item.getSaveDialogOptions().title,'Save hole-fit test');assert.ok(item.getSaveDialogOptions().filters.some(filter=>filter.extensions.includes('stl')));item.setSavePath(nativePath);item.once('done',(_,state)=>state==='completed'?resolve():reject(Error('Native save '+state)));}catch(error){reject(error);}
  }));
  await click('downloadFitTest');await saved;assert.equal(analyzeSTL(readFileSync(nativePath)).components,1);assert.deepEqual(await evaluate(()=>window.__fitErrors),[]);
  console.log('PASS small-screen fit choices and the actual Windows-style STL Save As download');
  window.webContents.debugger.detach();await new Promise(resolve=>{window.webContents.once('did-finish-load',resolve);window.webContents.reload();});assert.equal(await evaluate(()=>document.getElementById('hole').value),'8.3');
}
require('../desktop/main.cjs');
