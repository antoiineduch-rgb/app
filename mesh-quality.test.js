import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClockSTL, buildClockLayers } from './mesh.js';

const baseSettings = { diameter: 100, thickness: 3, hole: 8, texture: 'smooth', markers: false };

function circleMask(n) {
  const alpha = new Uint8Array(n*n), radius = n*.44;
  for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
    const distance = Math.hypot(x+.5-n/2,y+.5-n/2);
    alpha[y*n+x] = Math.max(0,Math.min(255,Math.round((radius-distance+.5)*255)));
  }
  return alpha;
}

function shapeMask(n, inside) {
  const alpha = new Uint8Array(n*n);
  for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
    let coverage=0;
    for (const ox of [.25,.75]) for (const oy of [.25,.75]) coverage += inside(x+ox,y+oy,n) ? 1 : 0;
    alpha[y*n+x] = Math.round(coverage/4*255);
  }
  return alpha;
}

function petalMask(n) {
  const alpha=new Uint8Array(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const dx=x+.5-n/2,dy=y+.5-n/2,angle=Math.atan2(dy,dx);
    const radius=n*(.39+.05*Math.cos(12*angle));
    alpha[y*n+x]=Math.max(0,Math.min(255,Math.round((radius-Math.hypot(dx,dy)+.5)*255)));
  }
  return alpha;
}

// Verify serialized Float32 geometry, not the intermediate polygon model.
function inspectSTL(buffer, inspectVertex) {
  const view = new DataView(buffer), triangles = view.getUint32(80,true);
  assert.equal(buffer.byteLength,84+triangles*50,'binary STL length matches triangle count');
  const vertices = new Map(), vertexKeys = [], edges = new Map();
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  let volume=0;
  function vertex(offset) {
    const x=view.getFloat32(offset,true),y=view.getFloat32(offset+4,true),z=view.getFloat32(offset+8,true);
    assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'finite STL coordinates');
    min[0]=Math.min(min[0],x);min[1]=Math.min(min[1],y);min[2]=Math.min(min[2],z);
    max[0]=Math.max(max[0],x);max[1]=Math.max(max[1],y);max[2]=Math.max(max[2],z);
    const key=`${x},${y},${z}`;
    let id=vertices.get(key);
    if(id===undefined){id=vertices.size;vertices.set(key,id);vertexKeys.push(key);inspectVertex?.(x,y,z);}
    return {x,y,z,id};
  }
  function edge(a,b) {
    assert.notEqual(a,b,'triangle has distinct vertices');
    const low=Math.min(a,b),high=Math.max(a,b);
    assert.ok(high<2**26,'vertex IDs fit the exact edge key');
    const key=low*2**26+high;
    // One forward and one reverse edge encode as 1 + 16 = 17.
    edges.set(key,(edges.get(key)||0)+(a<b?1:16));
  }
  for(let i=0;i<triangles;i++){
    const offset=84+i*50;
    const nx=view.getFloat32(offset,true),ny=view.getFloat32(offset+4,true),nz=view.getFloat32(offset+8,true);
    assert.ok(Number.isFinite(nx)&&Number.isFinite(ny)&&Number.isFinite(nz),'finite triangle normal');
    assert.ok(Math.abs(Math.hypot(nx,ny,nz)-1)<1e-5,'normal is a unit vector');
    const a=vertex(offset+12),b=vertex(offset+24),c=vertex(offset+36);
    const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
    const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
    assert.ok(Math.hypot(cx,cy,cz)>1e-12,'triangle has nonzero area');
    assert.ok(cx*nx+cy*ny+cz*nz>0,'normal agrees with triangle winding');
    volume+=(a.x*(b.y*c.z-b.z*c.y)+a.y*(b.z*c.x-b.x*c.z)+a.z*(b.x*c.y-b.y*c.x))/6;
    edge(a.id,b.id);edge(b.id,c.id);edge(c.id,a.id);
  }
  let badEdges=0;
  const badSamples=[];
  for(const [key,incidence] of edges)if(incidence!==17){
    badEdges++;
    if(badSamples.length<6)badSamples.push({a:vertexKeys[Math.floor(key/2**26)],b:vertexKeys[key%2**26],forward:incidence%16,reverse:Math.floor(incidence/16)});
  }
  assert.equal(badEdges,0,`every exact Float32 edge belongs to two oppositely wound triangles; examples: ${JSON.stringify(badSamples)}`);
  assert.ok(volume>0,'closed solid has positive outward volume');
  return {triangles,vertices:vertices.size,min,max,volume};
}

function ringArea(ring) {
  let area=0;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++)area+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];
  return Math.abs(area/2);
}
function polygonArea(polygons) {
  let area=0;
  for(const polygon of polygons)area+=ringArea(polygon[0])-polygon.slice(1).reduce((sum,hole)=>sum+ringArea(hole),0);
  return area;
}
function layeredVolume(layers) {
  let volume=0,previous=0;
  for(const layer of layers){volume+=polygonArea(layer.polygons)*(layer.height-previous);previous=layer.height;}
  return volume;
}

test('smooth circular face has fine contours, exact diameter and a truly circular shaft opening',()=>{
  const settings={...baseSettings,diameter:200},n=512;
  let outerError=0,holeError=0;
  const holePoints=new Set();
  const mesh=inspectSTL(makeClockSTL(circleMask(n),n,settings),(x,y)=>{
    const radius=Math.hypot(x,y);
    if(radius>50)outerError=Math.max(outerError,Math.abs(radius-100));
    if(radius<5){holeError=Math.max(holeError,Math.abs(radius-4));holePoints.add(`${x},${y}`);}
  });
  assert.ok(outerError<=.15,`outside radial error ${outerError} mm must stay below 0.15 mm`);
  assert.ok(holeError<=.005,`shaft radial error ${holeError} mm must stay below 0.005 mm`);
  assert.ok(holePoints.size>=64,'shaft wall has enough segments to avoid square-grid steps');
  assert.ok(Math.abs(mesh.max[0]-mesh.min[0]-200)<.002);
  assert.ok(Math.abs(mesh.max[1]-mesh.min[1]-200)<.002);
  assert.equal(mesh.min[2],0);assert.equal(mesh.max[2],3);
  const expected=Math.PI*(100**2-4**2)*3;
  assert.ok(Math.abs(mesh.volume-expected)/expected<.003,'circle and shaft retain expected physical volume');
  assert.ok(mesh.triangles<20000,'flat caps do not contain a dense grid of redundant triangles');
});

for(const fixture of [
  {name:'ripple relief clipped against a curved perimeter',texture:'ripple',markers:false},
  {name:'hour markers overlapping ripple bands',texture:'ripple',markers:true},
  {name:'crosshatch relief crossing the shaft opening',texture:'grain',markers:true},
]){
  test(`${fixture.name} remains a closed, consistently wound solid`,()=>{
    const n=400,alpha=circleMask(n),settings={...baseSettings,texture:fixture.texture,markers:fixture.markers};
    const layers=buildClockLayers(alpha,n,settings),mesh=inspectSTL(makeClockSTL(alpha,n,settings));
    const expected=layeredVolume(layers);
    assert.ok(Math.abs(mesh.volume-expected)/expected<2e-5,'mesh volume matches the intended nonoverlapping relief layers');
    assert.ok(Math.abs(mesh.max[2]-(fixture.markers?3.8:3.4))<1e-5);
  });
}

test('a sharp notch and SVG cutout keep closed contour walls',()=>{
  const n=400;
  const alpha=shapeMask(n,(x,y,n)=>Math.hypot(x-n/2,y-n/2)<n*.44&&!(x>n*.5&&y<n*.45)&&Math.hypot(x-n*.33,y-n*.56)>n*.04);
  const settings={...baseSettings,texture:'ripple',markers:true};
  const layers=buildClockLayers(alpha,n,settings),mesh=inspectSTL(makeClockSTL(alpha,n,settings));
  const expected=layeredVolume(layers);
  assert.ok(Math.abs(mesh.volume-expected)/expected<2e-5);
});

test('disconnected SVG islands remain separate closed solids without spurious connecting triangles',()=>{
  const n=320;
  const alpha=shapeMask(n,(x,y,n)=>Math.hypot(x-n*.25,y-n*.5)<n*.17||Math.hypot(x-n*.75,y-n*.5)<n*.17);
  const settings={...baseSettings};
  const layers=buildClockLayers(alpha,n,settings),mesh=inspectSTL(makeClockSTL(alpha,n,settings));
  assert.equal(layers[0].polygons.length,2,'two islands remain independent');
  assert.ok(Math.abs(mesh.volume-layeredVolume(layers))/mesh.volume<2e-5);
  const view=new DataView(makeClockSTL(alpha,n,settings));
  for(let i=0;i<view.getUint32(80,true);i++){
    const x0=view.getFloat32(84+i*50+12,true),x1=view.getFloat32(84+i*50+24,true),x2=view.getFloat32(84+i*50+36,true);
    assert.ok(Math.max(x0,x1,x2)<=0||Math.min(x0,x1,x2)>=0,'no triangle spans the empty gap');
  }
});

test('maximum-size petal face with ripple and hour markers stays watertight',t=>{
  const n=800,alpha=petalMask(n),settings={...baseSettings,diameter:300,texture:'ripple',markers:true};
  const layers=buildClockLayers(alpha,n,settings),mesh=inspectSTL(makeClockSTL(alpha,n,settings));
  const expected=layeredVolume(layers);
  assert.ok(Math.abs(mesh.volume-expected)/expected<2e-5);
  assert.ok(Math.abs(Math.max(mesh.max[0]-mesh.min[0],mesh.max[1]-mesh.min[1])-300)<.002,'largest face extent remains 300 mm');
  assert.ok(Math.abs(mesh.max[2]-3.8)<1e-5);
  t.diagnostic(`300 mm petal: ${mesh.triangles} triangles, ${mesh.vertices} shared vertices`);
});
