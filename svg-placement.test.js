import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrientation, transformOrientation, placementTransform, drawPlacedArtwork } from './svg-placement.js';

const identity = [1,0,0,1];
const point = (matrix, x, y) => [
  200+matrix[0]*(x-200)+matrix[2]*(y-200),
  200+matrix[1]*(x-200)+matrix[3]*(y-200),
];

test('only the eight orthogonal quarter-turn/reflection matrices are accepted', () => {
  const found = new Map([[identity.join(','), identity]]);
  for (const matrix of found.values()) for (const action of ['left','right','mirrorX','mirrorY']) {
    const result = transformOrientation(matrix, action);
    found.set(result.join(','), result);
  }
  assert.equal(found.size, 8);
  for (const matrix of found.values()) {
    assert.deepEqual(normalizeOrientation(matrix), matrix);
    assert.notEqual(normalizeOrientation(matrix), matrix, 'stored arrays are cloned');
  }
  for (const value of [null, undefined, {}, '1,0,0,1', [1,0,0], [1,0,0,1,0], [2,0,0,1], [1,1,0,1], [1,0,1,0], [0,0,0,0], [1,0,0,NaN], [1,0,0,Infinity], [.5,0,0,1], ['1',0,0,1], new Array(4)]) {
    assert.deepEqual(normalizeOrientation(value), identity);
  }
  assert.deepEqual(normalizeOrientation([1,-0,-0,1]), identity);
});

test('four rotations, double mirrors and reset restore the original orientation', () => {
  for (const action of ['left','right']) {
    let matrix = [...identity];
    for (let i=0;i<4;i++) matrix = transformOrientation(matrix, action);
    assert.deepEqual(matrix, identity);
  }
  for (const action of ['mirrorX','mirrorY']) {
    assert.deepEqual(transformOrientation(transformOrientation(identity, action), action), identity);
  }
  assert.deepEqual(transformOrientation(transformOrientation(identity, 'left'), 'right'), identity);
  assert.deepEqual(transformOrientation([0,-1,-1,0], 'reset'), identity);
  assert.throws(() => transformOrientation(identity, 'scale'), RangeError);
});

test('rotations and mirrors act around the artwork center in screen axes', () => {
  assert.deepEqual(point(transformOrientation(identity, 'right'), 300, 200), [200,300]);
  assert.deepEqual(point(transformOrientation(identity, 'left'), 300, 200), [200,100]);
  const mirrorThenRotate = transformOrientation(transformOrientation(identity, 'mirrorX'), 'right');
  const rotateThenMirror = transformOrientation(transformOrientation(identity, 'right'), 'mirrorX');
  assert.deepEqual(point(mirrorThenRotate,315,140), [260,85]);
  assert.deepEqual(point(rotateThenMirror,315,140), [140,315]);
  assert.notDeepEqual(mirrorThenRotate, rotateThenMirror);
  for (const matrix of [mirrorThenRotate,rotateThenMirror]) {
    assert.deepEqual(point(matrix,200,200), [200,200], 'the mechanism center stays fixed');
    const corners = [[32,32],[368,32],[368,368],[32,368]].map(([x,y])=>point(matrix,x,y));
    assert.ok(corners.every(([x,y])=>x>=32&&x<=368&&y>=32&&y<=368), 'the fitted artwork stays inside its canvas');
  }
});

test('SVG and export drawing share the same center, matrix and canvas extent', () => {
  const image = {}, calls = [], matrix = [0,1,-1,0];
  const context = Object.fromEntries(['save','translate','transform','drawImage','restore'].map(method => [method, (...args) => calls.push([method,...args])]));
  drawPlacedArtwork(context,image,matrix);
  assert.deepEqual(calls, [
    ['save'], ['translate',200,200], ['transform',0,1,-1,0,0,0],
    ['translate',-200,-200], ['drawImage',image,0,0,400,400], ['restore'],
  ]);
  assert.equal(placementTransform(matrix),'translate(200 200) matrix(0 1 -1 0 0 0) translate(-200 -200)');
  assert.equal(placementTransform([5,0,0,1]),'translate(200 200) matrix(1 0 0 1 0 0) translate(-200 -200)');
});

test('failed artwork drawing still restores the export canvas state', () => {
  const calls = [], context = {
    save:()=>calls.push('save'), translate:()=>{}, transform:()=>{},
    drawImage:()=>{throw new Error('Image unavailable');}, restore:()=>calls.push('restore'),
  };
  assert.throws(()=>drawPlacedArtwork(context,{},identity),/Image unavailable/);
  assert.deepEqual(calls,['save','restore']);
});
