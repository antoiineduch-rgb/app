import {test} from 'node:test';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';
import {DEFAULT_SETTINGS} from './project.js';
import {artworkFrame} from './svg-details.js';
import {hourNumeralLabels} from './hour-numerals.js';
import {fitHourLayout,fittedHourPolygons} from './hour-layout.js';
import {makeClockSTL} from './mesh.js';
import {analyzeSTL} from './mesh-analysis.js';

const settings={...DEFAULT_SETTINGS,design:'custom',diameter:200,texture:'smooth',hourStyle:'arabic',numberSize:70,hourFollowPath:true};
const area=polygons=>polygons.reduce((sum,p)=>sum+p.reduce((s,r,i)=>{let a=0;for(let j=0;j<r.length-1;j++)a+=r[j][0]*r[j+1][1]-r[j+1][0]*r[j][1];return s+(i?-1:1)*Math.abs(a/2);},0),0);
function raster(shape){const n=160,alpha=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(shape(x,y))alpha[y*n+x]=255;return {n,alpha};}
const rectangle=()=>raster((x,y)=>x>=10&&x<150&&y>=35&&y<125);
const circle=()=>raster((x,y)=>Math.hypot(x-79.5,y-79.5)<70);
const layout=(raw,s=settings)=>fitHourLayout(raw.alpha,raw.n,artworkFrame(raw.alpha,raw.n,s.diameter,s),s);
function directions(result){for(const label of result.labels){const a=label.hour*Math.PI/6;assert.ok(Math.abs(label.x*Math.cos(a)-label.y*Math.sin(a))<1e-5,'each label stays in its true hour-hand direction');}}
function noCollisions(result){for(let i=0;i<result.labels.length;i++)for(let j=i+1;j<result.labels.length;j++)assert.ok(area(clipping.intersection(result.labels[i].polygons,result.labels[j].polygons))<1e-5);}
function closed(buffer){const v=new DataView(buffer),edges=new Map();for(let i=0;i<v.getUint32(80,true);i++){const p=[0,1,2].map(j=>[0,1,2].map(k=>v.getFloat32(96+i*50+j*12+k*4,true)||0));for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}}for(const [count,winding]of edges.values()){assert.equal(count,2);assert.equal(winding,0);}}

test('following a wide outline moves side hours toward its edge while retaining all correct hand angles',()=>{
  const raw=rectangle(),result=layout(raw),fitted=layout(raw,{...settings,hourFollowPath:false});
  assert.equal(result.labels.length,12);assert.deepEqual(result.missing,[]);directions(result);noCollisions(result);
  assert.ok(result.labels.find(l=>l.hour===3).x>fitted.labels.find(l=>l.hour===3).x+20);
  assert.ok(result.labels.find(l=>l.hour===3).x>result.labels.find(l=>l.hour===12).y+20,'the layout follows the wide shape instead of a circle');
  const outline=[[[[-100,-90/140*100],[100,-90/140*100],[100,90/140*100],[-100,90/140*100],[-100,-90/140*100]]]];
  assert.ok(area(clipping.difference(fittedHourPolygons(settings,result),outline))<1e-5);
  assert.ok(result.labels.every(l=>l.rotation===0),'the default remains upright');
});
test('edge inset moves numbers inward without changing their hour direction or creating collisions',()=>{
  const raw=rectangle(),near=layout(raw,{...settings,hourPathInset:1}),far=layout(raw,{...settings,hourPathInset:8});
  assert.equal(near.labels.length,12);assert.equal(far.labels.length,12);directions(far);noCollisions(far);
  assert.ok(near.labels.find(l=>l.hour===3).x-far.labels.find(l=>l.hour===3).x>5);
  assert.ok(near.labels.find(l=>l.hour===12).y-far.labels.find(l=>l.hour===12).y>5);
  const a=layout(raw,{...settings,diameter:300,hourPathInset:2}),b=layout(raw,{...settings,diameter:300,hourPathInset:2.5});assert.ok(a.labels.find(l=>l.hour===3).x-b.labels.find(l=>l.hour===3).x>=.25,'half-millimeter edge adjustments remain effective at maximum clock size');
});
test('tangent rotation preserves complete Arabic/Roman glyphs, upright reading and padded clearance',()=>{
  const raw=circle();
  for(const hourStyle of ['arabic','roman']){
    const s={...settings,hourStyle,hourPathRotate:true},result=layout(raw,s),originals=hourNumeralLabels(s);
    assert.equal(result.labels.length,12);directions(result);noCollisions(result);
    assert.ok(Math.abs(result.labels.find(l=>l.hour===3).rotation)>1.4,'right-edge lettering follows its vertical tangent');
    assert.ok(Math.abs(result.labels.find(l=>l.hour===12).rotation)<.1);
    assert.ok(Math.abs(result.labels.find(l=>l.hour===6).rotation)<.1,'bottom numbers remain readable');
    for(const label of result.labels){assert.ok(Math.abs(label.rotation)<=Math.PI/2+1e-9);assert.ok(Math.abs(area(label.polygons)-area(originals.find(l=>l.hour===label.hour).polygons)*label.scale**2)<.001);}
    assert.ok(area(clipping.difference(fittedHourPolygons(s,result),fittedHourPolygons(s,result,.5)))<1e-5,'texture clearance follows the same rotation');
    const stl=makeClockSTL(raw.alpha,raw.n,s);closed(stl);assert.equal(analyzeSTL(stl).components,1);
  }
});
test('a round backing supports the SVG path without replacing it with the backing circle',()=>{
  const raw=rectangle(),s={...settings,svgBacking:true},result=layout(raw,s);
  assert.equal(result.labels.length,12);directions(result);noCollisions(result);
  assert.ok(result.labels.find(l=>l.hour===3).x>result.labels.find(l=>l.hour===12).y+15);
});
test('missing SVG support is reported; a backing safely carries the remaining hours as one solid',()=>{
  const raw=raster((x,y)=>y>=20&&y<140&&(x>=15&&x<35||x>=125&&x<145)),missing=layout(raw);
  assert.ok(missing.missing.includes(12));assert.ok(missing.missing.includes(6));
  assert.throws(()=>makeClockSTL(raw.alpha,raw.n,settings),/Some hours cannot fit/);
  const s={...settings,svgBacking:true},supported=layout(raw,s);assert.equal(supported.labels.length,12);assert.ok(supported.labels.some(l=>l.onBacking));directions(supported);noCollisions(supported);
  const stl=makeClockSTL(raw.alpha,raw.n,s);closed(stl);assert.equal(analyzeSTL(stl).components,1);
});
test('ticks follow the outline while retaining their radial direction',()=>{
  const raw=rectangle(),s={...settings,hourStyle:'ticks',hourPathRotate:true},result=layout(raw,s);
  assert.equal(result.labels.length,12);directions(result);noCollisions(result);assert.ok(result.labels.every(l=>l.rotation===0));
  const stl=makeClockSTL(raw.alpha,raw.n,s);closed(stl);
});
