import {test} from 'node:test';
import assert from 'node:assert/strict';
import {printReadiness} from './print-readiness.js';
import {flatColorClock} from './quick-setup.js';
import {filamentTexture} from './filament-texture.js';
import {DEFAULT_SETTINGS} from './project.js';
import {hourInkColors} from './hour-contrast.js';

const stats={dimensions:[187,187,9.7],components:1};
test('a print is only marked checked after the current geometry fits its build plate',()=>{
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS}).action,'check');
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats}).tone,'success');
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats,plate:{width:180,depth:180}}).action,'fit');
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats:null}).tone,'neutral','a design with no current mesh cannot inherit an old ready status');
});
test('invalid measurements, incomplete hours and geometry errors take priority over a ready mesh',()=>{
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats,invalid:'hole'}).action,'dimensions');
  const hours={labels:new Array(8),missing:[1,2,3,4]};assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats,hours}).action,'hours');
  const settings={...DEFAULT_SETTINGS,design:'custom'};
  assert.equal(printReadiness({settings,stats,error:'Rear box: the movement box needs a solid clock face beneath it.'}).action,'backing');
  assert.equal(printReadiness({settings,stats,error:'Rear pocket: leave at least 1.2 mm of material in front.'}).action,'room');
  assert.equal(printReadiness({settings,stats,error:'Could not generate a closed mesh.'}).tone,'error');
});
test('flat STL color loss, separate parts and rear overhangs have specific review actions',()=>{
  const settings={...flatColorClock(DEFAULT_SETTINGS),exportFormat:'stl'};
  assert.equal(printReadiness({settings,stats}).action,'colors');
  assert.equal(printReadiness({settings:{...settings,exportFormat:'3mf'},stats}).tone,'success');
  assert.equal(printReadiness({settings:{...DEFAULT_SETTINGS,design:'custom'},stats:{...stats,components:3}}).action,'backing');
  assert.equal(printReadiness({settings:{...settings,exportFormat:'3mf',mechanismFlatFront:false},stats}).action,'back');
});
test('loading and in-progress checks never claim a finished review or offer a duplicate check',()=>{
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats,loading:true}).action,null);
  const checking=printReadiness({settings:DEFAULT_SETTINGS,checking:true});assert.equal(checking.action,null);assert.equal(checking.tone,'neutral');
  assert.equal(printReadiness({settings:DEFAULT_SETTINGS,stats,plateValid:false}).action,'printer');
});
test('the A1 setup preserves original artwork-related choices while configuring the measured movement',()=>{
  const original={...DEFAULT_SETTINGS,design:'custom',diameter:187,projectName:'My SVG clock',svgBacking:true,svgBackingThickness:1.4,svgBackingMargin:5,deskStand:true,standWidth:50,standDepth:55,standLean:15,bambuColors:{'#E53935':'#00CC66'},color:3},copy=structuredClone(original),result=flatColorClock(original);
  assert.deepEqual(original,copy);
  for(const key of ['design','diameter','projectName','svgBacking','svgBackingThickness','svgBackingMargin','deskStand','standWidth','standDepth','standLean','bambuColors','color'])assert.deepEqual(result[key],original[key]);
  assert.equal(result.thickness,3);assert.equal(result.mechanismMount,'box');assert.equal(result.mechanismFlatFront,true);assert.equal(result.recessWidth,55);assert.equal(result.recessDepth,5.5);assert.equal(result.hourStyle,'arabic');assert.equal(result.threeMFTarget,'bambu-a1');
});
test('the 3D filament texture uses the selected source colors and reverses rows without mirroring the SVG',()=>{
  const data=filamentTexture(new Uint8Array([0,1,2,0]),2,['#E53935','#00CC66','#2855D6']);
  assert.deepEqual([...data],[40,85,214,255,229,57,53,255,229,57,53,255,0,204,102,255]);
  const merged=filamentTexture(new Uint8Array([0,1,2,0]),2,['#E53935','#00CC66','#00CC66']);assert.deepEqual([...merged.slice(0,4)],[0,204,102,255]);
});
test('automatic hours use contrasting existing SVG inks on light and dark areas',()=>{
  const n=16,rgba=new Uint8ClampedArray(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++)rgba.set(x<n/2?[255,255,255,255]:[40,85,214,255],(y*n+x)*4);
  const label=(hour,x)=>({hour,polygons:[[[[x,0],[x+1,0],[x+1,1],[x,1],[x,0]]]]}),layout={labels:[label(1,-5),label(2,3)]},frame={scale:1,cx:8,cy:8};
  assert.deepEqual(hourInkColors(rgba,n,frame,layout,{hourColor:'auto'}),{1:'#2855D6',2:'#FFFFFF'});
  assert.deepEqual(hourInkColors(rgba,n,frame,layout,{hourColor:'light'}),{1:'#F5E5CD',2:'#F5E5CD'});
  assert.deepEqual(hourInkColors(rgba,n,frame,layout,{hourColor:'dark'}),{1:'#24382D',2:'#24382D'});
});
test('desk stands use flat-front guidance and offer a backing for unsuitable SVG attachments',()=>{
  const settings={...DEFAULT_SETTINGS,design:'custom',deskStand:true,mechanismRecess:false,mechanismFlatFront:false};
  assert.equal(printReadiness({settings,stats}).action,'colors');
  assert.equal(printReadiness({settings:{...settings,exportFormat:'3mf'},stats}).tone,'success');
  assert.equal(printReadiness({settings,error:'Desk stand: not enough space below the mechanism.'}).action,'backing');
  assert.equal(printReadiness({settings:{...settings,svgBacking:true},error:'Desk stand: not enough space below the mechanism.'}).action,'stand');
  assert.equal(printReadiness({settings,error:'Desk stand: the model’s center of mass lies outside its support.'}).action,'stand');
});
