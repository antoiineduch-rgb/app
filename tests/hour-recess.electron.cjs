const assert=require('node:assert/strict');
const {app,nativeImage}=require('electron');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-hours-pocket-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Hours and pocket checks exceeded 200 seconds.')),200000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All SVG hour-fit and rear-pocket desktop regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));
function geometry(buffer){const files=unzipSync(buffer),xml=strFromU8(files['3D/3dmodel.model']),vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));return {files,xml,triangles:[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)].map(m=>m.slice(1).map(id=>vertices[Number(id)]))};}
function stlFaces(buffer){const v=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength);return Array.from({length:v.getUint32(80,true)},(_,i)=>[0,1,2].map(j=>[0,1,2].map(k=>v.getFloat32(96+i*50+j*12+k*4,true)||0)));}
function closed(faces){const edges=new Map();for(const p of faces)for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(const [count,balance]of edges.values()){assert.equal(count,2);assert.equal(balance,0);}}
async function run(window){
  const {analyzeSTL}=await import('../mesh-analysis.js');
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value)=>evaluate((id,value)=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));if(e.type==='range')e.dispatchEvent(new Event('change',{bubbles:true}));},id,value);
  const wait=async(fn,label,...args)=>{const end=Date.now()+40000;while(Date.now()<end){const value=await evaluate(fn,...args);if(value)return value;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Timed out '+label+'; '+await evaluate(()=>document.getElementById('toast').textContent));};
  async function hooks(){await evaluate(()=>{window.__hrErrors=[];window.addEventListener('error',e=>window.__hrErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__hrErrors.push(String(e.reason)));window.__hrFiles=[];window.__hrBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__hrBlobs.set(url,blob);return url;};HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__hrFiles.push({name:this.download,url:this.href});};});}
  async function upload(id,text,name){await evaluate(async(id,text,name)=>{const input=document.getElementById(id),files=new DataTransfer();files.items.add(new File([text],name,{type:id==='svgUpload'?'image/svg+xml':'application/json'}));input.files=files.files;await input.onchange({target:input});},id,text,name);}
  async function file(id='export'){const value=await evaluate(async id=>{const before=window.__hrFiles.length;document.getElementById(id).click();const end=performance.now()+40000;while(window.__hrFiles.length===before&&performance.now()<end)await new Promise(r=>setTimeout(r,20));const f=window.__hrFiles[before];if(!f)throw Error('Download: '+document.getElementById('toast').textContent);return {name:f.name,bytes:Array.from(new Uint8Array(await window.__hrBlobs.get(f.url).arrayBuffer()))};},id);return {name:value.name,buffer:Buffer.from(value.bytes)};}
  async function download(format,target='bambu-a1'){await set('exportFormat',format);await set('threeMFTarget',target);return (await file()).buffer;}
  await hooks();await set('diameterNumber',200);await set('svgRelief',0);await set('hourStyle','arabic');await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());await click('uploadTab');
  const source=readFileSync(join(__dirname,'fixtures/wide-clock.svg'),'utf8');await upload('svgUpload',source,'wide-clock.svg');
  assert.equal(await evaluate(()=>document.getElementById('hourFit').checked),true);assert.match(await evaluate(()=>document.getElementById('hourFitStatus').textContent),/12\/12 hours fit/);
  assert.equal(await evaluate(()=>document.querySelectorAll('#hourNumerals [data-hour]').length),12);
  const before=await evaluate(()=>document.querySelector('#hourNumerals [data-hour="1"]').getAttribute('d'));
  await click('artRotateRight');const after=await evaluate(()=>{const e=document.querySelector('#hourNumerals [data-hour="1"]'),r=e.getBBox();return {path:e.getAttribute('d'),width:r.width,height:r.height};});
  assert.notEqual(after.path,before,'hour positions adapt when the SVG turns');assert.ok(after.height>after.width*1.5,'the digit stays upright');assert.match(await evaluate(()=>document.getElementById('hourFitStatus').textContent),/12\/12/);
  const front=await download('stl');closed(stlFaces(front));assert.equal(analyzeSTL(front).components,1);
  console.log('PASS all 12 full hour labels fit a wide SVG, adapt to rotation, stay upright and export as a closed face');

  await evaluate(()=>document.querySelector('.advanced-settings').open=true);await set('mechanismMount','recess');await set('mechanismRecess',true);
  assert.equal(await evaluate(()=>document.getElementById('recessWidth').value),'55');assert.equal(await evaluate(()=>document.getElementById('recessHeight').value),'55');assert.equal(await evaluate(()=>document.getElementById('recessDepth').value),'5.5');assert.equal(await evaluate(()=>document.getElementById('thickness').value),'7');
  const pocket=await download('stl'),pocketFaces=stlFaces(pocket),stats=analyzeSTL(pocket);closed(pocketFaces);assert.equal(stats.components,1);assert.ok(Math.abs(stats.dimensions[2]-7.8)<.001);assert.ok(pocketFaces.some(p=>p.every(v=>Math.abs(v[2]-5.5)<.0001)),'the pocket has a real ceiling at 5.5 mm');
  const native=await download('3mf'),nativeModel=geometry(native);assert.deepEqual(nativeModel.triangles,pocketFaces);const palette=JSON.parse(strFromU8(nativeModel.files['Metadata/project_settings.config'])).filament_colour;
  for(const color of ['#24382D','#E53935','#2855D6'])assert.ok(palette.includes(color));assert.match(await evaluate(()=>document.getElementById('downloadSteps').textContent),/supports/);assert.match(await evaluate(()=>document.getElementById('supportBadge').textContent),/check supports/);
  const validation=process.argv.find(arg=>arg.startsWith('--validation-output='));if(validation)writeFileSync(validation.slice('--validation-output='.length),native);
  const standard=geometry(await download('3mf','standard'));assert.deepEqual(standard.triangles,pocketFaces);assert.ok(standard.files['3D/Textures/artwork.png']);
  console.log('PASS the 55 mm body gets a clearance-sized 5.5 mm pocket, adequate front thickness, matching STL/3MF and appropriate print guidance');

  await click('printPreview');await wait(()=>!document.getElementById('meshCanvas').hidden&&document.querySelector('#meshCanvas canvas')?.dataset.triangles,'3D pocket');await click('backView');assert.equal(await evaluate(()=>document.getElementById('meshBed').disabled),true);assert.equal(await evaluate(()=>document.getElementById('backView').classList.contains('selected')),true);
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});await evaluate(()=>document.getElementById('preview').scrollIntoView({block:'start'}));await new Promise(resolve=>setTimeout(resolve,150));
  const capture=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'}),bounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
  const pixels=nativeImage.createFromBuffer(Buffer.from(capture.data,'base64')).crop(bounds).toBitmap();let brown=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>pixels[i]+15&&pixels[i+2]>pixels[i+1]+8)brown++;assert.ok(brown>500,'Back view shows the actual clock instead of an occluding build plate');
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));if(screenshot)writeFileSync(screenshot.slice('--screenshot-output='.length),Buffer.from(capture.data,'base64'));
  await click('frontView');assert.equal(await evaluate(()=>document.getElementById('meshBed').disabled),false);
  console.log('PASS the real rear 3D view exposes the mechanism cavity and restores the build plate when returning to the front');

  await set('recessWidth',95);assert.equal(await evaluate(()=>document.getElementById('export').disabled),true);await set('recessWidth',55);
  const project=await file('saveProject'),data=JSON.parse(project.buffer.toString('utf8'));assert.equal(data.settings.mechanismRecess,true);assert.equal(data.settings.hourFit,true);assert.equal(data.settings.recessDepth,5.5);
  await set('mechanismRecess',false);await click('undo');await wait(()=>document.getElementById('mechanismRecess').checked&&!document.getElementById('undo').disabled,'undo pocket removal');
  await click('reset');await upload('projectUpload',project.buffer.toString('utf8'),'pocket.clock');const reopened=analyzeSTL(await download('stl'));assert.ok(Math.abs(reopened.dimensions[2]-7.8)<.001);
  const islands=readFileSync(join(__dirname,'fixtures/separate-artwork.svg'),'utf8');await upload('svgUpload',islands,'separate-artwork.svg');assert.match(await evaluate(()=>document.getElementById('hourFitStatus').textContent),/round backing/);
  await click('backingForHours');assert.equal(await evaluate(()=>document.getElementById('svgBacking').checked),true);assert.ok(Number(await evaluate(()=>document.getElementById('svgBackingThickness').value))>=6.7);await set('thickness',3);
  assert.match(await evaluate(()=>document.getElementById('hourFitStatus').textContent),/12\/12 hours fit/);const backed=await download('stl');closed(stlFaces(backed));assert.equal(analyzeSTL(backed).components,1);
  await set('exportFormat','3mf');await set('threeMFTarget','bambu-a1');await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true','backed hour color preview');const backedNative=geometry(await file().then(f=>f.buffer));assert.deepEqual(backedNative.triangles,stlFaces(backed));
  await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'hour and pocket controls fit a 320px screen');assert.deepEqual(await evaluate(()=>window.__hrErrors),[]);
  console.log('PASS pocket settings, undo, project recovery, disconnected artwork with all 12 supported hours, color export and mobile layout');
}
require('../desktop/main.cjs');
