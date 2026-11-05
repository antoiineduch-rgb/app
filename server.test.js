import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from './server.js';
test('serves the editor and assets at root and under a hosting prefix', async () => {
  const server = createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const prefix of ['/', '/app/']) {
      const page = await fetch(base+prefix);
      assert.equal(page.status,200);
      assert.match(await page.text(),/src="\.\/studio.js"/);
      const script = await fetch(base+prefix+'studio.js');
      assert.equal(script.status,200);
      assert.match(script.headers.get('content-type'),/javascript/);
      assert.equal(await script.text(),await readFile(new URL('./studio.js',import.meta.url),'utf8'));
      const worker = await fetch(base+prefix+'export-worker.js');
      assert.equal(worker.status,200);
      assert.match(worker.headers.get('content-type'),/javascript/);
      assert.equal(await worker.text(),await readFile(new URL('./export-worker.js',import.meta.url),'utf8'));
      const view=await fetch(base+prefix+'mesh-view.js');
      assert.equal(view.status,200);assert.match(view.headers.get('content-type'),/javascript/);assert.equal(await view.text(),await readFile(new URL('./mesh-view.js',import.meta.url),'utf8'));
      assert.equal((await fetch(base+prefix+'style.css')).status,200);
    }
    assert.equal((await fetch(base+'/package.json')).status,404);
    assert.equal((await fetch(base+'/.git/config')).status,404);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
