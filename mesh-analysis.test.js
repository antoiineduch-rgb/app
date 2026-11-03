import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSTL,bedFit} from './mesh-analysis.js';
import {extrudeLayers} from './mesh-extrusion.js';
const rectangle=(x,y,w,h)=>[[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]];
test('mesh analysis measures exported dimensions, solid volume and real components',()=>{
  const mesh=extrudeLayers([{height:3,polygons:[rectangle(-10,-5,20,10),rectangle(20,-5,10,10)]}]);
  const stats=analyzeSTL(mesh);
  assert.deepEqual(stats.dimensions,[40,10,3]);assert.equal(stats.components,2);assert.ok(Math.abs(stats.volume-900)<1e-8);assert.equal(stats.vertices,16);assert.equal(stats.triangles,24);assert.equal(stats.bytes,mesh.byteLength);
});
test('raised details stay one connected part and their full height is measured',()=>{
  const mesh=extrudeLayers([{height:3,polygons:[rectangle(-10,-10,20,20)]},{height:3.8,polygons:[rectangle(-5,-5,10,10)]}]),stats=analyzeSTL(mesh);
  assert.equal(stats.components,1);assert.ok(Math.abs(stats.dimensions[2]-3.8)<1e-6);assert.ok(Math.abs(stats.volume-1280)<.001);assert.ok(stats.surfaceArea>1040);
});
test('build plate fit reports direct fit, quarter turns and oversized models',()=>{
  assert.deepEqual(bedFit([200,180,3],220,220),{fits:true,rotated:false});
  assert.deepEqual(bedFit([200,140,3],150,220),{fits:true,rotated:true});
  assert.deepEqual(bedFit([250,250,3],220,220),{fits:false,rotated:false});
  assert.equal(bedFit([220,220,3],220,220,2).fits,false);assert.throws(()=>bedFit([100,100],0,220),/valid/);
});
test('truncated meshes and nonfinite coordinates cannot yield plausible print statistics',()=>{
  assert.throws(()=>analyzeSTL(new ArrayBuffer(10)),/incomplete/);assert.throws(()=>analyzeSTL(new ArrayBuffer(84)),/triangle count/);
  const mesh=extrudeLayers([{height:3,polygons:[rectangle(-10,-10,20,20)]}]);new DataView(mesh).setFloat32(96,NaN,true);assert.throws(()=>analyzeSTL(mesh),/invalid coordinates/);
});
