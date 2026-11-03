import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strFromU8, unzipSync } from 'fflate';
import { extrudeLayers } from './mesh-extrusion.js';
import { stlTo3MF } from './export-3mf.js';

const fixture = () => extrudeLayers([{height:3,polygons:[[[[-10,-5],[10,-5],[10,5],[-10,5],[-10,-5]]]]}]);
function unpack(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  return Object.fromEntries(Object.entries(files).map(([name,value]) => [name,strFromU8(value)]));
}
function modelGeometry(model) {
  const vertices = [...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(match => match.slice(1).map(Number));
  const triangles = [...model.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"[^>]*\/>/g)].map(match => match.slice(1).map(Number));
  return {vertices,triangles};
}
function signedVolume(triangles) {
  let result=0;
  for(const [a,b,c] of triangles) result+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  return result;
}

test('3MF is an OPC ZIP with a resolvable model, millimeter units and color material', () => {
  const output=stlTo3MF(fixture(),{name:'My clock',color:'#94a18a'});
  assert.ok(output instanceof ArrayBuffer);
  assert.deepEqual([...new Uint8Array(output,0,4)],[0x50,0x4b,0x03,0x04]);
  const files=unpack(output);
  assert.deepEqual(Object.keys(files).sort(),['3D/3dmodel.model','[Content_Types].xml','_rels/.rels'].sort());
  assert.match(files['[Content_Types].xml'],/xmlns="http:\/\/schemas\.openxmlformats\.org\/package\/2006\/content-types"/);
  assert.match(files['[Content_Types].xml'],/PartName="\/3D\/3dmodel.model" ContentType="application\/vnd.ms-package.3dmanufacturing-3dmodel\+xml"/);
  assert.match(files['_rels/.rels'],/Type="http:\/\/schemas.microsoft.com\/3dmanufacturing\/2013\/01\/3dmodel" Target="\/3D\/3dmodel.model"/);
  const model=files['3D/3dmodel.model'];
  assert.match(model,/<model unit="millimeter" xml:lang="en-US" xmlns="http:\/\/schemas.microsoft.com\/3dmanufacturing\/core\/2015\/02">/);
  assert.match(model,/<basematerials id="1"><base name="Clock face" displaycolor="#94A18AFF"\/><\/basematerials>/);
  assert.match(model,/<object id="2" type="model" name="My clock" pid="1" pindex="0">/);
  assert.match(model,/<build><item objectid="2"\/><\/build>/);
});

test('indexed 3MF vertices preserve every STL triangle, winding, dimensions and solid volume', () => {
  const stl=fixture(),view=new DataView(stl),count=view.getUint32(80,true);
  const {vertices,triangles}=modelGeometry(unpack(stlTo3MF(stl))['3D/3dmodel.model']);
  assert.equal(vertices.length,8,'shared cube corners are deduplicated');
  assert.equal(triangles.length,count);
  const stlTriangles=[];
  for(let i=0;i<count;i++){
    const original=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(84+i*50+12+j*12+k*4,true)));
    assert.ok(triangles[i].every(index=>Number.isInteger(index)&&index>=0&&index<vertices.length));
    assert.deepEqual(triangles[i].map(index=>vertices[index]),original);
    stlTriangles.push(original);
  }
  const meshTriangles=triangles.map(indices=>indices.map(index=>vertices[index]));
  assert.equal(signedVolume(meshTriangles),signedVolume(stlTriangles));
  assert.equal(signedVolume(meshTriangles),600);
  for(const [axis,extent]of[[0,20],[1,10],[2,3]])assert.equal(Math.max(...vertices.map(p=>p[axis]))-Math.min(...vertices.map(p=>p[axis])),extent);
});

test('names are XML-escaped, invalid XML characters removed, and alpha colors are retained', () => {
  const model=unpack(stlTo3MF(fixture(),{name:'Clock <A&B> "face" \'test\'\u0001\ud800',color:'#AABBCC80'}))['3D/3dmodel.model'];
  assert.match(model,/Clock &lt;A&amp;B&gt; &quot;face&quot; &apos;test&apos;/);
  assert.doesNotMatch(model,/\u0001|\ud800|<A&B>/);
  assert.match(model,/displaycolor="#AABBCC80"/);
  assert.equal((model.match(/<object /g)||[]).length,1);
});

test('typed-array slices use their exact byte range and repeated exports are deterministic', () => {
  const stl=new Uint8Array(fixture()),storage=new Uint8Array(stl.length+16);storage.set(stl,7);
  const view=storage.subarray(7,7+stl.length);
  assert.deepEqual(new Uint8Array(stlTo3MF(view)),new Uint8Array(stlTo3MF(stl)));
});

test('invalid binary STL and nonprintable coordinates are rejected', () => {
  assert.throws(()=>stlTo3MF('solid clock'),TypeError);
  assert.throws(()=>stlTo3MF(new ArrayBuffer(83)),RangeError);
  assert.throws(()=>stlTo3MF(new ArrayBuffer(84)),RangeError);
  const stl=fixture();
  assert.throws(()=>stlTo3MF(stl.slice(0,-1)),RangeError);
  const invalid=stl.slice(0);new DataView(invalid).setFloat32(96,NaN,true);
  assert.throws(()=>stlTo3MF(invalid),/invalid coordinates/);
  const degenerate=stl.slice(0),d=new DataView(degenerate);
  for(let k=0;k<3;k++)d.setFloat32(84+24+k*4,d.getFloat32(84+12+k*4,true),true);
  assert.throws(()=>stlTo3MF(degenerate),/empty triangle/);
  assert.throws(()=>stlTo3MF(stl,{color:'red'}),TypeError);
  assert.throws(()=>stlTo3MF(stl,{name:null}),TypeError);
});

test('SVG color textures are embedded, related, and mapped to the existing top surface',()=>{
  const png=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'));
  const stl=fixture(),artwork={png,frame:{scale:.2,cx:50,cy:50,n:100},thickness:3};
  const zip=unzipSync(new Uint8Array(stlTo3MF(stl,{artwork}))),model=strFromU8(zip['3D/3dmodel.model']);
  assert.deepEqual(zip['3D/Textures/artwork.png'],png,'the original painted pixels are preserved');
  assert.match(strFromU8(zip['3D/_rels/3dmodel.model.rels']),/3dtexture" Target="\/3D\/Textures\/artwork.png"/);
  assert.match(strFromU8(zip['[Content_Types].xml']),/Extension="png" ContentType="image\/png"/);
  assert.match(model,/xmlns:m="http:\/\/schemas.microsoft.com\/3dmanufacturing\/material\/2015\/02"/);
  assert.match(model,/<m:texture2d id="3" path="\/3D\/Textures\/artwork.png"/);
  assert.match(model,/<m:texture2dgroup id="4" texid="3">/);
  const {vertices,triangles}=modelGeometry(model),coordinates=[...model.matchAll(/<m:tex2coord u="([^"]+)" v="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));
  assert.deepEqual({vertices,triangles},modelGeometry(unpack(stlTo3MF(stl))['3D/3dmodel.model']),'adding color cannot change the printable mesh');
  vertices.forEach((point,i)=>assert.deepEqual(coordinates[i],[(point[0]+10)/20,(point[1]+10)/20]));
  const tags=[...model.matchAll(/<triangle\b[^>]*>/g)].map(m=>m[0]);
  triangles.forEach((triangle,i)=>assert.equal(tags[i].includes('pid="4"'),triangle.every(v=>vertices[v][2]===3),'only the painted top uses the SVG texture'));
  assert.throws(()=>stlTo3MF(stl,{artwork:{...artwork,png:new Uint8Array(30)}}),/PNG/);
  assert.throws(()=>stlTo3MF(stl,{artwork:{...artwork,frame:{...artwork.frame,scale:0}}}),/placement/);
});
