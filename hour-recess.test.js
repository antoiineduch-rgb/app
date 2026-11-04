import {test} from 'node:test';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';
import {makeClockSTL} from './mesh.js';
import {artworkFrame} from './svg-details.js';
import {hourNumeralPolygons} from './hour-numerals.js';
import {fitHourLayout,fittedHourPolygons} from './hour-layout.js';
import {analyzeSTL} from './mesh-analysis.js';
const defaults={design:'custom',diameter:200,thickness:7,hole:8,texture:'smooth',markers:true,hourStyle:'arabic',numberSize:100,numberPosition:100,hourFit:true};
function rectangle(){const n=150,alpha=new Uint8Array(n*n);for(let y=45;y<105;y++)for(let x=7;x<143;x++)alpha[y*n+x]=255;return {n,alpha};}
const area=polys=>polys.reduce((s,p)=>s+p.reduce((v,r,i)=>{let a=0;for(let j=0;j<r.length-1;j++)a+=r[j][0]*r[j+1][1]-r[j+1][0]*r[j][1];return v+(i?-1:1)*Math.abs(a/2);},0),0);
function faces(buffer){const view=new DataView(buffer);return Array.from({length:view.getUint32(80,true)},(_,i)=>[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)||0)));}
function closed(triangles){const edges=new Map();for(const p of triangles)for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(const [count,balance]of edges.values()){assert.equal(count,2,'exact STL edges are closed');assert.equal(balance,0,'all faces have consistent winding');}}
function surfaces(triangles,x,y){const z=[];for(const [a,b,c]of triangles){const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;if(Math.min(u,v,1-u-v)>-1e-7)z.push(u*a[2]+v*b[2]+(1-u-v)*c[2]);}return z;}
test('all 12 Arabic and Roman labels fit a narrow SVG in the correct clock directions without clipping or collisions',()=>{
  const {n,alpha}=rectangle(),frame=artworkFrame(alpha,n,200),halfHeight=60*frame.scale/2,outline=[[[[-100,-halfHeight],[100,-halfHeight],[100,halfHeight],[-100,halfHeight],[-100,-halfHeight]]]];
  for(const hourStyle of ['arabic','roman']){
    const settings={...defaults,hourStyle},layout=fitHourLayout(alpha,n,frame,settings),polygons=fittedHourPolygons(settings,layout);
    assert.equal(layout.labels.length,12);assert.deepEqual(layout.missing,[]);assert.ok(area(clipping.difference(hourNumeralPolygons(settings),outline))>1,'the previous fixed circle protruded outside this SVG');
    assert.ok(area(clipping.difference(polygons,outline))<1e-5,'every complete label stays inside the face');
    for(const label of layout.labels){const angle=label.hour*Math.PI/6;assert.ok(Math.abs(label.x*Math.cos(angle)-label.y*Math.sin(angle))<1e-5,'each hour keeps its exact hand direction');}
    for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)assert.ok(area(clipping.intersection(layout.labels[i].polygons,layout.labels[j].polygons))<1e-5,'neighboring numbers never intersect');
    const buffer=makeClockSTL(alpha,n,settings);closed(faces(buffer));assert.equal(analyzeSTL(buffer).components,1);
  }
});
test('disconnected SVGs report hours that cannot fit; a backing supports all 12 full labels as one solid',()=>{
  const n=100,alpha=new Uint8Array(n*n);for(let y=20;y<80;y++)for(let x=8;x<92;x++)if(x<28||x>72)alpha[y*n+x]=255;
  const settings={...defaults,diameter:100},frame=artworkFrame(alpha,n,100),layout=fitHourLayout(alpha,n,frame,settings);assert.ok(layout.missing.length>0);assert.throws(()=>makeClockSTL(alpha,n,settings),/Some hours cannot fit/);
  const backed={...settings,svgBacking:true,svgBackingThickness:1.2,svgBackingMargin:12};assert.equal(fitHourLayout(alpha,n,artworkFrame(alpha,n,100,backed),backed).labels.length,12);
  const buffer=makeClockSTL(alpha,n,backed);closed(faces(buffer));assert.equal(analyzeSTL(buffer).components,1);
});
test('a 55 mm mechanism gets a true 5.5 mm rear cavity with a closed ceiling and an open shaft passage',()=>{
  const n=100,alpha=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(Math.hypot(x+.5-50,y+.5-50)<45)alpha[y*n+x]=255;
  const settings={...defaults,design:'essential',diameter:100,markers:false,mechanismRecess:true,recessWidth:55,recessHeight:55,recessDepth:5.5,recessClearance:.5};
  const normal=analyzeSTL(makeClockSTL(alpha,n,{...settings,mechanismRecess:false})),buffer=makeClockSTL(alpha,n,settings),triangles=faces(buffer),stats=analyzeSTL(buffer);closed(triangles);
  assert.equal(stats.components,1);assert.ok(Math.abs(stats.dimensions[2]-7)<1e-5);assert.deepEqual(surfaces(triangles,0,0),[]);
  assert.ok(surfaces(triangles,15,3).every(z=>Math.abs(z-5.5)<1e-5||Math.abs(z-7)<1e-5),'inside the pocket the rear surface starts at its true depth');
  assert.ok(surfaces(triangles,15,3).some(z=>Math.abs(z-5.5)<1e-5));assert.ok(surfaces(triangles,35,0).some(z=>Math.abs(z)<1e-5),'the surrounding rear wall stays on the original base plane');
  const expected=(56*56-4+Math.PI-Math.PI*4*4)*5.5;assert.ok(Math.abs((normal.volume-stats.volume)-expected)<.3,'removed volume matches the clearance-sized cavity minus the existing shaft hole');
});
test('rear pockets reject thin front walls and missing material instead of cutting through the face',()=>{
  const {n,alpha}=rectangle();
  assert.throws(()=>makeClockSTL(alpha,n,{...defaults,markers:false,thickness:3,mechanismRecess:true}),/leave at least 1.2 mm/);
  assert.throws(()=>makeClockSTL(alpha,n,{...defaults,markers:false,mechanismRecess:true,recessWidth:90,recessHeight:90}),/does not fit inside solid material/);
  const backed={...defaults,markers:false,mechanismRecess:true,svgBacking:true,svgBackingThickness:6.8,svgBackingMargin:3};const buffer=makeClockSTL(alpha,n,backed);closed(faces(buffer));assert.equal(analyzeSTL(buffer).components,1);
});
