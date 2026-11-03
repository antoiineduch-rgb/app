// Exercise original painted SVGs through the shipped offline desktop app.
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,readFileSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {app}=require('electron');
const {unzipSync,strFromU8}=require('fflate');
const profile=mkdtempSync(join(tmpdir(),'clock-svg-details-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
let finished=false;
const watchdog=setTimeout(()=>finish(Error('Detailed SVG tests exceeded 120 seconds.')),120000);
function finish(error){if(finished)return;finished=true;clearTimeout(watchdog);if(error)console.error(error.stack||error);else console.log('All detailed SVG desktop regressions passed.');app.exit(error?1:0);}
app.on('quit',()=>{try{rmSync(profile,{recursive:true,force:true});}catch{}});
process.on('uncaughtException',finish);process.on('unhandledRejection',finish);
app.once('browser-window-created',(_event,window)=>window.webContents.once('did-finish-load',()=>run(window).then(()=>finish(),finish)));

function stl(buffer){
  const view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength),count=view.getUint32(80,true),edges=new Map();
  let top=0;
  assert.equal(buffer.length,84+count*50);
  for(let i=0;i<count;i++){
    const p=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)));
    for(let j=0;j<3;j++){
      top=Math.max(top,p[j][2]);const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?`${a}|${b}`:`${b}|${a}`;
      const entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=a<b?1:-1;edges.set(key,entry);
    }
  }
  for(const [count,balance]of edges.values()){assert.equal(count,2,'exact export edges are closed');assert.equal(balance,0,'mesh winding is consistent');}
  return {top,count};
}
async function run(window){
  const evaluate=(fn,...args)=>window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value=>JSON.stringify(value)).join(',')})`,true);
  const set=(id,value,event='input')=>evaluate((id,value,event)=>{const input=document.getElementById(id);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(event,{bubbles:true}));},id,value,event);
  const click=id=>evaluate(id=>document.getElementById(id).click(),id);
  await evaluate(()=>{
    window.__detailErrors=[];window.addEventListener('error',event=>window.__detailErrors.push(event.message));window.addEventListener('unhandledrejection',event=>window.__detailErrors.push(String(event.reason)));
    window.__detailDownloads=[];window.__detailBlobs=new Map();const create=URL.createObjectURL.bind(URL);
    URL.createObjectURL=blob=>{const url=create(blob);window.__detailBlobs.set(url,blob);return url;};
    HTMLAnchorElement.prototype.click=function(){if(/\.(stl|3mf)$/.test(this.download))window.__detailDownloads.push({name:this.download,url:this.href});};
  });
  await set('diameter',100);await set('markers',false);await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());
  const source=readFileSync(join(__dirname,'fixtures/detailed-artwork.svg'),'utf8');
  const imported=await evaluate(async source=>{
    document.getElementById('uploadTab').click();const input=document.getElementById('svgUpload'),files=new DataTransfer();
    files.items.add(new File([source],'detailed-artwork.svg',{type:'image/svg+xml'}));input.files=files.files;await input.onchange({target:input});
    return document.getElementById('uploadStatus').textContent;
  },source);
  assert.match(imported,/Loaded detailed-artwork.svg/);
  async function paintedPixels(dataURL=null,size=400){
    return evaluate(async (url,size)=>{
      const image=new Image();image.src=url||document.querySelector('#originalArtwork image').getAttribute('href');await image.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);
      const data=ctx.getImageData(0,0,size,size).data;let dark=0,green=0,blue=0,red=0;const colors=new Set();
      for(let i=0;i<data.length;i+=4)if(data[i+3]>240){const [r,g,b]=data.subarray(i,i+3);if(r<60&&g<80&&b<65)dark++;if(g>r*1.1&&g>b*1.1)green++;if(b>r*1.15)blue++;if(r>b*1.15)red++;colors.add(`${r},${g},${b}`);}
      return {dark,green,blue,red,colors:colors.size};
    },dataURL,size);
  }
  const painted=await paintedPixels();
  for(const key of ['dark','green','blue','red'])assert.ok(painted[key]>300,`${key} painted SVG details remain visible`);
  assert.ok(painted.colors>1000,'gradient shades and antialiased fine lines survive');
  const gradient=await evaluate(async()=>{
    const image=new Image();image.src=document.querySelector('#originalArtwork image').getAttribute('href');await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,400,400);
    return [[75,92],[176,92]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data));
  });
  assert.ok(gradient[0][2]>gradient[0][0]+50&&gradient[1][0]>gradient[1][2]+50,'percentage gradients keep both ends in the original object bounding box');
  const screenshot=process.argv.find(arg=>arg.startsWith('--screenshot-output='));
  if(screenshot){
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:1380,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate(()=>document.getElementById('artworkCard').scrollIntoView({block:'start'}));
    const capture=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});
    writeFileSync(screenshot.slice('--screenshot-output='.length),Buffer.from(capture.data,'base64'));
    await window.webContents.debugger.sendCommand('Emulation.clearDeviceMetricsOverride');window.webContents.debugger.detach();
  }
  assert.equal(await evaluate(()=>document.getElementById('texture').hidden),true,'added textures do not obscure original artwork');
  console.log('PASS colors, gradients, CSS, symbols, clipping, fine lines, text, patterns, and filters remain visible');
  async function download(format){
    await set('exportFormat',format,'change');
    const result=await evaluate(async()=>{
      const before=window.__detailDownloads.length;document.getElementById('export').click();const deadline=performance.now()+30000;
      while(window.__detailDownloads.length===before&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
      const item=window.__detailDownloads[before];if(!item)throw Error('Detailed SVG download failed: '+document.getElementById('toast').textContent);
      return {name:item.name,bytes:Array.from(new Uint8Array(await window.__detailBlobs.get(item.url).arrayBuffer()))};
    });
    assert.ok(result.name.endsWith(`custom-100mm.${format}`));return Buffer.from(result.bytes);
  }
  const detailedSTL=await download('stl'),detailed=stl(detailedSTL);
  assert.ok(Math.abs(detailed.top-3.8)<1e-5,'internal artwork is actual raised geometry');
  await set('svgRelief',0);const flat=stl(await download('stl'));
  assert.equal(flat.top,3);assert.ok(detailed.count>flat.count+100,'details cannot be just an outer silhouette');
  await set('svgRelief',.8);const threeMF=await download('3mf'),files=unzipSync(threeMF),model=strFromU8(files['3D/3dmodel.model']);
  assert.match(model,/<m:texture2d /);assert.ok(files['3D/Textures/artwork.png']);assert.ok(files['3D/_rels/3dmodel.model.rels']);
  const vertices=[...model.matchAll(/<vertex\b[^>]*>/g)].length,triangles=[...model.matchAll(/<triangle\b[^>]*>/g)].length;
  assert.equal(triangles,detailed.count);assert.ok(vertices>0);
  const pngURL=`data:image/png;base64,${Buffer.from(files['3D/Textures/artwork.png']).toString('base64')}`;
  const texture=await paintedPixels(pngURL);
  for(const key of ['dark','green','blue','red'])assert.ok(Math.abs(texture[key]-painted[key])/painted[key]<.06,`${key} detail also exists in the embedded 3MF color texture`);
  assert.equal([...model.matchAll(/pid="4"/g)].length>100,true,'painted faces reference their texture');
  console.log('PASS detailed STL is watertight; relief height changes geometry; 3MF preserves the mesh and original color texture');
  const output=process.argv.find(arg=>arg.startsWith('--validation-output='));if(output)writeFileSync(output.slice('--validation-output='.length),threeMF);
  const originalPNG=Buffer.from(files['3D/Textures/artwork.png']);
  await click('artRotateRight');const rotatedFiles=unzipSync(await download('3mf'));
  assert.notDeepEqual(Buffer.from(rotatedFiles['3D/Textures/artwork.png']),originalPNG,'the exported colored details rotate with the footprint');
  const rotation=await evaluate(async(before,after)=>{
    const pixels=async url=>{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,128,128);return ctx.getImageData(0,0,128,128).data;};
    const a=await pixels(before),b=await pixels(after);let mismatches=0;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const source=((127-x)*128+y)*4,target=(y*128+x)*4;
      if([0,1,2,3].some(channel=>Math.abs(a[source+channel]-b[target+channel])>12))mismatches++;
    }
    return mismatches/(128*128);
  },pngURL,`data:image/png;base64,${Buffer.from(rotatedFiles['3D/Textures/artwork.png']).toString('base64')}`);
  assert.ok(rotation<.025,`3MF color pixels follow the correct quarter turn (${rotation} mismatch)`);
  await set('svgRelief',2);await set('markers',true);await set('hourStyle','arabic','change');
  assert.ok(Math.abs(stl(await download('stl')).top-5.8)<1e-5,'maximum relief and added numerals form a closed clock');
  await set('markers',false);
  await evaluate(()=>{window.__realDetailWorker=window.Worker;window.Worker=class{constructor(){throw Error('Worker unavailable in this test');}};});
  await set('svgRelief',.4);assert.ok(Math.abs(stl(await download('stl')).top-3.4)<1e-5,'the browser fallback also preserves detailed geometry');
  await evaluate(()=>{window.Worker=window.__realDetailWorker;});
  assert.deepEqual(await evaluate(()=>window.__detailErrors),[]);
  console.log('PASS detailed orientation, maximum relief with numerals, and worker fallback preserve printable details');
  await click('artMirrorX');await set('svgTone','light','change');await set('svgRelief',1.2);
  await new Promise(resolve=>setTimeout(resolve,350));
  await window.webContents.reload();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));
  const restored=await evaluate(async()=>{
    const deadline=performance.now()+10000;while(!document.getElementById('originalArtwork')&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
    return {art:!!document.getElementById('originalArtwork'),mode:document.getElementById('svgDetail').value,height:document.getElementById('svgRelief').value,tone:document.getElementById('svgTone').value};
  });
  assert.deepEqual(restored,{art:true,mode:'artwork',height:'1.2',tone:'light'});
  console.log('PASS original details and relief controls survive rotation, mirroring, and reopening saved SVGs');
  await set('svgDetail','silhouette','change');assert.equal(await evaluate(()=>!!document.getElementById('originalArtwork')),false);
  await set('svgDetail','artwork','change');assert.equal(await evaluate(()=>!!document.getElementById('originalArtwork')),true);
  console.log('PASS silhouette mode remains available and returning to original artwork restores its details');
}
require('../desktop/main.cjs');
