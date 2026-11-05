import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findSettings} from './settings-finder.js';
test('specific settings rank ahead of broad categories and all query words are required',()=>{
  assert.equal(findSettings('stand clearance')[0].id,'standClearance');assert.equal(findSettings('number size')[0].id,'numberSize');assert.equal(findSettings('svg relief')[0].id,'svgRelief');assert.deepEqual(findSettings('stand colors'),[]);
});
test('English and French aliases find the same physical clock settings',()=>{
  assert.equal(findSettings('DÉGAGEMENT')[0].id,'standClearance');assert.equal(findSettings('mécanisme')[0].id,'recessWidth');assert.equal(findSettings('chiffres')[0].id,'hourStyle');assert.equal(findSettings('roman')[0].id,'hourStyle');assert.equal(findSettings('3MF')[0].id,'threeMFTarget');
});
test('empty and unmatched searches provide bounded, useful results',()=>{
  assert.equal(findSettings('').length,8);assert.equal(findSettings('  ').length,8);assert.deepEqual(findSettings('unrelated setting name'),[]);assert.ok(findSettings('color').length<=8);
});
