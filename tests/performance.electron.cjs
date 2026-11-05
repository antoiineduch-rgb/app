const assert=require('node:assert/strict');
const {app}=require('electron');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-performance-'));app.setPath('userData',profile);
app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');
let done=false;const watchdog=setTimeout(()=>finish(Error('Performance checks exceeded 240 seconds.')),240000);
function finish(error){if(done)return;done=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All performance and cached export checks passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));
function geometry(buffer){const files=unzipSync(buffer),xml=strFromU8(files['3D/3dmodel.model']),vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));return {files,xml,triangles:[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)].map(m=>m.slice(1).map(id=>vertices[Number(id)]))};}
function stlFaces(buffer){const v=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength);return Array.from({length:v.getUint32(80,true)},(_,i)=>[0,1,2].map(j=>[0,1,2].map(k=>v.getFloat32(96+i*50+j*12+k*4,true)||0)));}
function closed(faces){const edges=new Map();for(const p of faces)for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(const [count,balance]of edges.values()){assert.equal(count,2);assert.equal(balance,0);}}
async function run(window){
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  const set=(id,value)=>evaluate((id,value)=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));if(e.type==='range')e.dispatchEvent(new Event('change',{bubbles:true}));},id,value);
  const wait=async(fn,label,...args)=>{const end=Date.now()+40000;while(Date.now()<end){const value=await evaluate(fn,...args);if(value)return value;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Timed out '+label+'; '+await evaluate(()=>document.getElementById('toast').textContent));};
  async function hooks(){await evaluate(()=>{window.__hrErrors=[];window.addEventListener('error',e=>window.__hrErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__hrErrors.push(String(e.reason)));window.__hrFiles=[];window.__hrBlobs=new Map();const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.__hrBlobs.set(url,blob);return url;};HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf|clock)$/.test(this.download))window.__hrFiles.push({name:this.download,url:this.href});};});}
  async function upload(id,text,name){await evaluate(async(id,text,name)=>{const input=document.getElementById(id),files=new DataTransfer();files.items.add(new File([text],name,{type:id==='svgUpload'?'image/svg+xml':'application/json'}));input.files=files.files;await input.onchange({target:input});},id,text,name);}
  async function file(id='export'){const value=await evaluate(async id=>{const before=window.__hrFiles.length;document.getElementById(id).click();const end=performance.now()+40000;while(window.__hrFiles.length===before&&performance.now()<end)await new Promise(r=>setTimeout(r,20));const f=window.__hrFiles[before];if(!f)throw Error('Download: '+document.getElementById('toast').textContent);return {name:f.name,bytes:Array.from(new Uint8Array(await window.__hrBlobs.get(f.url).arrayBuffer()))};},id);return {name:value.name,buffer:Buffer.from(value.bytes)};}
  async function download(format,target='bambu-a1'){await set('exportFormat',format);await set('threeMFTarget',target);return (await file()).buffer;}
  const baseline=process.argv.includes('--baseline'),report={version:require('../package.json').version,phases:{},mainThread:[]};
  await hooks();await evaluate(()=>{
    window.__perf={reads:0,draws:0,pngs:0,dataURLs:0,meshes:0,proofs:0,packages:0,rgbaBytes:0,indexBytes:0,workerTimes:[]};
    const read=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){if(this.canvas.width>400)window.__perf.reads++;return read.apply(this,args);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.width>400)window.__perf.draws++;return draw.apply(this,args);};
    const blob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(...args){if(this.width>400)window.__perf.pngs++;return blob.apply(this,args);};
    const dataURL=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...args){if(this.width>400)window.__perf.dataURLs++;return dataURL.apply(this,args);};
    const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(data,...args){
      if(data.alpha)window.__perf.meshes++;if(data.operation==='filament-proof')window.__perf.proofs++;
      if(data.stlBuffer&&data.settings.exportFormat==='3mf'){
        window.__perf.packages++;window.__perf.rgbaBytes+=data.artwork?.painting?.rgba?.byteLength||0;window.__perf.indexBytes+=data.artwork?.analysis?.map?.byteLength||0;
        const start=performance.now();this.addEventListener('message',function done(event){if(event.data.buffer||event.data.error){window.__perf.workerTimes.push(performance.now()-start);this.removeEventListener('message',done);}});
      }
      return post.call(this,data,...args);
    };
  });
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Profiler.enable');await window.webContents.debugger.sendCommand('Profiler.start');
  const metrics=()=>evaluate(()=>structuredClone(window.__perf));
  async function phase(name,fn){const before=await metrics(),start=performance.now();const result=await fn();const after=await metrics();report.phases[name]={milliseconds:Math.round(performance.now()-start),...Object.fromEntries(['reads','draws','pngs','dataURLs','meshes','proofs','packages','rgbaBytes','indexBytes'].map(key=>[key,after[key]-before[key]]))};return result;}
  await phase('open_svg',async()=>{await set('diameterNumber',240);await click('uploadTab');await upload('svgUpload',readFileSync(join(__dirname,'fixtures/detailed-artwork.svg'),'utf8'),'detailed-artwork.svg');await set('svgBacking',true);await click('applyClockSetup');await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true','large SVG color analysis');});
  await phase('face_color_edits',async()=>{await evaluate(async()=>{const swatches=[...document.querySelectorAll('.swatch')];for(let i=0;i<10;i++)swatches[i%swatches.length].click();swatches[0].click();});await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true'&&!document.getElementById('filamentPreview').getAttribute('aria-busy')?.includes('true'),'updated face colors');});
  await phase('three_thickness_checks',async()=>{for(const value of [3.5,4,4.5]){await set('thickness',value);await click('checkModel');await wait(()=>!document.getElementById('checkModel').disabled&&document.getElementById('printCheckStatus').dataset.checked==='true','thickness '+value);}});
  await phase('open_3d',async()=>{await click('printPreview');await wait(()=>!document.getElementById('meshCanvas').hidden&&document.querySelector('#meshCanvas canvas')?.dataset.colorSource==='filaments','3D inspection');});
  const first=await phase('first_color_export',()=>file());
  const snapshots=[];
  await phase('three_spool_exports',async()=>{for(const color of ['#CC2255','#2288CC','#8855CC']){
    await evaluate(color=>{const input=document.querySelectorAll('#filamentEditors input')[1];input.value=color;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},color);snapshots.push(await file());
  }});
  await phase('warm_repeat_download',()=>file());
  const finalMesh=await download('stl'),expected=stlFaces(finalMesh);closed(expected);for(const saved of [first,...snapshots])assert.deepEqual(geometry(saved.buffer).triangles,expected,'performance improvements preserve the actual print geometry');
  const model=geometry(snapshots.at(-1).buffer),palette=JSON.parse(strFromU8(model.files['Metadata/project_settings.config'])).filament_colour;assert.ok(palette.includes('#8855CC'));
  const profile=(await window.webContents.debugger.sendCommand('Profiler.stop')).profile,weights=new Map(),nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame.functionName||'(anonymous)']));profile.samples?.forEach((id,i)=>{const name=nodes.get(id);weights.set(name,(weights.get(name)||0)+(profile.timeDeltas?.[i]||0)/1000);});report.mainThread=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([name,milliseconds])=>({name,milliseconds:Math.round(milliseconds)}));report.total=await metrics();
  if(!baseline){
    assert.equal(report.phases.open_svg.dataURLs,0,'large SVG PNGs encode asynchronously');assert.equal(report.phases.three_thickness_checks.reads,0,'thickness changes reuse source pixels');assert.equal(report.phases.three_thickness_checks.pngs,0,'model checks do not encode unused textures');assert.equal(report.phases.three_spool_exports.meshes,0);assert.equal(report.phases.three_spool_exports.proofs,0);assert.equal(report.phases.three_spool_exports.rgbaBytes,0,'prepared color indices replace full RGBA transfers');assert.ok(report.phases.three_spool_exports.indexBytes>0);
    const modelLoads=await evaluate(()=>document.querySelector('#meshCanvas canvas').dataset.modelLoads),builds=await evaluate(()=>window.__perf.meshes);
    await set('hourColor','light');const light=geometry(await download('3mf','standard'));await set('hourColor','dark');const dark=geometry(await download('3mf','standard'));
    assert.notDeepEqual(Buffer.from(light.files['3D/Textures/artwork.png']),Buffer.from(dark.files['3D/Textures/artwork.png']),'contrast changes refresh the texture');assert.deepEqual(light.triangles,dark.triangles);
    await wait(()=>!document.getElementById('meshCanvas').hidden&&document.getElementById('meshCanvas').dataset.textureKey.includes('dark'),'refreshed original 3D texture');assert.equal(await evaluate(()=>document.querySelector('#meshCanvas canvas').dataset.modelLoads),modelLoads);assert.equal(await evaluate(()=>window.__perf.meshes),builds,'contrast changes preserve both the STL and GPU geometry');
    await upload('svgUpload',readFileSync(join(__dirname,'fixtures/bambu-colors.svg'),'utf8'),'clean.svg');await set('markers',false);await set('hourColor','light');const clean=await download('3mf');await set('markers',true);await set('hourColor','dark');await file();await set('markers',false);const restored=await file();assert.deepEqual(restored.buffer,clean,'painting hours never changes the cached original SVG pixels');
    await wait(()=>document.getElementById('filamentPreview').dataset.ready==='true','original export palette');const expected=await evaluate(()=>[...new Set([...document.querySelectorAll('#filamentEditors input')].map(input=>input.value.toUpperCase()))]);
    await evaluate(()=>{window.__holdGeometry=true;const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(data,...args){if(data.alpha&&window.__holdGeometry){window.__holdGeometry=false;window.__releaseGeometry=()=>post.call(this,data,...args);return;}return post.call(this,data,...args);};});
    await set('thickness',6);const exporting=file();await wait(()=>typeof window.__releaseGeometry==='function','captured old SVG build');await upload('svgUpload',readFileSync(join(__dirname,'fixtures/wide-clock.svg'),'utf8'),'newer.svg');await evaluate(()=>window.__releaseGeometry());const old=geometry((await exporting).buffer),oldPalette=JSON.parse(strFromU8(old.files['Metadata/project_settings.config'])).filament_colour;assert.deepEqual(oldPalette,expected,'in-flight exports keep their captured SVG when the active source changes');
    report.cacheChecks='Source pixels, current textures, GPU geometry and in-flight SVG exports verified.';
  }
  const output=process.argv.find(arg=>arg.startsWith('--report='));if(output)writeFileSync(output.slice('--report='.length),JSON.stringify(report,null,2));
  const validation=process.argv.find(arg=>arg.startsWith('--validation-output='));if(validation)writeFileSync(validation.slice('--validation-output='.length),snapshots.at(-1).buffer);
  console.log(JSON.stringify(report,null,2));assert.deepEqual(await evaluate(()=>window.__hrErrors),[]);
}
require('../desktop/main.cjs');
