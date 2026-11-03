import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MeshStore} from './mesh-store.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('preview and export share one build and cache its exact result',async()=>{
  const store=new MeshStore(),ready=deferred();let builds=0;
  const build=async(_signal,stage)=>{builds++;stage('mesh');return ready.promise;};
  const a=store.get('clock',build),b=store.get('clock',build);ready.resolve({buffer:'same geometry'});
  assert.equal(await a,await b);assert.equal(await store.get('clock',build),await a);assert.equal(builds,1);
});
test('cancelling preview leaves a subscribed export running, even with identical callbacks',async()=>{
  const store=new MeshStore(),ready=deferred(),preview=new AbortController(),exporter=new AbortController();let signal;const onStage=()=>{};
  const build=async value=>{signal=value;return ready.promise;};
  const a=store.get('clock',build,{signal:preview.signal,onStage}),b=store.get('clock',build,{signal:exporter.signal,onStage});
  await Promise.resolve();preview.abort();await assert.rejects(a,{name:'AbortError'});assert.equal(signal.aborted,false);ready.resolve('download');assert.equal(await b,'download');
});
test('abandoned or failed builds never poison the cache or replace a newer build',async()=>{
  const store=new MeshStore(),old=deferred(),controller=new AbortController();
  const a=store.get('clock',()=>old.promise,{signal:controller.signal});await Promise.resolve();controller.abort();await assert.rejects(a,{name:'AbortError'});
  assert.equal(await store.get('clock',async()=>'new mesh'),'new mesh');old.resolve('obsolete');await new Promise(resolve=>setImmediate(resolve));assert.equal(store.peek('clock'),'new mesh');
  await assert.rejects(store.get('bad',async()=>{throw Error('Invalid shape');}),/Invalid shape/);assert.equal(store.peek('bad'),null);
});
test('least recently used cached meshes are evicted to bound memory',async()=>{
  const store=new MeshStore(2);await store.get('a',async()=>1);await store.get('b',async()=>2);await store.get('a',async()=>0);await store.get('c',async()=>3);
  assert.equal(store.peek('a'),1);assert.equal(store.peek('b'),null);assert.equal(store.peek('c'),3);
});
