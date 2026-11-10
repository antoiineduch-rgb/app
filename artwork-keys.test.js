import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceKey,frameKey,layoutKey,paintKey,filamentKey} from './artwork-keys.js';
import {DEFAULT_SETTINGS} from './project.js';
const snapshot={settings:{...DEFAULT_SETTINGS,design:'custom',faceColor:'#C47F62',hourStyle:'arabic',svgBacking:true},revision:7,placement:[1,0,0,1]};
const changed=patch=>({...snapshot,settings:{...snapshot.settings,...patch}});
test('source and fitting caches ignore edits that do not change SVG pixels or label positions',()=>{
  for(const patch of [{thickness:7},{recessWidth:65},{standDepth:60},{svgRelief:2},{faceColor:'#FFFFFF'},{hourColor:'auto'}]){
    assert.equal(sourceKey(changed(patch)),sourceKey(snapshot));assert.equal(layoutKey(changed(patch)),layoutKey(snapshot));
  }
  for(const patch of [{hole:9},{numberSize:110},{numberPosition:90},{svgBackingMargin:5}])assert.notEqual(layoutKey(changed(patch)),layoutKey(snapshot));
  assert.notEqual(frameKey(changed({diameter:240})),frameKey(snapshot));
});
test('paint and quantization caches retain geometry-independent inputs but invalidate real artwork changes',()=>{
  for(const patch of [{thickness:7},{svgBackingThickness:2.4},{recessDepth:7},{standDepth:60},{svgRelief:2}])assert.equal(paintKey(changed(patch)),paintKey(snapshot));
  for(const patch of [{hourColor:'auto'},{faceColor:'#FFFFFF'},{svgDetail:'silhouette'},{numberSize:120}])assert.notEqual(paintKey(changed(patch)),paintKey(snapshot));
  for(const patch of [{filamentCount:2},{bambuBackColor:'face'}]){assert.equal(paintKey(changed(patch)),paintKey(snapshot));assert.notEqual(filamentKey(changed(patch)),filamentKey(snapshot));}
});
test('captured SVG revision and orientation keep old exports isolated from newer artwork',()=>{
  assert.notEqual(sourceKey({...snapshot,revision:8}),sourceKey(snapshot));assert.notEqual(filamentKey({...snapshot,placement:[0,-1,1,0]}),filamentKey(snapshot));
  const key=filamentKey(snapshot),newer=changed({diameter:250});assert.notEqual(filamentKey(newer),key);assert.equal(filamentKey(snapshot),key);
});
test('path placement, inset and rotation invalidate hours and paint without rereading source artwork',()=>{
  const path=changed({hourFollowPath:true});
  assert.notEqual(layoutKey(path),layoutKey(snapshot));assert.notEqual(paintKey(path),paintKey(snapshot));
  for(const patch of [{hourPathInset:7},{hourPathRotate:true}]){const next={...path,settings:{...path.settings,...patch}};assert.equal(sourceKey(next),sourceKey(path));assert.equal(frameKey(next),frameKey(path));assert.notEqual(layoutKey(next),layoutKey(path));assert.notEqual(filamentKey(next),filamentKey(path));}
  assert.equal(layoutKey(changed({hourPathInset:7,hourPathRotate:true})),layoutKey(snapshot),'inactive path options leave legacy fitting untouched');
});
