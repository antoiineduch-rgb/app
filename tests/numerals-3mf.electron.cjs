// Real desktop integration: shared numeral geometry, saved controls, both file
// formats, and a native 3MF download through the production session handler.
// Linux: electron --no-sandbox --ozone-platform=headless --disable-gpu
// tests/numerals-3mf.electron.cjs
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { app, session } = require('electron');
const { unzipSync, strFromU8 } = require('fflate');

const profile = mkdtempSync(join(tmpdir(), 'clock-factory-numerals-tests-'));
app.setPath('userData', profile);
app.disableHardwareAcceleration();
let completed = false;
const watchdog = setTimeout(() => finish(new Error('Numeral and 3MF desktop checks exceeded 120 seconds.')), 120000);
function finish(error) {
  if (completed) return;
  completed = true;
  clearTimeout(watchdog);
  if (error) console.error(error.stack || error);
  else console.log('All hour numeral and 3MF desktop regressions passed.');
  app.exit(error ? 1 : 0);
}
app.on('quit', () => { try { rmSync(profile, { recursive: true, force: true }); } catch {} });
app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', () => run(window).then(() => finish(), finish));
});
process.on('uncaughtException', finish);
process.on('unhandledRejection', finish);

function meshMetrics(vertices, triangles) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  let volume = 0, checksum = 0;
  for (const triangle of triangles) {
    const points = triangle.map(index => {
      assert.ok(Number.isInteger(index) && index >= 0 && index < vertices.length, 'triangle indexes a real vertex');
      return vertices[index];
    });
    for (const point of points) point.forEach((value, axis) => {
      assert.ok(Number.isFinite(value), 'mesh coordinates are finite');
      min[axis] = Math.min(min[axis], value); max[axis] = Math.max(max[axis], value);
      checksum += value * (axis + 1);
    });
    const [a,b,c] = points;
    volume += (a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  }
  assert.ok(triangles.length > 100 && volume > 0, 'a nonempty outward print mesh was exported');
  return { count: triangles.length, volume, min, max, checksum };
}
function stlMetrics(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength), count = view.getUint32(80, true);
  assert.equal(buffer.byteLength, 84 + count * 50);
  const vertices = [], triangles = [];
  for (let i=0;i<count;i++) {
    const triangle = [];
    for (let j=0;j<3;j++) {
      triangle.push(vertices.length);
      vertices.push([0,1,2].map(axis => view.getFloat32(84+i*50+12+j*12+axis*4, true)));
    }
    triangles.push(triangle);
  }
  return meshMetrics(vertices, triangles);
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)].map(match => [match[1],match[2]]));
}
function threeMF(buffer, expectedColor) {
  assert.equal(buffer[0], 0x50); assert.equal(buffer[1], 0x4b);
  const files = unzipSync(buffer);
  for (const part of ['[Content_Types].xml', '_rels/.rels', '3D/3dmodel.model']) assert.ok(files[part], `3MF contains ${part}`);
  const types = strFromU8(files['[Content_Types].xml']), relationships = strFromU8(files['_rels/.rels']);
  const model = strFromU8(files['3D/3dmodel.model']);
  assert.match(types, /application\/vnd\.ms-package\.3dmanufacturing-3dmodel\+xml/);
  assert.match(relationships, /3D\/3dmodel\.model/);
  assert.match(relationships, /http:\/\/schemas\.microsoft\.com\/3dmanufacturing\/2013\/01\/3dmodel/);
  assert.match(model, /http:\/\/schemas\.microsoft\.com\/3dmanufacturing\/core\/2015\/02/);
  assert.equal(attributes(model.match(/<model\b[^>]*>/)[0]).unit, 'millimeter');
  const material = attributes(model.match(/<base\b[^>]*>/)[0]);
  assert.equal(material.displaycolor.toUpperCase(), expectedColor.toUpperCase());
  const object = attributes(model.match(/<object\b[^>]*>/)[0]), item = attributes(model.match(/<item\b[^>]*>/)[0]);
  assert.equal(item.objectid, object.id, 'build item references the mesh object');
  assert.ok(object.pid && object.pindex === '0', 'mesh uses the selected color material');
  const vertices = [...model.matchAll(/<vertex\b[^>]*>/g)].map(match => {
    const vertex = attributes(match[0]); return [Number(vertex.x),Number(vertex.y),Number(vertex.z)];
  });
  const triangles = [...model.matchAll(/<triangle\b[^>]*>/g)].map(match => {
    const triangle = attributes(match[0]); return [Number(triangle.v1),Number(triangle.v2),Number(triangle.v3)];
  });
  return { model, metrics: meshMetrics(vertices, triangles) };
}
function sameGeometry(a, b) {
  assert.equal(a.count, b.count, 'format changes keep the triangle count');
  assert.ok(Math.abs(a.volume-b.volume)/a.volume < 1e-6, 'format changes keep physical volume');
  for (let axis=0;axis<3;axis++) {
    assert.ok(Math.abs(a.min[axis]-b.min[axis]) < 1e-5);
    assert.ok(Math.abs(a.max[axis]-b.max[axis]) < 1e-5);
  }
  assert.ok(Math.abs(a.checksum-b.checksum) < 1e-3, 'format changes keep the exported vertex coordinates');
}

async function run(window) {
  const errors = [];
  const evaluate = (fn, ...args) => window.webContents.executeJavaScript(`(${fn.toString()})(${args.map(value => JSON.stringify(value)).join(',')})`, true);
  async function hooks() {
    await evaluate(() => {
      window.__numberErrors = [];
      window.addEventListener('error', event => window.__numberErrors.push(event.message));
      window.addEventListener('unhandledrejection', event => window.__numberErrors.push(String(event.reason)));
      window.__numberBlobs = new Map(); window.__numberDownloads = [];
      const originalCreateURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = blob => { const url = originalCreateURL(blob); window.__numberBlobs.set(url, blob); return url; };
      window.__nativeAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (/\.(stl|3mf)$/i.test(this.download)) window.__numberDownloads.push({ name: this.download, url: this.href });
      };
    });
  }
  async function waitFor(fn, description, timeout=8000) {
    const end = Date.now()+timeout;
    while (Date.now()<end) {
      const result = await evaluate(fn); if (result) return result;
      await new Promise(resolve => setTimeout(resolve,25));
    }
    throw Error('Timed out waiting for '+description+': '+await evaluate(() => document.getElementById('toast').textContent));
  }
  async function set(id, value, event='input') {
    await evaluate((id,value,event) => {
      const input=document.getElementById(id);
      if(input.type==='checkbox')input.checked=value;else input.value=value;
      input.dispatchEvent(new Event(event,{bubbles:true}));
    }, id,value,event);
  }
  async function click(id) { await evaluate(id => document.getElementById(id).click(), id); }
  async function download(extension) {
    const result = await evaluate(async extension => {
      const before=window.__numberDownloads.length;
      document.getElementById('export').click();
      const end=performance.now()+20000;
      while(window.__numberDownloads.length===before&&performance.now()<end)await new Promise(resolve=>setTimeout(resolve,20));
      const entry=window.__numberDownloads[before];
      if(!entry)throw Error('No export: '+document.getElementById('toast').textContent);
      if(!entry.name.toLowerCase().endsWith('.'+extension))throw Error('Wrong export extension: '+entry.name);
      const blob=window.__numberBlobs.get(entry.url);
      const dataURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
      return {name:entry.name,type:blob.type,data:dataURL.slice(dataURL.indexOf(',')+1)};
    },extension);
    return {...result,buffer:Buffer.from(result.data,'base64')};
  }
  async function numeralStats(style) {
    const labels = await evaluate(() => [...document.querySelectorAll('#hourNumerals [data-hour]')].map(group=>({hour:group.dataset.hour,label:group.dataset.label||group.getAttribute('aria-label')})));
    assert.equal(labels.length,12,'preview contains twelve hour labels');
    assert.equal(new Set(labels.map(label=>label.hour)).size,12);
    const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    for(const entry of labels)assert.equal(entry.label,style==='roman'?roman[Number(entry.hour)%12]:String(entry.hour));
    return evaluate(async () => {
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width','400');svg.setAttribute('height','400');svg.setAttribute('viewBox','0 0 400 400');
      svg.append(document.getElementById('clockSvg').querySelector('defs').cloneNode(true));
      svg.append(document.getElementById('hourNumerals').cloneNode(true));
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
      try{
        const image=new Image();image.src=url;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=canvas.height=400;
        const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
        const pixels=context.getImageData(0,0,400,400).data;
        let count=0,radius=0;const hours=new Array(12).fill(0);
        for(let y=0;y<400;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]>=128){
          count++;radius+=Math.hypot(x-200,y-200);
          for(let h=0;h<12;h++){const a=h*Math.PI/6,cx=200+Math.sin(a)*120,cy=200-Math.cos(a)*120;if(Math.abs(x-cx)<25&&Math.abs(y-cy)<25)hours[h]++;}
        }
        return {count,meanRadius:radius/count,hours};
      }finally{URL.revokeObjectURL(url);}
    });
  }

  await hooks();
  assert.deepEqual(await evaluate(()=>({url:location.href,node:typeof window.require})),{url:'clock://studio/index.html',node:'undefined'});
  await evaluate(()=>document.querySelector('[data-design="round"]').click());
  await set('diameter','100');await evaluate(()=>document.querySelector('[data-texture="smooth"]').click());
  await set('markers',false);
  const face=await download('stl'),faceMesh=stlMetrics(face.buffer);
  assert.equal(face.type,'model/stl');assert.equal(faceMesh.max[2],3);
  await set('markers',true);await set('hourStyle','ticks','change');
  const ticks=stlMetrics((await download('stl')).buffer);
  assert.ok(ticks.volume>faceMesh.volume);

  await set('hourStyle','arabic','change');await set('numberSize','100');await set('numberPosition','100');
  const normalStats=await numeralStats('arabic');
  assert.ok(normalStats.count>1000&&normalStats.hours.every(count=>count>4),'Arabic ink is visible at every hour position');
  const arabic=stlMetrics((await download('stl')).buffer);
  assert.ok(arabic.volume>faceMesh.volume&&arabic.count!==ticks.count,'number geometry is present in the print file');
  assert.ok(Math.abs(arabic.max[2]-3.8)<1e-5);
  await set('markers',false);
  assert.equal(await evaluate(()=>document.querySelectorAll('#hourNumerals [data-hour]').length),0,'turning hour details off removes the preview labels');
  sameGeometry(faceMesh,stlMetrics((await download('stl')).buffer));
  await set('markers',true);
  await set('numberSize','130');
  const largeStats=await numeralStats('arabic'),large=stlMetrics((await download('stl')).buffer);
  assert.ok(largeStats.count>normalStats.count*1.05&&large.volume>arabic.volume,'larger numerals grow in both preview and print');
  await set('numberPosition','80');
  const inwardStats=await numeralStats('arabic'),inward=stlMetrics((await download('stl')).buffer);
  assert.ok(inwardStats.meanRadius<largeStats.meanRadius-10,'position control moves preview numerals inward');
  assert.ok(Math.abs(inward.checksum-large.checksum)>1,'position control changes print coordinates');
  assert.ok(Math.abs(inward.volume-large.volume)/large.volume<.001,'moving unclipped labels preserves their volume');
  console.log('PASS Arabic hour labels, size, and radial position affect visible and printable geometry');

  await set('hourStyle','roman','change');
  assert.ok((await numeralStats('roman')).count>500);
  const romanSTL=stlMetrics((await download('stl')).buffer);
  assert.ok(romanSTL.count!==inward.count,'Roman and Arabic numerals have different print geometry');
  await set('exportFormat','3mf','change');
  assert.match(await evaluate(()=>document.getElementById('export').textContent),/3mf/i);
  const first3MF=await download('3mf');assert.equal(first3MF.type,'model/3mf');
  sameGeometry(romanSTL,threeMF(first3MF.buffer,'#C47F62FF').metrics);
  await evaluate(()=>document.querySelector('.swatch[aria-label="Sage"]').click());
  const recolored=await download('3mf');sameGeometry(romanSTL,threeMF(recolored.buffer,'#94A18AFF').metrics);
  await set('exportFormat','stl','change');
  const after3MF=await download('stl');assert.equal(after3MF.type,'model/stl');sameGeometry(romanSTL,stlMetrics(after3MF.buffer));
  console.log('PASS Roman numerals and genuine color 3MF export preserve STL geometry across cached format changes');

  await set('exportFormat','3mf','change');
  await waitFor(()=>{const saved=JSON.parse(localStorage.getItem('clock-factory')||'{}');return saved.hourStyle==='roman'&&saved.numberSize===130&&saved.numberPosition===80&&saved.exportFormat==='3mf';},'saved hour and format settings');
  errors.push(...await evaluate(()=>window.__numberErrors));
  await new Promise(resolve=>{window.webContents.once('did-finish-load',resolve);window.webContents.reload();});
  await hooks();
  assert.deepEqual(await evaluate(()=>Object.fromEntries(['hourStyle','numberSize','numberPosition','exportFormat'].map(id=>[id,document.getElementById(id).value]))),{hourStyle:'roman',numberSize:'130',numberPosition:'80',exportFormat:'3mf'});
  await numeralStats('roman');
  console.log('PASS numeral settings and selected download format restore after reopening');

  await evaluate(async()=>{
    document.getElementById('uploadTab').click();
    const input=document.getElementById('svgUpload'),data=new DataTransfer();
    data.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M20 20H90V75H180V180H20Z"/></svg>'],'numbered-clock.svg',{type:'image/svg+xml'}));
    input.files=data.files;await input.onchange({target:input});
  });
  const upright=await evaluate(()=>document.getElementById('hourNumerals').innerHTML);
  await click('artRotateRight');
  assert.equal(await evaluate(()=>document.getElementById('hourNumerals').innerHTML),upright,'rotating imported SVG does not rotate the clock numbers');
  console.log('PASS imported SVG orientation leaves hour numerals upright');

  const nativePath=join(profile,'native-clock.3mf');
  const native=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Native 3MF download did not complete')),20000);
    session.defaultSession.once('will-download',(event,item)=>{
      try{
        assert.equal(Boolean(event.defaultPrevented),false,'production download handler accepts 3MF');
        assert.ok(item.getFilename().endsWith('.3mf'));
        assert.ok(item.getSaveDialogOptions().filters.some(filter=>filter.extensions.includes('3mf')),'native Save As offers the 3MF extension');
        item.setSavePath(nativePath);
        item.once('done',(_event,state)=>{
          clearTimeout(timeout);
          try{assert.equal(state,'completed');const buffer=readFileSync(nativePath);threeMF(buffer,'#94A18AFF');resolve();}catch(error){reject(error);}
        });
      }catch(error){clearTimeout(timeout);event.preventDefault();reject(error);}
    });
  });
  await evaluate(()=>{HTMLAnchorElement.prototype.click=window.__nativeAnchorClick;document.getElementById('export').click();});
  await native;
  errors.push(...await evaluate(()=>window.__numberErrors));assert.deepEqual(errors,[]);
  console.log('PASS desktop native 3MF download completes with the correct Save As filter and real ZIP data');
}

require('../desktop/main.cjs');
