import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {extrudeLayers} from './mesh-extrusion.js';
import {stlToBambu3MF} from './export-bambu.js';
import {filamentPaint,filamentCode,paintFacet,recolorFilamentPaint} from './bambu-paint.js';
const mesh=()=>extrudeLayers([{height:3,polygons:[[[[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10]]]]}]);
function image(n=80){
  const rgba=new Uint8ClampedArray(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)rgba.set([...(x<n/2?[255,0,0]:[0,0,255]),255],(y*n+x)*4);
  return {rgba,width:n,height:n,frame:{n,scale:20/n,cx:n/2,cy:n/2},thickness:3};
}
const unpack=buffer=>Object.fromEntries(Object.entries(unzipSync(new Uint8Array(buffer))).map(([key,value])=>[key,strFromU8(value)]));
const vertices=model=>[...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number));
const triangles=model=>[...model.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)" paint_color="([0-9A-F]+)"\/>/g)].map(m=>({indices:m.slice(1,4).map(Number),paint:m[4]}));
// Independent reader for the documented Bambu leaf/split codes. Read nibbles
// from right to left, then children in reverse order, just as Bambu does.
function decodePaint(code,points){
  let at=code.length-1;const leaves=[];
  function read(vertices){
    const value=parseInt(code[at--],16),split=value&3,state=value>>2;
    if(!split){const index=state===3?parseInt(code[at--],16)+2:state-1;leaves.push({points:vertices,index});return;}
    assert.equal(split,1);
    const [a,b,c]=[0,1,2].map(i=>vertices[(state+i)%3]),mid=a.map((_v,k)=>(b[k]+c[k])/2);
    read([mid,c,a]);read([a,b,mid]);
  }
  read(points);assert.equal(at,-1);return leaves;
}
test('Bambu filament codes match the native unsplit facet encoding',()=>{
  assert.deepEqual([0,1,2,3,7,15].map(filamentCode),['4','8','0C','1C','5C','DC']);assert.throws(()=>filamentCode(16),/index/);
});
test('flat SVG colors keep their actual RGB values and include the selected back filament',()=>{
  const paint=filamentPaint(image(),'#112233',4);
  assert.equal(paint.palette[0],'#112233');assert.ok(paint.palette.includes('#FF0000'));assert.ok(paint.palette.includes('#0000FF'));assert.ok(paint.palette.length<=4);
  assert.equal(paint.palette[paint.map[10*80+10]],'#FF0000');assert.equal(paint.palette[paint.map[10*80+70]],'#0000FF');
});
test('sub-facet painting preserves color boundaries inside a large flat face',()=>{
  const raster=image(),paint=filamentPaint(raster,'#112233',4),points=[[-10,-10,3],[10,-10,3],[-10,10,3]],code=paintFacet(points,raster.frame,paint);
  assert.ok(code.length>2,'the face contains native paint subdivisions');
  const leaves=decodePaint(code,points);let red=0,blue=0;
  for(const leaf of leaves){
    const x=leaf.points.reduce((sum,p)=>sum+p[0],0)/3;
    const color=paint.palette[leaf.index];if(x<-.25){assert.equal(color,'#FF0000');red++;}else if(x>.25){assert.equal(color,'#0000FF');blue++;}
  }
  assert.ok(red>0&&blue>0,'both colors survive on the same original STL triangle');
});
test('Bambu 3MF embeds numbered filaments and paint while preserving every original mesh triangle',()=>{
  const stl=mesh(),result=stlToBambu3MF(stl,{name:'Clock <A&B>',color:'#112233',painting:image(),maxColors:4}),files=unpack(result.buffer),model=files['3D/3dmodel.model'];
  assert.deepEqual(JSON.parse(files['Metadata/project_settings.config']).filament_colour,result.palette);
  assert.match(model,/name="Creator">Clock Factory</);assert.match(model,/name="Application">BambuStudio-/);assert.match(model,/BambuStudio:MmPaintingVersion/);assert.match(model,/Clock &lt;A&amp;B&gt;/);assert.doesNotMatch(model,/texture2d|data:image/);
  assert.match(files['Metadata/model_settings.config'],/<metadata key="extruder" value="1"/);
  const points=vertices(model),faces=triangles(model),view=new DataView(stl);assert.equal(faces.length,view.getUint32(80,true));
  for(let i=0;i<faces.length;i++){
    const expected=[0,1,2].map(j=>[0,1,2].map(k=>view.getFloat32(96+i*50+j*12+k*4,true)));
    assert.deepEqual(faces[i].indices.map(id=>points[id]),expected);
    if(expected.some(p=>p[2]<3))assert.equal(faces[i].paint,'4','base walls and back use filament 1');
  }
  assert.ok(faces.some(face=>face.paint.length>2));
});
test('A1 0.4 context uses installed presets without embedded temperatures, slots or machine G-code',()=>{
  const files=unpack(stlToBambu3MF(mesh(),{color:'#123456'}).buffer),settings=JSON.parse(files['Metadata/project_settings.config']);
  assert.deepEqual(settings.filament_colour,['#123456']);
  assert.equal(settings.printer_settings_id,'Bambu Lab A1 0.4 nozzle');assert.deepEqual(settings.nozzle_diameter,['0.4']);assert.deepEqual(settings.flush_volumes_matrix,[]);
  assert.doesNotMatch(JSON.stringify(settings),/temperature|ams|gcode/i);
});
test('matching the SVG background avoids spending an extra AMS slot on the back',()=>{
  const result=stlToBambu3MF(mesh(),{painting:image(),color:'#112233'});assert.equal(result.palette.length,2);assert.ok(result.palette.includes('#FF0000'));assert.ok(result.palette.includes('#0000FF'));
  const custom=stlToBambu3MF(mesh(),{painting:image(),color:'#112233',backColor:'face'});assert.equal(custom.palette[0],'#112233');assert.equal(custom.palette.length,3);
});
test('invalid inputs and unsupported filament counts fail with useful messages',()=>{
  assert.throws(()=>stlToBambu3MF(new ArrayBuffer(84)),/triangle count/);assert.throws(()=>filamentPaint(image(),'red',4),/back color/);assert.throws(()=>filamentPaint(image(),'#123456',3),/filaments/);
  assert.throws(()=>stlToBambu3MF(mesh(),{painting:{...image(),frame:null}}),/placement/);
});
test('chosen spool colors merge matching regions into one actual painted filament',()=>{
  const raster=image(),source=filamentPaint(raster,'#112233',4),overrides={'#FF0000':'#00CC66','#0000FF':'#00CC66'},paint=recolorFilamentPaint(source,overrides);
  assert.deepEqual(paint.palette,['#112233','#00CC66']);
  const points=[[-10,-10,3],[10,-10,3],[-10,10,3]];
  for(const leaf of decodePaint(paintFacet(points,raster.frame,paint),points))assert.equal(paint.palette[leaf.index],'#00CC66');
  assert.ok(source.palette.includes('#FF0000'),'the source palette is preserved for restoring original colors');
  const original=unpack(stlToBambu3MF(mesh(),{painting:raster,color:'#112233',backColor:'face'}).buffer),recolored=unpack(stlToBambu3MF(mesh(),{painting:raster,color:'#112233',backColor:'face',colorOverrides:overrides}).buffer);
  assert.deepEqual(JSON.parse(recolored['Metadata/project_settings.config']).filament_colour,['#112233','#00CC66']);
  assert.deepEqual(vertices(recolored['3D/3dmodel.model']),vertices(original['3D/3dmodel.model']));
  assert.deepEqual(triangles(recolored['3D/3dmodel.model']).map(t=>t.indices),triangles(original['3D/3dmodel.model']).map(t=>t.indices));
  assert.throws(()=>stlToBambu3MF(mesh(),{colorOverrides:{'#FF0000':'bad'}}),/filament colors/i);
});
test('antialiased transparent edges reuse solid filaments while distinct translucent fills keep their blended color',()=>{
  const raster=image();for(let x=0;x<80;x++)raster.rgba[x*4+3]=128;
  const paint=filamentPaint(raster,'#008000',4);assert.equal(paint.palette.length,3);assert.deepEqual(new Set(paint.palette),new Set(['#008000','#FF0000','#0000FF']));
  assert.equal(paint.palette[paint.map[4]],'#FF0000');
  for(let at=0;at<raster.rgba.length;at+=4){const red=(at/4)%80<40;raster.rgba.set(red?[229,57,53,255]:[40,85,214,255],at);}
  for(let x=0;x<80;x++)raster.rgba.set(x<40?[228,55,52,131]:[39,84,213,140],x*4);
  const rounded=filamentPaint(raster,'#485C48',4);assert.deepEqual(new Set(rounded.palette),new Set(['#485C48','#E53935','#2855D6']));
  for(let at=0;at<raster.rgba.length;at+=4)raster.rgba.set([0,0,255,128],at);
  const translucent=filamentPaint(raster,'#008000',4);assert.ok(translucent.palette.includes('#004080'));
});
