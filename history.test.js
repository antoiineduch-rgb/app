import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DesignHistory} from './history.js';
test('design undo and redo recover immutable snapshots including shared SVG assets',()=>{
  const history=new DesignHistory(),asset={source:'SVG source'},a={diameter:180,asset},b={diameter:200,asset};
  history.commit(a,'a');history.commit(b,'b');assert.equal(history.undo(),a);assert.equal(history.redo(),b);assert.equal(history.redo(),null);assert.equal(history.entries[0].value.asset,asset);
});
test('one slider gesture is one undo step and separate gestures stay separate',()=>{
  const history=new DesignHistory();history.commit(100,'100');
  history.commit(110,'110',{group:'diameter',time:0});history.commit(130,'130',{group:'diameter',time:50});history.commit(200,'200',{group:'diameter',time:100});
  assert.equal(history.entries.length,2);assert.equal(history.undo(),100);assert.equal(history.redo(),200);
  history.endGroup();history.commit(210,'210',{group:'diameter',time:200});assert.equal(history.undo(),200);
});
test('editing after undo clears redo and unchanged renders do not create history',()=>{
  const history=new DesignHistory();history.commit(1,'one');history.commit(2,'two');history.undo();history.commit(3,'three');
  assert.equal(history.canRedo,false);history.commit(3,'three');assert.equal(history.entries.length,2);assert.equal(history.undo(),1);
});
test('history is bounded and reset creates a single restored starting state',()=>{
  const history=new DesignHistory(3);for(let i=0;i<8;i++)history.commit(i,String(i));
  assert.equal(history.entries.length,3);assert.equal(history.undo(),6);assert.equal(history.undo(),5);assert.equal(history.undo(),null);
  history.reset(10,'ten');assert.equal(history.canUndo,false);assert.equal(history.canRedo,false);
});
