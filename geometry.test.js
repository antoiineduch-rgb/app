import { test } from 'node:test';
import assert from 'node:assert/strict';
import {makeSTL,shapePath,designs} from './geometry.js';
function inspect(buffer){const v=new DataView(buffer),count=v.getUint32(80,true),edges=new Map();let volume=0;for(let i=0;i<count;i++){const p=Array.from({length:3},(_,j)=>Array.from({length:3},(_,k)=>v.getFloat32(84+i*50+12+j*12+k*4,true)));for(let j=0;j<3;j++){const a=p[j].join(','),b=p[(j+1)%3].join(','),key=[a,b].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}const [a,b,c]=p;volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}return {count,edges,volume};}
test('a single column is closed and has correct volume and binary size',()=>{const b=makeSTL(new Float32Array([3]),1,1),r=inspect(b);assert.equal(r.count,12);assert.equal(b.byteLength,84+12*50);assert.ok([...r.edges.values()].every(n=>n===2));assert.equal(r.volume,3);});
test('shaft opening stays empty and relief produces outward solid volume',()=>{const h=new Float32Array([3,3,3,3,0,3,3,3,3]);const r=inspect(makeSTL(h,3,1));assert.ok([...r.edges.values()].every(n=>n===2));assert.ok(Math.abs(r.volume-24)<1e-6);const relief=inspect(makeSTL(new Float32Array([3,3.4,3,3]),2,1));assert.ok(Math.abs(relief.volume-12.4)<1e-5);});
test('all preset outlines are closed SVG paths',()=>{for(const d of designs){const p=shapePath(d.id);assert.ok(p.startsWith('M'));assert.ok(p.endsWith('Z'));assert.ok(!p.includes('NaN'));}});

test('relief walls keep outward normals, nondegenerate triangles and exact volume',()=>{
  const heights=new Float32Array([3,3.4,3.8,0,3,3.4,3.8,3,3]);
  const buffer=makeSTL(heights,3,.5),view=new DataView(buffer),count=view.getUint32(80,true);
  assert.ok(Math.abs(inspect(buffer).volume-heights.reduce((sum,h)=>sum+h*.25,0))<1e-5);
  for(let i=0;i<count;i++){
    const offset=84+i*50;
    const normal=[0,1,2].map(k=>view.getFloat32(offset+k*4,true));
    const p=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(offset+12+j*12+k*4,true)));
    const u=p[1].map((v,k)=>v-p[0][k]),v=p[2].map((v,k)=>v-p[0][k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.ok(Math.hypot(...cross)>0);
    assert.equal(Math.hypot(...normal),1);
    assert.ok(cross.reduce((sum,v,k)=>sum+v*normal[k],0)>0,'normal must match triangle winding');
  }
});

test('empty grids produce a valid empty STL and invalid grids are rejected',()=>{
  const empty=makeSTL(new Float32Array(4),2,1);
  assert.equal(empty.byteLength,84);
  assert.equal(new DataView(empty).getUint32(80,true),0);
  assert.throws(()=>makeSTL(new Float32Array(3),2,1),RangeError);
  assert.throws(()=>makeSTL(new Float32Array(4),2,0),RangeError);
  assert.throws(()=>makeSTL(new Float32Array([3,NaN,3,3]),2,1),RangeError);
  assert.throws(()=>makeSTL(new Float32Array([3,-1,3,3]),2,1),RangeError);
});
