import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClockSTL, buildClockLayers } from './mesh.js';

const settings={diameter:100,thickness:3,hole:8,texture:'smooth',markers:true,hourStyle:'arabic',numberSize:100,numberPosition:100};
function alphaMask(n,inside=null){
  const alpha=new Uint8Array(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    if(inside){let count=0;for(const dx of [.25,.75])for(const dy of [.25,.75])count+=inside(x+dx,y+dy,n)?1:0;alpha[y*n+x]=Math.round(count/4*255);}
    else alpha[y*n+x]=Math.max(0,Math.min(255,Math.round((n*.44-Math.hypot(x+.5-n/2,y+.5-n/2)+.5)*255)));
  }
  return alpha;
}
function polygonsArea(polygons){
  let total=0;
  for(const polygon of polygons)for(let i=0;i<polygon.length;i++){
    const ring=polygon[i];let area=0;
    for(let j=0,k=ring.length-1;j<ring.length;k=j++)area+=ring[k][0]*ring[j][1]-ring[j][0]*ring[k][1];
    total+=(i?-1:1)*Math.abs(area/2);
  }
  return total;
}
function expectedVolume(layers){let volume=0,z=0;for(const layer of layers){volume+=polygonsArea(layer.polygons)*(layer.height-z);z=layer.height;}return volume;}
function inspect(buffer){
  const view=new DataView(buffer),count=view.getUint32(80,true),points=new Map(),edges=new Map();
  assert.equal(buffer.byteLength,84+count*50);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let volume=0;
  function vertex(offset){
    const p=[0,1,2].map(i=>view.getFloat32(offset+i*4,true));
    assert.ok(p.every(Number.isFinite));
    for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
    const key=p.join(',');if(!points.has(key))points.set(key,points.size);
    return {p,id:points.get(key)};
  }
  for(let i=0;i<count;i++){
    const offset=84+i*50,normal=[0,1,2].map(k=>view.getFloat32(offset+k*4,true));
    const vertices=[0,1,2].map(j=>vertex(offset+12+j*12)),[a,b,c]=vertices.map(v=>v.p);
    const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    assert.ok(Math.hypot(...cross)>1e-12,'each numeral triangle has nonzero area');
    assert.ok(Math.abs(Math.hypot(...normal)-1)<1e-5,'exported normals are normalized');
    assert.ok(cross.reduce((sum,v,k)=>sum+v*normal[k],0)>0,'outward winding matches normals');
    volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    for(let j=0;j<3;j++){
      const a=vertices[j].id,b=vertices[(j+1)%3].id;assert.notEqual(a,b);
      const key=Math.min(a,b)*2**26+Math.max(a,b),entry=edges.get(key)||{count:0,balance:0};
      entry.count++;entry.balance+=a<b?1:-1;edges.set(key,entry);
    }
  }
  let invalid=0;for(const edge of edges.values())if(edge.count!==2||edge.balance!==0)invalid++;
  assert.equal(invalid,0,'every exact Float32 edge must have two oppositely wound faces');
  assert.ok(volume>0);
  return {count,min,max,volume};
}
function faceBounds(alpha,n,options){
  const view=new DataView(makeClockSTL(alpha,n,{...options,texture:'smooth',markers:false}));
  const min=[Infinity,Infinity],max=[-Infinity,-Infinity];
  for(let i=0;i<view.getUint32(80,true);i++)for(let j=0;j<3;j++)for(let k=0;k<2;k++){
    const value=view.getFloat32(84+i*50+12+j*12+k*4,true);min[k]=Math.min(min[k],value);max[k]=Math.max(max[k],value);
  }
  return {min,max};
}

for(const hourStyle of ['arabic','roman'])for(const texture of ['smooth','ripple','grain']){
  test(`${hourStyle} hour numerals with ${texture} texture produce a closed printable clock`,()=>{
    const alpha=alphaMask(400),options={...settings,hourStyle,texture};
    const layers=buildClockLayers(alpha,400,options),mesh=inspect(makeClockSTL(alpha,400,options));
    assert.ok(Math.abs(mesh.max[2]-3.8)<1e-5,'hour numerals are raised above the face');
    const face=faceBounds(alpha,400,options);
    for(let axis=0;axis<2;axis++)assert.ok(Math.abs(mesh.min[axis]-face.min[axis])<1e-5&&Math.abs(mesh.max[axis]-face.max[axis])<1e-5,'numerals cannot resize the existing face contour');
    const volume=expectedVolume(layers);
    assert.ok(Math.abs(mesh.volume-volume)/volume<2e-5,'mesh volume matches the clipped numeral and texture layers');
  });
}

test('numerals on a maximum-size clock preserve shaft fit and a closed surface',()=>{
  const n=600,alpha=alphaMask(n),options={...settings,diameter:300,hourStyle:'roman',texture:'ripple'};
  const mesh=inspect(makeClockSTL(alpha,n,options));
  const face=faceBounds(alpha,n,options);
  for(let axis=0;axis<2;axis++)assert.ok(Math.abs(mesh.min[axis]-face.min[axis])<1e-5&&Math.abs(mesh.max[axis]-face.max[axis])<1e-5);
  assert.ok(Math.abs(mesh.volume-expectedVolume(buildClockLayers(alpha,n,options)))/mesh.volume<2e-5);
});

test('large outer-position numerals are clipped safely to a narrow imported silhouette',()=>{
  const n=400,alpha=alphaMask(n,(x,y,n)=>Math.abs(x-n/2)<n*.19&&Math.abs(y-n/2)<n*.44);
  const options={...settings,hourStyle:'arabic',numberSize:130,numberPosition:120,texture:'ripple'};
  const layers=buildClockLayers(alpha,n,options),mesh=inspect(makeClockSTL(alpha,n,options));
  assert.ok(mesh.max[0]-mesh.min[0]<45,'no label can extend the chosen SVG outline');
  assert.ok(Math.abs(mesh.max[1]-mesh.min[1]-100)<.002);
  assert.ok(Math.abs(mesh.volume-expectedVolume(layers))/mesh.volume<2e-5);
});

test('turning hour decorations off removes printed numeral relief',()=>{
  const n=400,alpha=alphaMask(n),withLabels=inspect(makeClockSTL(alpha,n,settings));
  const withoutLabels=inspect(makeClockSTL(alpha,n,{...settings,markers:false}));
  assert.ok(withLabels.volume>withoutLabels.volume+1);
  assert.ok(Math.abs(withLabels.max[2]-3.8)<1e-5);
  assert.equal(withoutLabels.max[2],3);
});
