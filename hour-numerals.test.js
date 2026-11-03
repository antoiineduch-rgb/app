import { test } from 'node:test';
import assert from 'node:assert/strict';
import clipping from 'polygon-clipping';
import { hourNumeralLabels, hourNumeralPolygons, hourNumeralMarkup } from './hour-numerals.js';

const settings = {diameter:100,hourStyle:'arabic',numberSize:100,numberPosition:100};
function area(polygons) {
  let total=0;
  for(const polygon of polygons)for(let r=0;r<polygon.length;r++){
    const ring=polygon[r];let a=0;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++)a+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];
    total+=(r?-1:1)*Math.abs(a/2);
  }
  return total;
}
function bounds(polygons) {
  const points=polygons.flat(2);
  return {minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};
}

test('Arabic hour labels are upright, readable vector geometry at all twelve positions',()=>{
  const labels=hourNumeralLabels(settings);
  assert.deepEqual(labels.map(label=>label.text),Array.from({length:12},(_,i)=>String(i+1)));
  assert.deepEqual(labels.map(label=>label.hour),Array.from({length:12},(_,i)=>i+1));
  for(const [hour,x,y]of[[12,0,30],[3,30,0],[6,0,-30],[9,-30,0]]){
    const label=labels.find(label=>label.hour===hour);
    assert.equal(label.x,x);assert.equal(label.y,y);
  }
  for(const label of labels){
    const box=bounds(label.polygons);
    assert.ok(box.maxY-box.minY>6&&box.maxY-box.minY<7,'font height should be printable at a 100 mm face');
    assert.ok(area(label.polygons)>3,'each label has a real printable stroke area');
    assert.ok(label.polygons.flat(2).every(point=>point.every(Number.isFinite)));
    assert.ok(Math.abs((box.maxY+box.minY)/2-label.y)<.1,'upright glyphs remain centered vertically rather than rotating around the face');
  }
});

test('closed Arabic digits retain their counters',()=>{
  const labels=hourNumeralLabels(settings);
  for(const hour of [6,8,9,10]){
    const label=labels.find(label=>label.hour===hour);
    const holes=label.polygons.reduce((sum,polygon)=>sum+polygon.length-1,0);
    assert.ok(holes>0,`${hour} must retain an open counter`);
  }
  assert.equal(labels.find(label=>label.hour===8).polygons.reduce((sum,polygon)=>sum+polygon.length-1,0),2);
});

test('Roman numerals include IV, VIII, IX and XII with printable separated strokes',()=>{
  const labels=hourNumeralLabels({...settings,hourStyle:'roman'});
  assert.deepEqual(labels.map(label=>label.text),['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']);
  assert.equal(labels[7].polygons.length,4,'VIII retains V and its three I strokes');
  for(const label of labels){
    const box=bounds(label.polygons);
    assert.ok(box.maxY-box.minY>=6.4&&box.maxY-box.minY<6.6);
    assert.ok(box.maxX-box.minX<12,'the widest numeral fits the space between hours at a 100 mm face');
    assert.ok(area(label.polygons)>3);
  }
});

test('expanded numeral outlines provide complete texture clearance without moving the glyphs',()=>{
  for(const hourStyle of ['arabic','roman'])for(const padding of [.15,.6]){
    const base=hourNumeralPolygons({...settings,hourStyle});
    const expanded=hourNumeralPolygons({...settings,hourStyle},padding);
    assert.ok(area(expanded)>area(base));
    assert.ok(area(clipping.difference(base,expanded))<1e-8,'unpadded strokes must be fully supported by the expanded foundation');
  }
});

test('size and radial-position controls affect geometry, with bounded saved-setting defaults',()=>{
  const small=hourNumeralLabels({...settings,numberSize:70,numberPosition:80});
  const large=hourNumeralLabels({...settings,numberSize:130,numberPosition:120});
  assert.equal(small[11].y,24);assert.equal(large[11].y,36);
  assert.ok(area(large[0].polygons)>area(small[0].polygons)*3);
  assert.deepEqual(hourNumeralLabels({...settings,numberSize:Infinity,numberPosition:NaN}),hourNumeralLabels(settings));
  assert.deepEqual(hourNumeralLabels({...settings,hourStyle:'ticks'}),[]);
  assert.deepEqual(hourNumeralPolygons({...settings,hourStyle:'none'}),[]);
  assert.throws(()=>hourNumeralPolygons(settings,-1),RangeError);
});

test('preview paths use the exact printable polygons and remain twelve individually identified labels',()=>{
  const markup=hourNumeralMarkup(settings);
  assert.equal((markup.match(/data-hour=/g)||[]).length,12);
  assert.ok(markup.includes('data-hour="12"'));
  assert.ok(markup.includes('fill-rule="evenodd"'),'holes must also remain open in the preview');
  assert.doesNotMatch(markup,/NaN|undefined|<text/);
});
