const assert=require('node:assert/strict');
const {app,nativeImage}=require('electron');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-mechanism-box-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Raised mechanism box checks exceeded 200 seconds.')),200000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All raised mechanism box desktop regressions passed.');app.exit(error?1:0);}
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
  await hooks();await set('diameterNumber',200);await set('hourStyle','arabic');await set('svgRelief',1.2);await click('uploadTab');
  await upload('svgUpload',readFileSync(join(__dirname,'fixtures/wide-clock.svg'),'utf8'),'wide-clock.svg');
  await evaluate(()=>document.querySelector('.advanced-settings').open=true);await set('mechanismRecess',true);
  assert.equal(await evaluate(()=>document.getElementById('mechanismMount').value),'box');assert.equal(await evaluate(()=>document.getElementById('mechanismFlatFront').checked),true);
  assert.equal(await evaluate(()=>document.getElementById('thickness').value),'3','enabling a box does not thicken the entire face');
  assert.equal(await evaluate(()=>document.getElementById('svgReliefControls').hidden),true);assert.match(await evaluate(()=>document.getElementById('recessSummary').textContent),/56 × 56 mm inside.*5.5 mm high.*1.6 mm walls/);
  assert.equal(await evaluate(()=>document.querySelectorAll('#hourNumerals [data-hour]').length),12);
  const flat=await download('stl'),flatFaces=stlFaces(flat),flatStats=analyzeSTL(flat);closed(flatFaces);
  assert.equal(flatStats.components,1);assert.equal(flatStats.min[2],0);assert.equal(flatStats.dimensions[2],8.5);
  assert.ok(flatFaces.some(points=>points.every(p=>p[2]===0)),'the front has a real bed-contact plane');
  assert.deepEqual([...new Set(flatFaces.flatMap(p=>p.map(v=>v[2])))].sort((a,b)=>a-b),[0,3,8.5],'only the thin plate and raised walls are present');
  assert.match(await evaluate(()=>document.getElementById('downloadNote').textContent),/flat.*rear box/);
  console.log('PASS a thin 3 mm face prints flat at z=0 with a 5.5 mm open box above it, without the old thick recess');

  const native=await download('3mf'),nativeModel=geometry(native);assert.deepEqual(nativeModel.triangles,flatFaces);
  const palette=JSON.parse(strFromU8(nativeModel.files['Metadata/project_settings.config'])).filament_colour;
  for(const color of ['#24382D','#E53935','#2855D6'])assert.ok(palette.includes(color));
  const nativeTriangles=[...nativeModel.xml.matchAll(/<triangle[^>]*paint_color="([0-9A-F]+)"\/>/g)];let painted=0;
  flatFaces.forEach((points,i)=>{if(points.every(p=>p[2]===0)){if(nativeTriangles[i][1]!=='4')painted++;}else assert.equal(nativeTriangles[i][1],'4','the rear box keeps the base filament');});assert.ok(painted>0,'SVG colors are assigned to the front on the plate');
  assert.match(await evaluate(()=>document.getElementById('downloadSteps').textContent),/flat front on the plate.*box pointing up/);
  const validation=process.argv.find(arg=>arg.startsWith('--validation-output='));if(validation)writeFileSync(validation.slice('--validation-output='.length),native);
  const standard=geometry(await download('3mf','standard'));assert.deepEqual(standard.triangles,flatFaces);assert.ok(standard.files['3D/Textures/artwork.png']);
  const standardTriangles=[...standard.xml.matchAll(/<triangle v1="\d+" v2="\d+" v3="\d+"([^>]*)\/>/g)];flatFaces.forEach((points,i)=>assert.equal(standardTriangles[i][1].includes('pid="4"'),points.every(p=>p[2]===0)));
  console.log('PASS both 3MF exports retain exact STL geometry and paint the flat front while the box stays in its base color');

  await click('printPreview');await wait(()=>!document.getElementById('meshCanvas').hidden&&document.querySelector('#meshCanvas canvas')?.dataset.triangles,'box 3D preview');
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
  await click('backView');assert.equal(await evaluate(()=>document.getElementById('meshBed').disabled),false,'the raised box is above the bed in Back view');
  await evaluate(()=>document.getElementById('preview').scrollIntoView({block:'start'}));await new Promise(resolve=>setTimeout(resolve,160));
  const back=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));if(screenshot)writeFileSync(screenshot.slice('--screenshot-output='.length),Buffer.from(back.data,'base64'));
  await click('frontView');assert.equal(await evaluate(()=>document.getElementById('meshBed').disabled),true,'the bed hides only while inspecting the underside front');await new Promise(resolve=>setTimeout(resolve,160));
  const front=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'}),bounds=await evaluate(()=>{const r=document.querySelector('#meshCanvas canvas').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
  const pixels=nativeImage.createFromBuffer(Buffer.from(front.data,'base64')).crop(bounds).toBitmap();let red=0,blue=0,redX=0,blueX=0;
  for(let i=0;i<pixels.length;i+=4){const b=pixels[i],g=pixels[i+1],r=pixels[i+2],x=(i/4)%bounds.width;if(r>g*1.4&&r>b*1.4){red++;redX+=x;}if(b>r*1.3&&b>g*1.2){blue++;blueX+=x;}}
  assert.ok(red>300&&blue>300,'the underside front shows genuine colored WebGL pixels');assert.ok(redX/red<blueX/blue,'red remains left of blue when looking at the clock front');
  if(screenshot)writeFileSync(screenshot.slice('--screenshot-output='.length).replace(/\.png$/,'-front.png'),Buffer.from(front.data,'base64'));
  console.log('PASS front and back 3D views use the real print orientation, and face-down SVG colors remain readable');

  await set('mechanismFlatFront',false);const detailed=analyzeSTL(await download('stl'));assert.ok(detailed.dimensions[2]>flatStats.dimensions[2]+1,'raised front details are restored when requested');assert.equal(await evaluate(()=>document.getElementById('svgReliefControls').hidden),false);
  await set('mechanismFlatFront',true);await set('mechanismWall',0);assert.equal(await evaluate(()=>document.getElementById('export').disabled),true);await set('mechanismWall',2);await click('undo');await wait(()=>!document.getElementById('saveProject').disabled&&!document.getElementById('export').disabled,'completed box undo');assert.equal(await evaluate(()=>document.getElementById('mechanismWall').value),'1.6');
  const saved=await file('saveProject'),data=JSON.parse(saved.buffer.toString('utf8'));assert.equal(data.settings.mechanismMount,'box');assert.equal(data.settings.mechanismFlatFront,true);assert.equal(data.settings.thickness,3);
  await click('reset');await upload('projectUpload',saved.buffer.toString('utf8'),'raised-box.clock');assert.equal(analyzeSTL(await download('stl')).dimensions[2],8.5);
  await evaluate(()=>new Promise(resolve=>setTimeout(resolve,250)));window.reload();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await hooks();await wait(()=>document.getElementById('mechanismRecess').checked&&document.getElementById('uploadStatus').textContent.includes('Loaded'),'saved raised box');
  assert.equal(await evaluate(()=>document.getElementById('mechanismMount').value),'box');assert.equal(await evaluate(()=>document.getElementById('mechanismWall').value),'1.6');assert.equal(analyzeSTL(await download('stl')).dimensions[2],8.5);
  console.log('PASS optional raised front details, invalid-wall protection, undo, projects and reopening retain the correct box');

  await set('markers',false);await upload('svgUpload',readFileSync(join(__dirname,'fixtures/separate-artwork.svg'),'utf8'),'separate-artwork.svg');await click('checkModel');await wait(()=>!document.getElementById('recessError').hidden,'missing box foundation');assert.match(await evaluate(()=>document.getElementById('recessError').textContent),/solid clock face/);
  await click('backingForRecess');assert.equal(await evaluate(()=>document.getElementById('svgBackingThickness').value),'1.2','a box needs no thick recessed backing');assert.equal(await evaluate(()=>document.getElementById('thickness').value),'3');
  const backed=await download('stl');closed(stlFaces(backed));assert.equal(analyzeSTL(backed).components,1);assert.ok(Math.abs(analyzeSTL(backed).dimensions[2]-9.7)<.001);
  await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(await evaluate(()=>window.__hrErrors),[]);
  console.log('PASS disconnected SVG protection, a thin round backing with flat bed contact, and usable controls at 320 px');
}
require('../desktop/main.cjs');
