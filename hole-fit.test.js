import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitTestPlan,makeFitTestSTL} from './hole-fit.js';
import {makeClockSTL} from './mesh.js';
import {analyzeSTL} from './mesh-analysis.js';

function triangles(buffer){const v=new DataView(buffer);return Array.from({length:v.getUint32(80,true)},(_,i)=>[0,1,2].map(j=>[0,1,2].map(k=>v.getFloat32(96+i*50+j*12+k*4,true)||0)));}
function assertClosed(faces){
  const edges=new Map();
  for(const points of faces)for(let i=0;i<3;i++){
    const a=points[i].join(','),b=points[(i+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,edge=edges.get(key)||[0,0];edge[0]++;edge[1]+=a<b?1:-1;edges.set(key,edge);
  }
  for(const [count,balance]of edges.values()){assert.equal(count,2,'all serialized seams have two faces');assert.equal(balance,0,'the faces are consistently wound');}
}
test('all 101 supported hole sizes produce a connected, closed strip with five usable choices including the current size',()=>{
  for(let tenth=50;tenth<=150;tenth++){
    const center=tenth/10,plan=fitTestPlan(center),buffer=makeFitTestSTL(center),stats=analyzeSTL(buffer);
    assert.equal(plan.sizes.length,5);assert.ok(plan.sizes.includes(center));assert.ok(plan.sizes.every(size=>size>=5&&size<=15));
    for(let i=1;i<5;i++)assert.ok(Math.abs(plan.sizes[i]-plan.sizes[i-1]-.2)<1e-8);
    assert.equal(stats.components,1);assert.ok(stats.volume>0);assert.ok(Math.abs(stats.dimensions[0]-plan.width)<.001);assert.ok(Math.abs(stats.dimensions[1]-plan.depth)<.001);assert.ok(Math.abs(stats.dimensions[2]-2.6)<.001);
    assertClosed(triangles(buffer));
  }
});
test('each labeled opening is clear through the strip and has its actual nominal diameter',()=>{
  const plan=fitTestPlan(8),faces=triangles(makeFitTestSTL(8));
  for(const {diameter,x,y}of plan.holes){
    let nearest=Infinity;
    for(const face of faces){
      for(const [px,py]of face)nearest=Math.min(nearest,Math.hypot(px-x,py-y));
      const [a,b,c]=face,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;
      const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;
      assert.ok(Math.min(u,v,1-u-v)<-1e-7,'no cap or label covers a hole center');
    }
    assert.ok(Math.abs(nearest*2-diameter)<.003,`${diameter} mm label matches its opening`);
  }
  assert.deepEqual(plan.labels.map(label=>label.text),['7.6','7.8','8.0','8.2','8.4']);
});
test('a calibrated 7.8 mm clock opening matches the fit-strip contour and remains watertight',()=>{
  const n=80,alpha=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(Math.hypot(x+.5-40,y+.5-40)<35)alpha[y*n+x]=255;
  const buffer=makeClockSTL(alpha,n,{diameter:100,thickness:3,hole:7.8,texture:'smooth',markers:false}),faces=triangles(buffer);
  assertClosed(faces);const nearest=Math.min(...faces.flat().map(([x,y])=>Math.hypot(x,y)));assert.ok(Math.abs(nearest*2-7.8)<.003);
});
test('unsupported or imprecise gauge sizes fail before generating a file',()=>{
  for(const size of [NaN,Infinity,4.9,15.1,8.25,'8'])assert.throws(()=>fitTestPlan(size),/center hole/);
});
