import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {makeClockSTL,buildClockLayers} from './mesh.js';
import {analyzeSTL} from './mesh-analysis.js';
import {binarySTLTriangles,stlTo3MF} from './export-3mf.js';
import {stlToBambu3MF} from './export-bambu.js';
import {artworkPlacement} from './artwork-surface.js';
import {standPose} from './stand-settings.js';
const defaults={design:'custom',diameter:200,thickness:3,hole:8,texture:'smooth',markers:false,deskStand:true,standWidth:45,standDepth:45,standLean:12};
function circle(){const n=120,alpha=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(Math.hypot(x+.5-n/2,y+.5-n/2)<n*.45)alpha[y*n+x]=255;return {n,alpha};}
function closed(faces){const edges=new Map();for(const p of faces)for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(const [count,balance]of edges.values()){assert.equal(count,2);assert.equal(balance,0);}}
const posePoint=(p,pose)=>[p[0],p[1]*Math.cos(pose.rotation)-p[2]*Math.sin(pose.rotation)+pose.y,p[1]*Math.sin(pose.rotation)+p[2]*Math.cos(pose.rotation)+pose.z];
function surfaces(faces,x,y){const z=[];for(const [a,b,c]of faces){const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;if(Math.min(u,v,1-u-v)>-1e-7)z.push(u*a[2]+v*b[2]+(1-u-v)*c[2]);}return z;}
function volumeCenter(faces){let sum=0;const center=[0,0,0];for(const [a,b,c]of faces){const v=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;sum+=v;for(let k=0;k<3;k++)center[k]+=v*(a[k]+b[k]+c[k])/4;}return center.map(v=>v/sum);}

test('an integrated tapered stand is one closed piece, prints face-down and meets the desk at its chosen lean',()=>{
  const {n,alpha}=circle(),buffer=makeClockSTL(alpha,n,defaults),faces=[...binarySTLTriangles(buffer)],stats=analyzeSTL(buffer);closed(faces);
  assert.equal(stats.components,1);assert.equal(stats.min[2],0);assert.equal(stats.max[2],48);assert.deepEqual(surfaces(faces,0,0),[],'the shaft remains open');assert.ok(stats.triangles<5000,'smooth tapers do not use staircase slices');
  const pose=standPose(defaults,-stats.max[1],3),world=faces.flatMap(p=>p.map(v=>posePoint(v,pose)));assert.ok(Math.min(...world.map(p=>p[2]))>-.0001,'neither the clock nor stand passes through the desk');
  const feet=faces.flat().filter(p=>Math.abs(p[2]-48)<1e-5).map(p=>posePoint(p,pose)),contacts=feet.filter(p=>Math.abs(p[2])<.0001);assert.ok(contacts.some(p=>p[0]<-22)&&contacts.some(p=>p[0]>22),'the rear contact spans the whole stand width');
  const rear=contacts[0][1],center=posePoint(volumeCenter(faces),pose);assert.ok(center[1]>0&&center[1]<rear);assert.ok(Math.abs(center[0])<22.5*center[1]/rear,'the model-only center of mass lies inside its support triangle');
  const normal=analyzeSTL(makeClockSTL(alpha,n,{...defaults,deskStand:false}));assert.ok(stats.volume-normal.volume<16000,'the rear support stays hollow rather than becoming a heavy solid wedge');
});
test('the stand clears raised boxes and keeps recessed mechanism openings intact',()=>{
  const {n,alpha}=circle(),base={...defaults,mechanismRecess:true,recessWidth:55,recessHeight:55,recessDepth:5.5,recessClearance:.5};
  for(const mechanismMount of ['box','recess']){
    const settings={...base,mechanismMount,thickness:mechanismMount==='box'?3:7,mechanismFlatFront:false},buffer=makeClockSTL(alpha,n,settings),faces=[...binarySTLTriangles(buffer)],stats=analyzeSTL(buffer);closed(faces);assert.equal(stats.components,1);assert.equal(stats.max[2],settings.thickness+45);
    const inside=surfaces(faces,15,3);assert.ok(inside.every(z=>Math.abs(z)<.0001||Math.abs(z-(mechanismMount==='box'?3:1.5))<.0001),'the stand does not fill the mechanism opening');assert.deepEqual(surfaces(faces,0,0),[]);
  }
});
test('width, depth and lean change the real support and unsuitable attachments fail clearly',()=>{
  const {n,alpha}=circle();
  for(const settings of [{...defaults,standWidth:60,standDepth:60,standLean:18},{...defaults,diameter:100,standWidth:25,standDepth:25,standLean:6}]){
    const buffer=makeClockSTL(alpha,n,settings),faces=[...binarySTLTriangles(buffer)],stats=analyzeSTL(buffer);closed(faces);assert.equal(stats.max[2],3+settings.standDepth);
    const vertices=faces.flat().filter(p=>Math.abs(p[2]-stats.max[2])<1e-5);assert.equal(Math.max(...vertices.map(p=>p[0]))-Math.min(...vertices.map(p=>p[0])),settings.standWidth);
    const pose=standPose(settings,-stats.max[1],3);assert.ok(Math.min(...faces.flatMap(p=>p.map(v=>posePoint(v,pose)[2])))>-.0001);
  }
  assert.throws(()=>makeClockSTL(alpha,n,{...defaults,standDepth:0}),/Desk stand:/);
  assert.throws(()=>makeClockSTL(alpha,n,{...defaults,diameter:300,standLean:20}),/center of mass/,'an overly short support cannot silently export a model that tips backward');
  const thin=new Uint8Array(n*n);for(let y=49;y<71;y++)for(let x=6;x<114;x++)thin[y*n+x]=255;
  assert.throws(()=>makeClockSTL(thin,n,{...defaults,mechanismRecess:true,mechanismMount:'box',recessWidth:10,recessHeight:10}),/Desk stand:/);
  const backed={...defaults,svgBacking:true,svgBackingThickness:1.2,svgBackingMargin:3},buffer=makeClockSTL(thin,n,backed);closed([...binarySTLTriangles(buffer)]);assert.equal(analyzeSTL(buffer).components,1);
});
test('both 3MF exports retain the stand geometry and keep color painting on the flat front',()=>{
  const {n,alpha}=circle(),buffer=makeClockSTL(alpha,n,defaults),faces=[...binarySTLTriangles(buffer)],width=16,rgba=new Uint8ClampedArray(width*width*4);for(let i=0;i<width*width;i++)rgba.set(i%width<8?[229,57,53,255]:[40,85,214,255],i*4);
  const placement=artworkPlacement(defaults,{scale:200/width,cx:8,cy:8,n:width}),native=stlToBambu3MF(buffer,{painting:{rgba,width,height:width,...placement}}).buffer;
  const png=new Uint8Array([137,80,78,71,13,10,26,10,...new Array(24).fill(0)]),standard=stlTo3MF(buffer,{artwork:{png,...placement}});
  for(const [format,exported]of [['native',native],['standard',standard]]){
    const files=unzipSync(new Uint8Array(exported)),xml=strFromU8(files['3D/3dmodel.model']),vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number)),triangles=[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"([^>]*)\/>/g)];
    triangles.forEach((m,i)=>{assert.deepEqual(m.slice(1,4).map(id=>vertices[Number(id)]),faces[i].map(p=>p.map(v=>v||0)));if(faces[i].some(p=>p[2]>3))assert.ok(format==='native'?m[4].includes('paint_color="4"'):!m[4].includes('pid="4"'),'the stand uses the base material');});
  }
  assert.ok(buildClockLayers(alpha,n,defaults).some(layer=>layer.topPolygons),'the exported support uses true sloped surfaces');
});
