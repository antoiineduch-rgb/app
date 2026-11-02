import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceContours, simplifyRing } from './contours.js';

function area(ring) { return ring.reduce((sum,point,i)=>{const next=ring[(i+1)%ring.length];return sum+point[0]*next[1]-next[0]*point[1];},0)/2; }
function mask(n, distance) {
  const alpha=new Uint8Array(n*n);
  for (let y=0;y<n;y++) for (let x=0;x<n;x++) alpha[y*n+x]=Math.round(255*Math.max(0,Math.min(1,.5+distance(x+.5,y+.5))));
  return alpha;
}
function assertRing(ring) {
  assert.ok(ring.length>=3);
  assert.notDeepEqual(ring[0],ring.at(-1),'ring closure must be implicit');
  for (let i=0;i<ring.length;i++) {
    assert.ok(ring[i].every(Number.isFinite));
    assert.notDeepEqual(ring[i],ring[(i+1)%ring.length],'zero-length contour edge');
  }
}

test('marching squares interpolates a smooth fractional circle boundary',()=>{
  const n=100,radius=31;
  const [ring]=traceContours(mask(n,(x,y)=>radius-Math.hypot(x-n/2,y-n/2)),n);
  assertRing(ring);
  assert.ok(area(ring)>0,'outside ring is clockwise in image coordinates');
  assert.ok(ring.some(([x,y])=>Math.abs(x*2-Math.round(x*2))>1e-3 || Math.abs(y*2-Math.round(y*2))>1e-3));
  const radialError=Math.max(...ring.map(([x,y])=>Math.abs(Math.hypot(x-n/2,y-n/2)-radius)));
  assert.ok(radialError<.15,`circle boundary error was ${radialError} pixels`);
  const simplified=simplifyRing(ring,.2);
  assertRing(simplified);
  assert.ok(simplified.length<ring.length/2);
  assert.ok(simplified.length>=24);
  assert.ok(Math.abs(area(simplified)/area(ring)-1)<.02);
});

test('padded borders close silhouettes that reach every image edge',()=>{
  const rings=traceContours(new Uint8Array(16).fill(255),4);
  assert.equal(rings.length,1);assertRing(rings[0]);
  const xs=rings[0].map(p=>p[0]),ys=rings[0].map(p=>p[1]);
  assert.equal(Math.min(...xs),0);assert.equal(Math.max(...xs),4);
  assert.equal(Math.min(...ys),0);assert.equal(Math.max(...ys),4);
  assert.equal(area(rings[0]),15.5);
});

test('a donut retains its hole with opposite winding',()=>{
  const n=64;
  const rings=traceContours(mask(n,(x,y)=>{const r=Math.hypot(x-32,y-32);return Math.min(25-r,r-10);}),n);
  assert.equal(rings.length,2);rings.forEach(assertRing);
  const signed=rings.map(area).sort((a,b)=>a-b);
  assert.ok(signed[0]<0);assert.ok(signed[1]>0);
  assert.ok(Math.abs(signed[0]+Math.PI*100)<4);
  assert.ok(Math.abs(signed[1]-Math.PI*625)<5);
});

test('ambiguous diagonal cells remain separate four-connected islands',()=>{
  for (const input of [[255,0,0,255],[0,255,255,0]]) {
    const rings=traceContours(new Uint8Array(input),2);
    assert.equal(rings.length,2);rings.forEach(assertRing);
    assert.ok(rings.every(ring=>area(ring)>0));
    const points=new Set(rings[0].map(point=>point.join(',')));
    assert.ok(rings[1].every(point=>!points.has(point.join(','))),'islands must not share a vertex');
  }
});

test('closed simplification preserves corners, bounds and error tolerance',()=>{
  const ring=[[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1]];
  const simplified=simplifyRing(ring,.05);
  assert.equal(simplified.length,4);assert.equal(area(simplified),9);assertRing(simplified);
  assert.equal(simplifyRing(ring,100).length,ring.length,'do not collapse a polygon to a line');
});

test('empty alpha and invalid input are handled explicitly',()=>{
  assert.deepEqual(traceContours(new Uint8Array(9),3),[]);
  assert.throws(()=>traceContours(new Uint8Array(3),2),RangeError);
  assert.throws(()=>traceContours(new Uint8Array(4),2,0),RangeError);
  assert.throws(()=>simplifyRing([[0,0],[1,0],[1,NaN]],.2),RangeError);
  assert.throws(()=>simplifyRing([[0,0],[1,0],[1,1]],-.2),RangeError);
});
