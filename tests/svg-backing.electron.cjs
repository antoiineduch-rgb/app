// Real one-click repair, print files, colored 3D inspection and project recovery.
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {app,nativeImage}=require('electron');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-backing-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Backing checks exceeded 180 seconds.')),180000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All SVG backing desktop regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));
function model(buffer){const zip=unzipSync(buffer);return {zip,xml:strFromU8(zip['3D/3dmodel.model'])};}
function geometry(xml){const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));return [...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)].map(m=>m.slice(1).map(id=>vertices[Number(id)]));}
function closed(buffer){
  const view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength),edges=new Map(),triangles=[];
  for(let i=0;i<view.getUint32(80,true);i++){
    const points=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)||0));triangles.push(points);
    for(let j=0;j<3;j++){const a=points[j].join(','),b=points[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=a<b?1:-1;edges.set(key,entry);}
  }
  for(const [count,balance]of edges.values()){assert.equal(count,2,'every STL seam is closed');assert.equal(balance,0,'adjacent faces have opposite winding');}
  for(const triangle of triangles)for(const [x,y]of triangle)assert.ok(Math.hypot(x,y)>=3.9999,'the 8 mm shaft opening stays open through every layer');
  return triangles;
}
async function run(window){
  const {analyzeSTL}=await import('../mesh-analysis.js');
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value)=>evaluate((id,value)=>{const input=document.getElementById(id);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));if(input.type==='range')input.dispatchEvent(new Event('change',{bubbles:true}));},id,value);
  const wait=async(fn,label,...args)=>{const deadline=Date.now()+30000;while(Date.now()<deadline){const value=await evaluate(fn,...args);if(value)return value;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Timed out: '+label+'; '+await evaluate(()=>document.getElementById('toast').textContent));};
  async function hooks(){await evaluate(()=>{
    window.__backingErrors=[];window.addEventListener('error',event=>window.__backingErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__backingErrors.push(String(event.reason)));
    window.__backingDownloads=[];window.__backingBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__backingBlobs.set(url,blob);return url;};HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__backingDownloads.push({name:this.download,url:this.href});};
  });}
  async function download(){return evaluate(async()=>{
    const before=window.__backingDownloads.length;document.getElementById('export').click();const deadline=performance.now()+30000;
    while(window.__backingDownloads.length===before&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
    const file=window.__backingDownloads[before];if(!file)throw Error('Backing export failed: '+document.getElementById('toast').textContent);return Array.from(new Uint8Array(await window.__backingBlobs.get(file.url).arrayBuffer()));
  }).then(bytes=>Buffer.from(bytes));}
  async function upload(id,text,name){await evaluate(async(id,text,name)=>{const input=document.getElementById(id),files=new DataTransfer();files.items.add(new File([text],name,{type:id==='svgUpload'?'image/svg+xml':'application/json'}));input.files=files.files;await input.onchange({target:input});},id,text,name);}
  await hooks();await set('diameterNumber',100);await set('markers',false);await set('svgRelief',0);await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());
  const source=readFileSync(join(__dirname,'fixtures/separate-artwork.svg'),'utf8');await upload('svgUpload',source,'separate-artwork.svg');
  await click('checkModel');await wait(()=>document.getElementById('modelParts').textContent==='2'&&!document.getElementById('checkModel').disabled,'two source pieces');
  assert.ok(await evaluate(()=>document.getElementById('connectArtwork').getClientRects().length>0),'the one-click fix is visible');
  await click('connectArtwork');await wait(()=>document.getElementById('modelParts').textContent==='1'&&!document.getElementById('checkModel').disabled,'joined backing');
  assert.equal(await evaluate(()=>document.getElementById('svgBacking').checked),true);assert.ok(await evaluate(()=>!!document.getElementById('svgBackingPreview')));
  assert.match(await evaluate(()=>document.getElementById('fitHint').textContent),/backing adds 1.2 mm/);
  const stl=await download(),stats=analyzeSTL(stl),triangles=closed(stl);
  assert.equal(stats.components,1);for(const span of stats.dimensions.slice(0,2))assert.ok(Math.abs(span-100)<.001);assert.ok(Math.abs(stats.dimensions[2]-4.2)<.001);
  console.log('PASS the separate-piece warning adds a closed, single-piece round backing with exact diameter, thickness and shaft opening');

  await evaluate(()=>document.querySelectorAll('.swatch')[3].click());await click('bambuColorPrint');await set('bambuBackColor','face');
  await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true','backed print color preview');
  const color=await evaluate(()=>{const c=document.getElementById('filamentProofCanvas'),ctx=c.getContext('2d');return {rim:Array.from(ctx.getImageData(140,20,1,1).data),hole:Array.from(ctx.getImageData(140,140,1,1).data)};});
  assert.deepEqual(color.rim,[72,92,72,255]);assert.equal(color.hole[3],0,'color preview also retains the center hole');
  const native=await download(),nativeModel=model(native),settings=JSON.parse(strFromU8(nativeModel.zip['Metadata/project_settings.config']));
  assert.deepEqual(new Set(settings.filament_colour),new Set(['#485C48','#E53935','#2855D6']));assert.deepEqual(geometry(nativeModel.xml),triangles);
  const faceVertices=[...nativeModel.xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));let backingFaces=0;
  for(const face of nativeModel.xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)" paint_color="([0-9A-F]+)"\/>/g))if(face.slice(1,4).every(id=>Math.abs(faceVertices[Number(id)][2]-1.2)<.0001)){assert.equal(face[4],'4');backingFaces++;}
  assert.ok(backingFaces>0,'the exposed backing uses the selected base filament');
  const validation=process.argv.find(arg=>arg.startsWith('--validation-output='));if(validation)writeFileSync(validation.slice('--validation-output='.length),native);
  await set('threeMFTarget','standard');const standard=model(await download());assert.ok(standard.zip['3D/Textures/artwork.png']);assert.deepEqual(geometry(standard.xml),triangles);
  console.log('PASS Bambu and standard 3MF retain the exact backed geometry and artwork; print colors show the plate behind transparent gaps');

  await set('svgBackingThickness',3);await set('exportFormat','stl');const maxSupport=analyzeSTL(await download());assert.ok(Math.abs(maxSupport.dimensions[2]-6)<.001);
  await click('printPreview');await wait(()=>!document.getElementById('meshCanvas').hidden&&document.querySelector('#meshCanvas canvas')?.dataset.triangles,'real backed 3D model');await click('frontView');
  assert.equal(await evaluate(()=>Number(document.querySelector('#meshCanvas canvas').dataset.triangles)),maxSupport.triangles);
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate(()=>document.getElementById('preview').scrollIntoView({block:'start'}));await new Promise(resolve=>setTimeout(resolve,150));
  const capture=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'}),bounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
  const bitmap=nativeImage.createFromBuffer(Buffer.from(capture.data,'base64')).crop(bounds).toBitmap();let red=0,green=0,blue=0;
  for(let i=0;i<bitmap.length;i+=4){const [b,g,r]=bitmap.subarray(i,i+3);if(r>g+20&&r>b+20)red++;if(g>r+8&&g>b+8)green++;if(b>r+20&&b>g+10)blue++;}
  assert.ok(red>100&&green>100&&blue>100,`3D shows red/blue artwork on a green backing: ${JSON.stringify({red,green,blue})}`);
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));if(screenshot)writeFileSync(screenshot.slice('--screenshot-output='.length),Buffer.from(capture.data,'base64'));
  console.log('PASS the real 3D model displays the fitted artwork and its solid backing with the exported triangle count');

  await set('svgBackingThickness',2.4);await set('svgBackingMargin',6);await set('exportFormat','stl');const adjusted=await download(),adjustedStats=analyzeSTL(adjusted);closed(adjusted);assert.equal(adjustedStats.components,1);assert.ok(Math.abs(adjustedStats.dimensions[2]-5.4)<.001);
  await click('saveProject');const saved=await evaluate(async()=>{const file=window.__backingDownloads.at(-1);return window.__backingBlobs.get(file.url).text();});
  const project=JSON.parse(saved);assert.equal(project.settings.svgBacking,true);assert.equal(project.settings.svgBackingThickness,2.4);assert.equal(project.settings.svgBackingMargin,6);assert.equal(project.artwork.source,source);
  await set('svgBacking',false);assert.equal(analyzeSTL(await download()).components,2);
  await click('undo');await wait(()=>document.getElementById('svgBacking').checked&&!document.getElementById('undo').disabled,'undo backing removal');assert.equal(analyzeSTL(await download()).components,1);
  await click('reset');await upload('projectUpload',saved,'backed.clock');const restored=analyzeSTL(await download());assert.equal(restored.components,1);assert.ok(Math.abs(restored.dimensions[2]-5.4)<.001);
  await set('svgDetail','silhouette');closed(await download());await set('svgDetail','artwork');
  await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'backing controls fit a 320px screen');
  assert.deepEqual(await evaluate(()=>window.__backingErrors),[]);
  window.webContents.debugger.detach();await new Promise(resolve=>{window.webContents.once('did-finish-load',resolve);window.webContents.reload();});
  await wait(()=>!!document.getElementById('svgBackingPreview'),'backing restored on reopen');assert.equal(await evaluate(()=>document.getElementById('svgBackingThickness').value),'2.4');assert.equal(await evaluate(()=>document.getElementById('svgBackingMargin').value),'6');
  console.log('PASS backing adjustments, removal, undo, silhouette mode, project backups, local restoration and mobile layout');
}
require('../desktop/main.cjs');
