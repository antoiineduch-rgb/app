import { test } from 'node:test';
import assert from 'node:assert/strict';
import polygonClipping from 'polygon-clipping';
import { extrudeLayers } from './mesh-extrusion.js';

const rectangle=(x0,y0,x1,y1)=>[[[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]]];
const circle=(r,n=96)=>Array.from({length:n+1},(_,i)=>[r*Math.cos(i/n*Math.PI*2),r*Math.sin(i/n*Math.PI*2)]);
const area=polygons=>polygons.reduce((total,polygon)=>total+polygon.reduce((sum,ring,i)=>{
  let a=0;for(let j=0;j<ring.length;j++){const p=ring[j],q=ring[(j+1)%ring.length];a+=p[0]*q[1]-q[0]*p[1];}
  return sum+(i?-1:1)*Math.abs(a/2);
},0),0);

function inspect(buffer) {
  const view=new DataView(buffer),count=view.getUint32(80,true),edges=new Map();let volume=0;
  assert.equal(buffer.byteLength,84+count*50);
  for(let i=0;i<count;i++) {
    const offset=84+i*50,normal=[0,1,2].map(k=>view.getFloat32(offset+k*4,true));
    const points=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(offset+12+j*12+k*4,true)));
    assert.ok(points.flat().every(Number.isFinite));
    const [a,b,c]=points,u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.ok(Math.hypot(...cross)>1e-12,'triangles must have nonzero area');
    assert.ok(Math.abs(Math.hypot(...normal)-1)<1e-5,'normals must be unit vectors');
    assert.ok(cross.reduce((sum,value,k)=>sum+value*normal[k],0)>0,'normal must match winding');
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(let j=0;j<3;j++) {
      const from=points[j].join(','),to=points[(j+1)%3].join(','),forward=from<to,key=forward?`${from}|${to}`:`${to}|${from}`;
      const edge=edges.get(key)||{count:0,balance:0};edge.count++;edge.balance+=forward?1:-1;edges.set(key,edge);
    }
  }
  return {count,volume,edges};
}
function assertClosed(result) {
  const invalid=[...result.edges].filter(([,edge])=>edge.count!==2||edge.balance!==0);
  assert.equal(invalid.length,0,`mesh has ${invalid.length} unmatched or incorrectly wound edges: ${JSON.stringify(invalid.slice(0,5))}`);
  assert.ok(result.volume>0);
}

test('a polygon extrusion is closed, outward-wound and has exact volume',()=>{
  const result=inspect(extrudeLayers([{height:3,polygons:rectangle(-10,-5,10,5)}]));
  assertClosed(result);assert.equal(result.volume,600);assert.equal(result.count,12);
});

test('circular shaft and face contours preserve a closed annular solid',()=>{
  const polygons=[[circle(20),circle(4).reverse()]],result=inspect(extrudeLayers([{height:3,polygons}]));
  assertClosed(result);assert.ok(Math.abs(result.volume-area(polygons)*3)<.001);
  assert.ok(result.count<1000,'polygon extrusion should avoid dense flat-face grids');
});

test('partial edge-touching relief splits cap and wall seams consistently',()=>{
  const f0=rectangle(0,0,20,20),f1=rectangle(4,0,16,12),f2=rectangle(8,0,12,8);
  const result=inspect(extrudeLayers([{height:3,polygons:f0},{height:3.4,polygons:f1},{height:3.8,polygons:f2}]));
  assertClosed(result);assert.ok(Math.abs(result.volume-(area(f0)*3+area(f1)*.4+area(f2)*.4))<.001);
});

test('clipped circular texture and overlapping marker relief stay manifold',()=>{
  const f0=[[circle(20),circle(4).reverse()]];
  const ring=[[circle(19),circle(17).reverse()]],marker=polygonClipping.intersection(f0,rectangle(-1.5,-22,1.5,0));
  const f1=polygonClipping.intersection(f0,polygonClipping.union(ring,marker));
  const result=inspect(extrudeLayers([{height:3,polygons:f0},{height:3.4,polygons:f1},{height:3.8,polygons:marker}]));
  assertClosed(result);assert.ok(Math.abs(result.volume-(area(f0)*3+area(f1)*.4+area(marker)*.4))<.01);
});

test('disconnected components and an empty final relief level remain valid',()=>{
  const polygons=polygonClipping.union(rectangle(-10,-2,-2,2),rectangle(2,-2,10,2));
  const result=inspect(extrudeLayers([{height:3,polygons},{height:3.4,polygons:[]}]));
  assertClosed(result);assert.ok(Math.abs(result.volume-area(polygons)*3)<1e-6);
});

test('invalid heights and nonfinite coordinates are rejected',()=>{
  assert.throws(()=>extrudeLayers([]),RangeError);
  assert.throws(()=>extrudeLayers([{height:0,polygons:rectangle(0,0,1,1)}]),RangeError);
  assert.throws(()=>extrudeLayers([{height:3,polygons:rectangle(0,0,1,1)},{height:2,polygons:[]}]),RangeError);
  assert.throws(()=>extrudeLayers([{height:3,polygons:rectangle(0,0,NaN,1)}]),RangeError);
});

test('a relief that extends outside its supporting face cannot export an open solid',()=>{
  assert.throws(()=>extrudeLayers([
    {height:3,polygons:rectangle(-10,-10,10,10)},
    {height:3.4,polygons:rectangle(8,-2,12,2)},
  ]),/unclosed surface/);
});

test('point-touching polygon islands cannot silently create a four-sided mesh edge',()=>{
  const polygons=[...rectangle(-2,-2,0,0),...rectangle(0,0,2,2)];
  assert.throws(()=>extrudeLayers([{height:3,polygons}]),/unclosed surface/);
});
