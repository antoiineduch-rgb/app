import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {makeClockSTL} from './mesh.js';
import {analyzeSTL} from './mesh-analysis.js';
import {binarySTLTriangles,stlTo3MF} from './export-3mf.js';
import {stlToBambu3MF} from './export-bambu.js';
import {filamentCode} from './bambu-paint.js';
import {artworkPlacement,artworkPixel,paintedTriangle} from './artwork-surface.js';

const defaults={design:'custom',diameter:100,thickness:3,hole:8,texture:'smooth',markers:false,mechanismRecess:true,mechanismMount:'box',mechanismWall:1.6,mechanismFlatFront:true,recessWidth:55,recessHeight:55,recessDepth:5.5,recessClearance:.5};
function circle(){const n=96,alpha=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(Math.hypot(x+.5-n/2,y+.5-n/2)<n*.45)alpha[y*n+x]=255;return {n,alpha};}
function closed(faces){const edges=new Map();for(const p of faces)for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(const [count,balance]of edges.values()){assert.equal(count,2,'each serialized edge joins exactly two faces');assert.equal(balance,0,'faces have consistent outward winding');}}
function surfaces(triangles,x,y){const z=[];for(const [a,b,c]of triangles){const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;if(Math.min(u,v,1-u-v)>-1e-7)z.push(u*a[2]+v*b[2]+(1-u-v)*c[2]);}return [...new Set(z.map(v=>Math.round(v*1e5)/1e5))].sort((a,b)=>a-b);}
const files=buffer=>unzipSync(new Uint8Array(buffer));

test('a raised mechanism box has a flat bed face, four upright walls, an open top and a clear shaft',()=>{
  const {n,alpha}=circle(),buffer=makeClockSTL(alpha,n,defaults),faces=[...binarySTLTriangles(buffer)],stats=analyzeSTL(buffer);closed(faces);
  assert.equal(stats.components,1);assert.equal(stats.min[2],0);assert.equal(stats.dimensions[2],8.5);
  assert.deepEqual(surfaces(faces,0,0),[],'the shaft remains open through the plate');
  assert.deepEqual(surfaces(faces,15,3),[0,3],'inside the box only the original 3 mm plate remains');
  assert.deepEqual(surfaces(faces,28.7,2),[0,8.5],'1.6 mm walls rise 5.5 mm above the back');
  assert.deepEqual(surfaces(faces,35,2),[0,3],'the rest of the clock is unchanged in thickness');
  assert.ok(faces.filter(p=>p.every(v=>Math.abs(v[2]-8.5)<1e-5)).every(p=>Math.abs(p.reduce((s,v)=>s+v[0],0)/3)>27.9||Math.abs(p.reduce((s,v)=>s+v[1],0)/3)>27.9),'there is no lid over the movement');
  const normal=analyzeSTL(makeClockSTL(alpha,n,{...defaults,mechanismRecess:false}));
  const roundedArea=(w,h,r)=>w*h-(4-Math.PI)*r*r,wallArea=roundedArea(59.2,59.2,2.6)-roundedArea(56,56,1);
  assert.ok(Math.abs(stats.volume-normal.volume-wallArea*5.5)<.5,'only the four box walls add material');
});

test('independent movement sizes, wall thickness and box height control real geometry',()=>{
  const {n,alpha}=circle(),settings={...defaults,recessWidth:40,recessHeight:55,recessDepth:4.2,mechanismWall:2.4,recessClearance:0},buffer=makeClockSTL(alpha,n,settings),faces=[...binarySTLTriangles(buffer)];closed(faces);
  assert.ok(Math.abs(analyzeSTL(buffer).dimensions[2]-7.2)<1e-5);
  assert.deepEqual(surfaces(faces,19.9,3),[0,3]);assert.deepEqual(surfaces(faces,21,3),[0,7.2]);assert.deepEqual(surfaces(faces,5,28.5),[0,7.2]);assert.deepEqual(surfaces(faces,25,3),[0,3]);
  assert.throws(()=>makeClockSTL(alpha,n,{...settings,mechanismWall:0}),/Rear box:.*wall/);
  assert.throws(()=>makeClockSTL(alpha,n,{...settings,recessWidth:5,recessHeight:5}),/shaft hole clear/);
});

test('a round backing supports a raised box and starts flat on the bed without thick-pocket requirements',()=>{
  const n=96,alpha=new Uint8Array(n*n);for(let y=20;y<76;y++)for(let x=8;x<88;x++)if(x<30||x>65)alpha[y*n+x]=255;
  assert.throws(()=>makeClockSTL(alpha,n,defaults),/Rear box:.*solid clock face/);
  const settings={...defaults,svgBacking:true,svgBackingThickness:1.2,svgBackingMargin:3},buffer=makeClockSTL(alpha,n,settings),faces=[...binarySTLTriangles(buffer)],stats=analyzeSTL(buffer);closed(faces);
  assert.equal(stats.components,1);assert.ok(Math.abs(stats.dimensions[2]-9.7)<1e-5);assert.deepEqual(surfaces(faces,40,3),[0,4.2]);
  assert.deepEqual(surfaces(faces,15,3),[0,4.2],'the clock plate itself forms the box floor');
});

test('raised front details remain available without replacing the rear box with a thick recessed plate',()=>{
  const {n,alpha}=circle(),settings={...defaults,mechanismFlatFront:false,markers:true,hourStyle:'arabic',numberSize:100,numberPosition:100},buffer=makeClockSTL(alpha,n,settings),faces=[...binarySTLTriangles(buffer)];closed(faces);
  const stats=analyzeSTL(buffer);assert.ok(Math.abs(stats.dimensions[2]-9.3)<1e-5);assert.deepEqual(surfaces(faces,15,3),[5.5,8.5]);assert.deepEqual(surfaces(faces,35,3),[5.5,8.5]);
  assert.equal(artworkPlacement(settings,{scale:1,cx:48,cy:48,n:96}).thickness,8.5);
});

test('both 3MF formats paint the face-down front with readable, correctly positioned SVG colors',()=>{
  const {n,alpha}=circle(),buffer=makeClockSTL(alpha,n,defaults),faces=[...binarySTLTriangles(buffer)],width=32,rgba=new Uint8ClampedArray(width*width*4),frame={scale:100/width,cx:width/2,cy:width/2,n:width};
  for(let y=0;y<width;y++)for(let x=0;x<width;x++)rgba.set(y<width/2?[229,57,53,255]:[40,85,214,255],(y*width+x)*4);
  const placement=artworkPlacement(defaults,frame),painting={rgba,width,height:width,...placement};
  assert.deepEqual(artworkPixel([0,-25,0],placement.frame),[16,8]);assert.deepEqual(artworkPixel([0,25,0],placement.frame),[16,24]);
  const native=stlToBambu3MF(buffer,{painting,color:'#CCCCCC',backColor:'face'}),xml=strFromU8(files(native.buffer)['3D/3dmodel.model']),codes=[...xml.matchAll(/paint_color="([0-9A-F]+)"/g)].map(m=>m[1]);
  const red=filamentCode(native.palette.indexOf('#E53935')),blue=filamentCode(native.palette.indexOf('#2855D6'));let upper=0,lower=0;
  faces.forEach((points,i)=>{
    if(!paintedTriangle(points,painting))assert.equal(codes[i],filamentCode(0),'box walls and back retain the base filament');
    else if(points.every(p=>p[1]<-.5)){assert.equal(codes[i],red);upper++;}
    else if(points.every(p=>p[1]>.5)){assert.equal(codes[i],blue);lower++;}
  });assert.ok(upper>0&&lower>0,'asymmetric artwork is checked on both sides of the face');
  const png=new Uint8Array([137,80,78,71,13,10,26,10,...new Array(24).fill(0)]),standard=files(stlTo3MF(buffer,{artwork:{png,...placement}})),model=strFromU8(standard['3D/3dmodel.model']);
  const triangles=[...model.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"([^>]*)\/>/g)],vertices=[...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number)),uv=[...model.matchAll(/<m:tex2coord u="([^"]+)" v="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));
  triangles.forEach((m,i)=>assert.equal(m[4].includes('pid="4"'),paintedTriangle(faces[i],painting)));
  vertices.forEach((point,i)=>assert.deepEqual(uv[i],[(point[0]/frame.scale+frame.cx)/width,1-(frame.cy+point[1]/frame.scale)/width]));
});
