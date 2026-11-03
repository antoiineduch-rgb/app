import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artworkFrame, artworkRelief } from './svg-details.js';
import { makeClockSTL } from './mesh.js';

const options={design:'custom',diameter:100,thickness:3,hole:8,texture:'ripple',markers:false,svgDetail:'artwork',svgRelief:.8,svgTone:'contrast',hourStyle:'arabic',numberSize:100,numberPosition:100};
function drawing(background=[255,255,255],detail=[0,0,0]){
  const n=120,alpha=new Uint8Array(n*n),rgba=new Uint8ClampedArray(n*n*4);
  for(let y=6;y<114;y++)for(let x=6;x<114;x++){
    const i=y*n+x,paint=x>=23&&x<47&&y>=23&&y<47?detail:background;
    alpha[i]=255;rgba.set([...paint,255],i*4);
  }
  return {n,alpha,rgba};
}
function mesh(fixture,settings={}){return makeClockSTL(fixture.alpha,fixture.n,{...options,...settings},undefined,{rgba:fixture.rgba});}
function inspect(buffer){
  const view=new DataView(buffer),edges=new Map(),triangles=[];let maxZ=0;
  for(let i=0;i<view.getUint32(80,true);i++){
    const triangle=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)));
    triangles.push(triangle);
    for(let j=0;j<3;j++){
      const a=triangle[j],b=triangle[(j+1)%3];maxZ=Math.max(maxZ,a[2]);
      const ka=a.join(','),kb=b.join(','),key=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`;
      const entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=ka<kb?1:-1;edges.set(key,entry);
    }
  }
  for(const [count,winding]of edges.values()){assert.equal(count,2,'the detailed clock is watertight');assert.equal(winding,0,'all shared edges have opposite winding');}
  return {triangles,maxZ};
}
function topAt(triangles,x,y){
  let top=-Infinity;
  for(const [a,b,c]of triangles){
    const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(denominator)<1e-9)continue;
    const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denominator;
    const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/denominator,w=1-u-v;
    if(Math.min(u,v,w)>-1e-7)top=Math.max(top,u*a[2]+v*b[2]+w*c[2]);
  }
  return top;
}

test('internal ink becomes printable relief without changing the footprint or center hole',()=>{
  const f=drawing(),result=inspect(mesh(f)),frame=artworkFrame(f.alpha,f.n,100);
  const point=(x,y)=>[(x-frame.cx)*frame.scale,(frame.cy-y)*frame.scale];
  assert.ok(Math.abs(topAt(result.triangles,...point(35,35))-3.8)<1e-5,'ink has full detail relief');
  assert.ok(Math.abs(topAt(result.triangles,...point(85,85))-3)<1e-8,'background stays at the selected base thickness');
  assert.equal(topAt(result.triangles,0,0),-Infinity,'the mechanism opening remains open');
  const xs=result.triangles.flat().map(p=>p[0]);
  assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-100)<1e-5);
});

test('white lettering and equal-brightness colors remain details in contrast mode',()=>{
  for(const f of [drawing([0,0,0],[255,255,255]),drawing([255,0,0],[0,76,0])]){
    const result=inspect(mesh(f));assert.ok(Math.abs(result.maxZ-3.8)<1e-5);
  }
});

test('solid colors and transparent pixels never invent interior relief',()=>{
  const f=drawing([20,90,130],[20,90,130]);
  assert.equal(artworkRelief(f.rgba,f.alpha,f.n),null);
  assert.equal(inspect(mesh(f)).maxZ,3);
});

test('zero relief and silhouette mode remove imported detail geometry',()=>{
  const f=drawing();
  assert.equal(inspect(mesh(f,{svgRelief:0})).maxZ,3);
  assert.equal(inspect(mesh(f,{svgDetail:'silhouette',texture:'smooth'})).maxZ,3);
});

test('dark and light modes reverse which painted region is raised',()=>{
  const f=drawing(),frame=artworkFrame(f.alpha,f.n,100),p=[(35-frame.cx)*frame.scale,(frame.cy-35)*frame.scale];
  assert.ok(Math.abs(topAt(inspect(mesh(f,{svgTone:'dark'})).triangles,...p)-3.8)<1e-5);
  assert.equal(topAt(inspect(mesh(f,{svgTone:'light'})).triangles,...p),3);
});

test('hour numerals remain connected above adjustable SVG relief',()=>{
  const f=drawing();
  for(const svgRelief of [.2,.8,2]){
    const result=inspect(mesh(f,{markers:true,svgRelief}));
    assert.ok(Math.abs(result.maxZ-(3+svgRelief+.8))<1e-5);
  }
});

test('incomplete detail rasters and invalid relief settings are rejected',()=>{
  const f=drawing();
  assert.throws(()=>artworkRelief(new Uint8Array(3),f.alpha,f.n),/incomplete/);
  assert.throws(()=>mesh(f,{svgRelief:-1}),/between 0 and 2/);
  assert.throws(()=>mesh(f,{svgTone:'other'}),/relief style/);
});
