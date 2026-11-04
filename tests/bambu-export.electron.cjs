const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {app}=require('electron');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-bambu-test-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
let done=false;const watchdog=setTimeout(()=>finish(Error('Bambu export checks exceeded 120 seconds.')),120000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All Bambu A1 color export desktop regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_event,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));
function unpack(buffer){const files=unzipSync(buffer);return {files,model:strFromU8(files['3D/3dmodel.model']),settings:files['Metadata/project_settings.config']?JSON.parse(strFromU8(files['Metadata/project_settings.config'])):null};}
function geometry(model){return {vertices:[...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number)),triangles:[...model.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)].map(m=>m.slice(1).map(Number))};}
async function run(window){
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const set=(id,value,event='change')=>evaluate((id,value,event)=>{const input=document.getElementById(id);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));},id,value,event);
  await evaluate(()=>{
    window.__bambuErrors=[];window.addEventListener('error',event=>window.__bambuErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__bambuErrors.push(String(event.reason)));
    window.__bambuDownloads=[];window.__bambuBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__bambuBlobs.set(url,blob);return url;};
    HTMLAnchorElement.prototype.click=function(){if(/\.(3mf|stl|clock)$/.test(this.download))window.__bambuDownloads.push({name:this.download,url:this.href});};
    window.__bambuBuilds=0;window.__bambuProofBuilds=0;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(data,...rest){if(data.alpha)window.__bambuBuilds++;if(data.operation==='filament-proof')window.__bambuProofBuilds++;return post.call(this,data,...rest);};
  });
  await set('diameter',100,'input');await set('markers',false,'input');
  await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());
  const source=readFileSync(join(__dirname,'fixtures/bambu-colors.svg'),'utf8');
  await evaluate(async source=>{document.getElementById('uploadTab').click();const input=document.getElementById('svgUpload'),files=new DataTransfer();files.items.add(new File([source],'bambu-colors.svg',{type:'image/svg+xml'}));input.files=files.files;await input.onchange({target:input});},source);
  await set('svgRelief',0,'input');await set('exportFormat','3mf');
  assert.equal(await evaluate(()=>document.getElementById('threeMFTarget').value),'bambu-a1','3MF defaults to the requested A1 export');
  async function download(id='export'){return evaluate(async id=>{
    const before=window.__bambuDownloads.length;document.getElementById(id).click();const deadline=performance.now()+30000;
    while(window.__bambuDownloads.length===before&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
    const file=window.__bambuDownloads[before];if(!file)throw Error('Bambu export failed: '+document.getElementById('toast').textContent);
    return {name:file.name,bytes:Array.from(new Uint8Array(await window.__bambuBlobs.get(file.url).arrayBuffer()))};
  },id).then(file=>({name:file.name,buffer:Buffer.from(file.bytes)}));}
  async function proofReady(count){const deadline=Date.now()+30000;while(Date.now()<deadline){if(await evaluate(count=>document.getElementById('filamentPreview').dataset.ready==='true'&&document.getElementById('filamentEditors').children.length===count,count))return;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Color preview did not become ready: '+await evaluate(()=>document.getElementById('filamentProofStatus').textContent));}
  async function proofColors(){return evaluate(()=>{
    const canvas=document.getElementById('filamentProofCanvas'),data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
    for(let at=0;at<data.length;at+=4)if(data[at+3]===255)colors.add('#'+[0,1,2].map(k=>data[at+k].toString(16).padStart(2,'0')).join('').toUpperCase());return [...colors];
  });}
  await proofReady(4);
  assert.equal(await evaluate(()=>window.__bambuBuilds),0,'the color preview does not need a print mesh');
  for(const color of ['#FFFFFF','#E53935','#3E8E41','#2855D6'])assert.ok((await proofColors()).includes(color));
  console.log('PASS the pre-export preview shows all four print colors without building geometry');
  const native=await download(),first=unpack(native.buffer);
  assert.match(native.name,/-bambu-a1\.3mf$/);assert.equal(first.settings.printer_settings_id,'Bambu Lab A1 0.4 nozzle');assert.deepEqual(first.settings.nozzle_diameter,['0.4']);
  assert.equal(first.settings.filament_colour.length,4);
  for(const color of ['#FFFFFF','#E53935','#3E8E41','#2855D6'])assert.ok(first.settings.filament_colour.includes(color),`${color} is retained as a real filament`);
  assert.ok([...first.model.matchAll(/paint_color="([0-9A-F]+)"/g)].some(m=>m[1].length>10),'native subdivisions preserve colors inside large flat faces');
  assert.ok(!first.files['3D/Textures/artwork.png'],'Bambu export uses filament paint, not a display texture');
  assert.equal(await evaluate(()=>document.getElementById('filamentPalette').children.length),4);
  const validation=process.argv.find(arg=>arg.startsWith('--validation-output='));if(validation)writeFileSync(validation.slice('--validation-output='.length),native.buffer);
  console.log('PASS A1 / 0.4 mm project carries all four SVG colors as numbered filaments and native paint');
  await set('exportFormat','stl');const stl=await download(),view=new DataView(stl.buffer.buffer,stl.buffer.byteOffset,stl.buffer.byteLength),indexed=geometry(first.model);
  assert.equal(indexed.triangles.length,view.getUint32(80,true));
  indexed.triangles.forEach((face,i)=>assert.deepEqual(face.map(id=>indexed.vertices[id]),[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)||0))));
  await set('exportFormat','3mf');await set('filamentCount',2);const reduced=unpack((await download()).buffer);assert.ok(reduced.settings.filament_colour.length<=2);assert.deepEqual(geometry(reduced.model),indexed);
  await set('filamentCount',4);await set('bambuBackColor','face');const custom=unpack((await download()).buffer);assert.equal(custom.settings.filament_colour[0],'#C47F62');
  assert.equal(await evaluate(()=>window.__bambuBuilds),1,'filament choices reuse the same validated mesh');
  console.log('PASS color limits and back-color choices repackage the model without rebuilding or changing geometry');
  await set('threeMFTarget','standard');const standard=await download(),full=unpack(standard.buffer);assert.doesNotMatch(standard.name,/-bambu-a1/);assert.ok(full.files['3D/Textures/artwork.png']);assert.match(full.model,/<m:texture2d /);assert.equal(full.settings,null);assert.deepEqual(geometry(full.model),indexed);
  console.log('PASS the standard full-color texture export remains available separately');
  await set('threeMFTarget','bambu-a1');await set('bambuBackColor','background');await set('filamentCount',2);
  await evaluate(()=>{window.__realBambuWorker=window.Worker;window.__bambuFallbackAttempts=0;window.Worker=class{constructor(){window.__bambuFallbackAttempts++;throw Error('Worker unavailable');}};});
  await set('bambuBackColor','face');await proofReady(2);assert.ok((await proofColors()).length<=2);assert.ok(await evaluate(()=>window.__bambuFallbackAttempts>0),'the color preview also works without workers');
  await set('bambuBackColor','background');await proofReady(2);
  const fallback=unpack((await download()).buffer);assert.ok(fallback.settings.filament_colour.length<=2);assert.deepEqual(geometry(fallback.model),indexed);
  await evaluate(()=>{window.Worker=window.__realBambuWorker;});assert.deepEqual(await evaluate(()=>window.__bambuErrors),[]);
  console.log('PASS the worker fallback preserves the A1 filament palette and print geometry');

  await set('filamentCount',4);await proofReady(4);
  const proofBuilds=await evaluate(()=>window.__bambuProofBuilds);
  await set('svgRelief',1,'input');await set('svgRelief',0,'input');
  const original=await evaluate(()=>document.getElementById('originalArtwork').innerHTML);
  async function changeColor(source,color){await evaluate((source,color)=>{const input=[...document.querySelectorAll('#filamentEditors input')].find(input=>input.dataset.source===source);if(!input)throw Error('Missing color '+source);input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},source,color);}
  await changeColor('#E53935','#00CC66');await changeColor('#2855D6','#00CC66');
  const edited=unpack((await download()).buffer);
  assert.deepEqual(new Set(edited.settings.filament_colour),new Set(['#FFFFFF','#3E8E41','#00CC66']));
  assert.deepEqual(geometry(edited.model),indexed);
  const pixels=await proofColors();assert.ok(pixels.includes('#00CC66'));assert.ok(!pixels.includes('#E53935')&&!pixels.includes('#2855D6'));
  assert.match(await evaluate(()=>document.getElementById('filamentProofStatus').textContent),/3 printable filaments.*1 matching color merged/);
  assert.equal(await evaluate(()=>document.getElementById('originalArtwork').innerHTML),original,'changing filaments preserves the original SVG');
  await evaluate(()=>document.getElementById('proofOriginal').click());assert.ok((await proofColors()).includes('#E53935'));
  await evaluate(()=>document.getElementById('proofPrinted').click());assert.ok(!(await proofColors()).includes('#E53935'));
  await evaluate(()=>document.getElementById('undo').click());await proofReady(4);assert.ok((await proofColors()).includes('#2855D6'));
  await evaluate(()=>document.getElementById('redo').click());await proofReady(4);assert.ok(!(await proofColors()).includes('#2855D6'));
  assert.equal(await evaluate(()=>window.__bambuBuilds),1,'palette edits and undo reuse the validated mesh');
  assert.equal(await evaluate(()=>window.__bambuProofBuilds),proofBuilds,'recoloring and relief changes reuse color analysis');
  const recolorValidation=process.argv.find(arg=>arg.startsWith('--recolor-validation-output='));if(recolorValidation)writeFileSync(recolorValidation.slice('--recolor-validation-output='.length),Buffer.from((await download()).buffer));
  console.log('PASS editable filament colors match preview pixels, merge actual AMS assignments, preserve geometry and support original comparison plus undo');

  const project=await download('saveProject'),saved=JSON.parse(project.buffer.toString('utf8'));
  assert.deepEqual(saved.settings.bambuColors,{'#E53935':'#00CC66','#2855D6':'#00CC66'});assert.equal(saved.artwork.source,source);
  await evaluate(()=>document.getElementById('resetFilamentColors').click());await proofReady(4);assert.ok((await proofColors()).includes('#E53935'));
  await evaluate(async text=>{const input=document.getElementById('projectUpload'),files=new DataTransfer();files.items.add(new File([text],'colors.clock',{type:'application/json'}));input.files=files.files;await input.onchange({target:input});},project.buffer.toString('utf8'));
  await proofReady(4);const reopened=unpack((await download()).buffer);assert.deepEqual(reopened.settings.filament_colour,edited.settings.filament_colour);assert.deepEqual(geometry(reopened.model),indexed);
  console.log('PASS reset restores SVG colors and portable projects restore the chosen filament mapping');

  await set('filamentCount',2);await set('filamentCount',4);await proofReady(4);
  assert.ok(!(await proofColors()).includes('#E53935'),'a superseded two-color analysis cannot replace the current preview');
  assert.deepEqual(await evaluate(()=>window.__bambuErrors),[]);
  window.webContents.debugger.attach('1.3');
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));
  if(screenshot){await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});await evaluate(()=>document.getElementById('filamentPreview').scrollIntoView({block:'center'}));await new Promise(resolve=>setTimeout(resolve,100));writeFileSync(screenshot.slice('--screenshot-output='.length),(await window.webContents.capturePage()).toPNG());}
  for(const width of [320,390]){
    await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    assert.ok(await evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px color editing has no horizontal overflow`);
    assert.ok(await evaluate(()=>[...document.querySelectorAll('#filamentEditors input')].every(input=>input.getBoundingClientRect().width>=44)),'filament pickers have touch-size targets');
  }
  const mobileScreenshot=process.argv.find(arg=>arg.startsWith('--mobile-screenshot-output='));if(mobileScreenshot){await evaluate(()=>document.getElementById('filamentPreview').scrollIntoView({block:'start'}));await new Promise(resolve=>setTimeout(resolve,100));writeFileSync(mobileScreenshot.slice('--mobile-screenshot-output='.length),(await window.webContents.capturePage()).toPNG());}
  console.log('PASS print-color editing fits mobile screens at 320 and 390 pixels');
}
require('../desktop/main.cjs');
