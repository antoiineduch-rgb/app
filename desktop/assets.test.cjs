const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { appResponse, isAppURL, CSP } = require('./assets.cjs');
const root = join(__dirname, '..');

test('desktop protocol serves only app assets with CSP, including the export worker', async () => {
  for (const name of ['index.html', 'style.css', 'studio.js', 'export-worker.js', 'mesh-view.js']) {
    const response = await appResponse(new Request(`clock://studio/${name}`), root);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-security-policy'), CSP);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  const head = await appResponse(new Request('clock://studio/index.html', { method: 'HEAD' }), root);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('desktop protocol rejects external origins and files outside the asset allowlist', async () => {
  for (const url of ['https://studio/index.html', 'clock://other/index.html', 'clock://studio/package.json', 'clock://studio/desktop/main.cjs', 'clock://studio/../README.md', 'clock://studio/%2e%2e%2fpackage.json']) {
    assert.equal((await appResponse(new Request(url), root)).status, 404, url);
  }
  assert.equal((await appResponse(new Request('clock://studio/index.html', { method: 'POST' }), root)).status, 404);
  assert.equal(isAppURL('clock://studio.evil/index.html'), false);
  assert.equal(isAppURL('clock://user@studio/index.html'), false);
  assert.equal(isAppURL('clock://studio:1234/index.html'), false);
});
