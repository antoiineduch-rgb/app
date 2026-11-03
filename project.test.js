import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,normalizeSettings,parseProject,serializeProject,projectFilename,MAX_PROJECT_BYTES} from './project.js';
const artwork={name:'My leaf.svg',source:'<svg xmlns="http://www.w3.org/2000/svg"><circle r="20" fill="#24382d"/></svg>'};
test('a portable project round-trips its SVG, exact size, settings and orientation',()=>{
  const settings={...DEFAULT_SETTINGS,design:'custom',projectName:'Mon horloge',diameter:187,hourStyle:'roman',svgRelief:1.2,showHands:false};
  const project=parseProject(serializeProject(settings,artwork,[0,-1,-1,0]));
  assert.deepEqual(project,{settings,artwork,orientation:[0,-1,-1,0]});
});
test('preset projects work without SVGs and can retain unused artwork',()=>{
  assert.equal(parseProject(serializeProject(DEFAULT_SETTINGS)).artwork,null);
  assert.deepEqual(parseProject(serializeProject(DEFAULT_SETTINGS,artwork)).artwork,artwork);
});
test('settings migration keeps legacy designs and uses bounded defaults for newer controls',()=>{
  assert.deepEqual(normalizeSettings(null),DEFAULT_SETTINGS);
  const value=normalizeSettings({design:'custom',diameter:187,color:100,svgRelief:Infinity,showHands:false,unknown:'unsafe',projectName:' <Leaf>\u0001 '});
  assert.equal(value.diameter,187);assert.equal(value.color,6);assert.equal(value.svgRelief,.8);assert.equal(value.showHands,false);assert.equal(value.projectName,'Leaf');assert.equal(value.unknown,undefined);
});
test('invalid projects cannot silently overwrite current settings or lose their SVG',()=>{
  const json=JSON.parse(serializeProject(DEFAULT_SETTINGS));
  for(const patch of [{version:2},{format:'other'},{settings:[]},{settings:{design:'custom'}},{settings:{diameter:30}},{settings:{thickness:2.3}},{settings:{hole:'8'}},{settings:{showHands:'false'}},{orientation:[2,0,0,1]},{artwork:{name:'broken.svg'}}])assert.throws(()=>parseProject(JSON.stringify({...json,...patch})),/project/i);
  assert.throws(()=>parseProject('<svg/>'),/valid Clock Factory project/);
  assert.throws(()=>parseProject(' '.repeat(MAX_PROJECT_BYTES+1)),/smaller than 12 MB/);
});
test('project filenames are safe for Windows without modifying the displayed title',()=>{
  assert.equal(projectFilename('Mon horloge'),'Mon horloge.clock');
  assert.equal(projectFilename('A/B:C?'),'A-B-C-.clock');
  assert.equal(projectFilename('CON'),'Clock-CON.clock');assert.equal(projectFilename('...'),'My Clock.clock');
  assert.equal(parseProject(serializeProject({...DEFAULT_SETTINGS,projectName:'CON'})).settings.projectName,'CON');
});
test('unknown project data and prototype keys never become application settings',()=>{
  const value=parseProject('{"format":"clock-factory-project","version":1,"settings":{"__proto__":{"polluted":true},"extra":"data","design":"round"}}');
  assert.equal(value.settings.design,'round');assert.equal(Object.hasOwn(value.settings,'__proto__'),false);assert.equal(value.settings.extra,undefined);assert.equal({}.polluted,undefined);
});
