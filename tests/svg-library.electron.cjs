// Exercise the actual offline desktop editor, not a mock of IndexedDB or SVG.
// Display-free Linux: electron --no-sandbox --ozone-platform=headless
// --disable-gpu tests/svg-library.electron.cjs
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { app } = require('electron');

const profile = mkdtempSync(join(tmpdir(), 'clock-factory-library-tests-'));
app.setPath('userData', profile);
app.disableHardwareAcceleration();
let completed = false;
const watchdog = setTimeout(() => finish(new Error('SVG library desktop tests exceeded 90 seconds.')), 90000);

function finish(error) {
  if (completed) return;
  completed = true;
  clearTimeout(watchdog);
  if (error) console.error(error.stack || error);
  else console.log('All saved SVG and orientation desktop regressions passed.');
  app.exit(error ? 1 : 0);
}
app.on('quit', () => { try { rmSync(profile, { recursive: true, force: true }); } catch {} });
app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', () => run(window).then(() => finish(), finish));
});
process.on('uncaughtException', finish);
process.on('unhandledRejection', finish);

async function run(window) {
  const evaluate = (fn, ...args) => window.webContents.executeJavaScript(
    `(${fn.toString()})(${args.map(value => JSON.stringify(value)).join(',')})`, true,
  );
  async function waitFor(fn, description, timeout = 7000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const result = await evaluate(fn);
      if (result) return result;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error('Timed out waiting for ' + description + ': ' + JSON.stringify(await snapshot()));
  }
  async function hooks() {
    await evaluate(() => {
      window.__libraryErrors = [];
      window.addEventListener('error', event => window.__libraryErrors.push(event.message));
      window.addEventListener('unhandledrejection', event => window.__libraryErrors.push(String(event.reason)));
      window.__libraryBlobs = new Map();
      window.__libraryDownloads = [];
      const createObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = blob => { const url = createObjectURL(blob); window.__libraryBlobs.set(url, blob); return url; };
      HTMLAnchorElement.prototype.click = function () {
        if (this.download?.endsWith('.stl')) window.__libraryDownloads.push({ url: this.href, name: this.download });
      };
      window.__libraryRecords = () => new Promise((resolve, reject) => {
        const request = indexedDB.open('clock-factory-artwork', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('svgs', 'readonly');
          const get = transaction.objectStore('svgs').getAll();
          let records;
          get.onsuccess = () => { records = get.result; };
          transaction.oncomplete = () => { db.close(); resolve(records); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
        };
      });
    });
  }
  async function snapshot() {
    return evaluate(() => ({
      title: document.getElementById('designTitle')?.textContent,
      status: document.getElementById('uploadStatus')?.textContent,
      saved: document.getElementById('artworkSavedStatus')?.textContent,
      name: document.getElementById('artworkName')?.textContent,
      card: !document.getElementById('artworkCard')?.hidden,
      exportDisabled: document.getElementById('export')?.disabled,
      delayedDecodes: window.__raceDecodeStarted,
      activeDelayedDecodes: window.__raceDecodeActive,
      presetDuringDecode: window.__racePresetTriggered,
    }));
  }
  async function records() { return evaluate(async () => (await window.__libraryRecords()).map(({ id, name, source }) => ({ id, name, source }))); }
  async function changeSavedSource(id, source) {
    await evaluate((id, source) => new Promise((resolve, reject) => {
      const request = indexedDB.open('clock-factory-artwork', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('svgs', 'readwrite');
        const store = transaction.objectStore('svgs'), get = store.get(id);
        get.onsuccess = () => { if (!get.result) { transaction.abort(); return; } store.put({ ...get.result, source }); };
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onabort = () => { db.close(); reject(transaction.error || Error('The saved SVG record could not be updated')); };
      };
    }), id, source);
  }
  async function inputSVG(source, filename) {
    await evaluate(async (text, name) => {
      document.getElementById('uploadTab').click();
      const input = document.getElementById('svgUpload');
      const data = new DataTransfer(); data.items.add(new File([text], name, { type: 'image/svg+xml' }));
      input.files = data.files;
      await input.onchange({ target: input });
    }, source, filename);
  }
  async function readyArtwork(name) {
    await waitFor(() => !document.getElementById('artworkCard').hidden && !document.getElementById('export').disabled && /saved/i.test(document.getElementById('artworkSavedStatus').textContent) && !/not saved|session|couldn|unavailable/i.test(document.getElementById('artworkSavedStatus').textContent), 'saved artwork');
    const details = await evaluate(() => ({ name: document.getElementById('artworkName').textContent, thumbnail: document.getElementById('artworkThumbnail').getAttribute('src'), width: document.getElementById('artworkThumbnail').naturalWidth }));
    assert.equal(details.name, name);
    assert.match(details.thumbnail, /^data:image\/png;base64,/);
    assert.ok(details.width > 0, 'thumbnail image decoded');
  }
  async function maskPixels() {
    return evaluate(async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '160'); svg.setAttribute('height', '160'); svg.setAttribute('viewBox', '0 0 400 400');
      svg.append(document.getElementById('clockSvg').querySelector('defs').cloneNode(true));
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '400'); rect.setAttribute('height', '400'); rect.setAttribute('fill', 'white'); rect.setAttribute('mask', 'url(#faceMask)'); svg.append(rect);
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 160;
        const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, 160, 160).data;
        return Array.from({ length: 160 * 160 }, (_, i) => pixels[i * 4 + 3] >= 128 ? 1 : 0);
      } finally { URL.revokeObjectURL(url); }
    });
  }
  function rotateRight(pixels) {
    const result = new Array(pixels.length);
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) result[x * 160 + (159 - y)] = pixels[y * 160 + x];
    return result;
  }
  function mirrorX(pixels) {
    const result = new Array(pixels.length);
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) result[y * 160 + 159 - x] = pixels[y * 160 + x];
    return result;
  }
  function assertPixels(actual, expected, description) {
    let mismatches = 0;
    for (let i = 0; i < actual.length; i++) if (actual[i] !== expected[i]) mismatches++;
    assert.ok(mismatches / actual.length < .003, `${description}: ${mismatches} unexpected mask pixels`);
  }
  async function click(id) { await evaluate(id => document.getElementById(id).click(), id); }
  async function mesh() {
    return evaluate(async () => {
      const before = window.__libraryDownloads.length;
      document.getElementById('export').click();
      const deadline = performance.now() + 15000;
      while (window.__libraryDownloads.length === before && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      const download = window.__libraryDownloads[before];
      if (!download) throw Error('No STL was generated: ' + document.getElementById('toast').textContent);
      const buffer = await window.__libraryBlobs.get(download.url).arrayBuffer(), view = new DataView(buffer);
      const count = view.getUint32(80, true);
      let volume = 0, sumX = 0, sumY = 0;
      for (let i = 0; i < count; i++) {
        const offset = 84 + i * 50 + 12;
        const a = [0, 1, 2].map(k => view.getFloat32(offset + k * 4, true));
        const b = [0, 1, 2].map(k => view.getFloat32(offset + 12 + k * 4, true));
        const c = [0, 1, 2].map(k => view.getFloat32(offset + 24 + k * 4, true));
        const v = (a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
        volume += v; sumX += v * (a[0] + b[0] + c[0]) / 4; sumY += v * (a[1] + b[1] + c[1]) / 4;
      }
      return { triangles: count, bytes: buffer.byteLength, volume, x: sumX / volume, y: sumY / volume, name: download.name };
    });
  }
  async function persisted() {
    return waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('clock-factory') || '{}');
      return saved.design === 'custom' && saved.artworkId && Array.isArray(saved.artworkOrientation) ? saved : null;
    }, 'persisted selected artwork and orientation');
  }
  async function reload() {
    await new Promise(resolve => { window.webContents.once('did-finish-load', resolve); window.webContents.reload(); });
    await hooks();
  }
  function delayImageDecoding(preset = null) {
    window.__raceOriginalDecode = Image.prototype.decode;
    window.__raceDecodeStarted = 0;
    window.__raceDecodeActive = 0;
    Image.prototype.decode = async function (...args) {
      window.__raceDecodeStarted++; window.__raceDecodeActive++;
      try {
        if (preset && !window.__racePresetTriggered) setTimeout(() => {
          window.__raceWasPending = document.getElementById('export').disabled;
          document.querySelector(`[data-design="${preset}"]`).click();
          window.__racePresetTriggered = true;
        }, 0);
        await new Promise(resolve => setTimeout(resolve, 200));
        return await window.__raceOriginalDecode.apply(this, args);
      } finally { window.__raceDecodeActive--; }
    };
  }
  async function finishDecoding() {
    await waitFor(() => window.__raceDecodeStarted > 0 && window.__raceDecodeActive === 0, 'cancelled SVG decode work to finish');
    await new Promise(resolve => setTimeout(resolve, 80));
    await evaluate(() => { Image.prototype.decode = window.__raceOriginalDecode; });
  }

  await hooks();
  assert.equal(await evaluate(() => location.href), 'clock://studio/index.html');
  const librarySource = readFileSync(join(__dirname, '..', 'svg-library.js'), 'utf8').replace(/^export /gm, '');
  await window.webContents.executeJavaScript(`window.__libraryUnderTest = (() => {\n${librarySource}\nreturn {listSavedSVGs,getSavedSVG,saveSVG,deleteSavedSVG};\n})();\nvoid 0;`, true);
  const storageChecks = await evaluate(async () => {
    const api = window.__libraryUnderTest;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16;
    canvas.getContext('2d').fillRect(2, 2, 12, 12);
    const thumbnail = canvas.toDataURL('image/png');
    const inputs = Array.from({ length: 12 }, (_, i) => ({ name: `seed-${i}.svg`, source: `<svg xmlns="http://www.w3.org/2000/svg"><rect width="${20+i}" height="20"/></svg>`, thumbnail }));
    await Promise.all(inputs.map(input => api.saveSVG(input)));
    const retained = await api.listSavedSVGs(), record = await api.getSavedSVG(retained[0].id);
    const deduped = await api.saveSVG({ name: 'renamed.svg', source: record.source, thumbnail });
    const countAfterDedupe = (await api.listSavedSVGs()).length;
    async function rejection(input) {
      try { await api.saveSVG(input); return null; }
      catch (error) { return error.name; }
    }
    const invalidThumbnail = await rejection({ name: 'invalid.svg', source: record.source, thumbnail: 'data:image/svg+xml;base64,PHN2Zy8+' });
    const oversizeASCII = await rejection({ name: 'large.svg', source: 'x'.repeat(5*1024*1024+1), thumbnail });
    const oversizeUTF8 = await rejection({ name: 'large-utf8.svg', source: 'é'.repeat(3*1024*1024), thumbnail });
    const missingDelete = await api.deleteSavedSVG('not-a-saved-record');
    await Promise.all((await api.listSavedSVGs()).map(entry => api.deleteSavedSVG(entry.id)));
    return {
      retained: retained.length,
      uniqueIds: new Set(retained.map(entry => entry.id)).size,
      metadataLeaksSource: retained.some(entry => Object.hasOwn(entry, 'source')),
      sourcePreserved: inputs.some(input => input.source === record.source),
      dedupedId: deduped.id === record.id,
      countAfterDedupe,
      invalidThumbnail,
      oversizeASCII,
      oversizeUTF8,
      missingDelete,
      remaining: (await api.listSavedSVGs()).length,
    };
  });
  assert.deepEqual(storageChecks, {
    retained: 8, uniqueIds: 8, metadataLeaksSource: false, sourcePreserved: true,
    dedupedId: true, countAfterDedupe: 8, invalidThumbnail: 'TypeError',
    oversizeASCII: 'RangeError', oversizeUTF8: 'RangeError', missingDelete: false, remaining: 0,
  });
  console.log('PASS concurrent SVG saves prune atomically, deduplicate, and validate stored inputs');
  await reload();
  await evaluate(() => {
    const diameter = document.getElementById('diameter'); diameter.value = '100'; diameter.dispatchEvent(new Event('input'));
    document.querySelector('[data-texture="smooth"]').click();
    const markers = document.getElementById('markers'); markers.checked = false; markers.dispatchEvent(new Event('input'));
  });
  const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M20 20H90V75H180V180H20Z" fill="#264b32"/></svg>';
  await inputSVG(source, 'my-asymmetric-clock.svg');
  await readyArtwork('my-asymmetric-clock.svg');
  let saved = await records();
  assert.equal(saved.length, 1); assert.equal(saved[0].source, source);
  const originalId = saved[0].id;
  const originalMask = await maskPixels(), originalMesh = await mesh();
  assert.ok(originalMesh.triangles > 100 && originalMesh.volume > 0);
  assert.equal(originalMesh.bytes, 84 + originalMesh.triangles * 50);
  console.log('PASS imported artwork has a saved source, decoded thumbnail, and printable STL');

  await click('artRotateRight');
  assertPixels(await maskPixels(), rotateRight(originalMask), 'quarter turn preview');
  const rotatedMesh = await mesh();
  assert.ok(Math.abs(rotatedMesh.x - originalMesh.y) < .03 && Math.abs(rotatedMesh.y + originalMesh.x) < .03, 'STL rotates with the preview rather than leaving the old geometry');
  for (let i = 0; i < 3; i++) await click('artRotateRight');
  assertPixels(await maskPixels(), originalMask, 'four quarter turns restore the shape');
  await click('artMirrorX');
  assertPixels(await maskPixels(), mirrorX(originalMask), 'horizontal mirror preview');
  const mirroredMesh = await mesh();
  assert.ok(Math.abs(mirroredMesh.x + originalMesh.x) < .03 && Math.abs(mirroredMesh.y - originalMesh.y) < .03, 'STL mirrors with the preview');
  await click('artMirrorX'); assertPixels(await maskPixels(), originalMask, 'two mirrors restore the shape');
  await click('artMirrorX'); await click('artRotateRight');
  const mixedMask = await maskPixels();
  assertPixels(mixedMask, rotateRight(mirrorX(originalMask)), 'mixed operations follow screen axes');
  console.log('PASS rotation and mirroring affect both preview and exported geometry');

  await evaluate(() => document.querySelector('[data-design="round"]').click());
  assert.match((await snapshot()).title, /Essential/);
  await click('useArtwork'); assertPixels(await maskPixels(), mixedMask, 'reuse imported artwork after choosing a preset');
  // Saving is debounced. An older custom-artwork record can already satisfy
  // persisted(), so wait for this exact mixed transform before comparing it
  // with the restored record after reload.
  await waitFor(()=>JSON.stringify(JSON.parse(localStorage.getItem('clock-factory')||'{}').artworkOrientation)==='[0,-1,-1,0]','latest mixed artwork orientation to persist');
  const selected = await persisted();
  assert.equal(selected.artworkId, originalId);
  await reload();
  await readyArtwork('my-asymmetric-clock.svg');
  assert.match((await snapshot()).title, /Custom Clock/);
  assertPixels(await maskPixels(), mixedMask, 'reload retains orientation');
  const restored = await persisted(); assert.deepEqual(restored.artworkOrientation, selected.artworkOrientation);
  assert.ok((await mesh()).volume > 0);
  console.log('PASS selected SVG and its orientation restore after reload and still export');

  await inputSVG('<svg><path></svg>', 'broken.svg');
  assert.match((await snapshot()).status, /valid|couldn|import/i);
  assert.equal((await snapshot()).name, 'my-asymmetric-clock.svg');
  assertPixels(await maskPixels(), mixedMask, 'failed replacement preserves the previous design');
  assert.equal((await records()).length, 1);
  await click('artResetOrientation'); assertPixels(await maskPixels(), originalMask, 'orientation reset');
  console.log('PASS a malformed replacement preserves the saved artwork');

  const largeSource = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><!--' + 'x'.repeat(1100 * 1024) + '--><rect x="20" y="20" width="160" height="160" rx="16"/></svg>';
  await evaluate((text) => {
    const zone = document.getElementById('svgDropZone'), data = new DataTransfer();
    data.items.add(new File([text], 'drop-large.svg', { type: 'image/svg+xml' }));
    const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data });
    zone.dispatchEvent(over);
    if (!over.defaultPrevented) throw Error('SVG drop zone does not accept a dragover event');
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
  }, largeSource);
  await readyArtwork('drop-large.svg');
  saved = await records(); assert.equal(saved.length, 2);
  const dropped = saved.find(record => record.name === 'drop-large.svg');
  assert.ok(dropped && dropped.source.length > 1024 * 1024);
  assert.ok((await mesh()).volume > 0);
  await click('removeArtwork');
  await waitFor(() => document.getElementById('artworkCard').hidden, 'removed artwork card');
  assert.ok(!(await records()).some(record => record.id === dropped.id));
  await reload();
  await waitFor(() => !document.getElementById('export').disabled, 'editor after removal reload');
  assert.equal((await snapshot()).card, false);
  assert.ok(!(await records()).some(record => record.id === dropped.id));
  console.log('PASS drag-and-drop accepts larger SVGs and removal survives reload');

  await evaluate(id => {
    const button = document.querySelector(`#savedArtworks button[data-artwork-id="${CSS.escape(id)}"]`);
    if (!button) throw Error('Saved artwork has no reusable gallery button');
    button.click();
  }, originalId);
  await readyArtwork('my-asymmetric-clock.svg');
  await inputSVG(source, 'my-asymmetric-clock.svg');
  await readyArtwork('my-asymmetric-clock.svg');
  assert.equal((await records()).length, 1, 'reimporting identical source does not create duplicate saved files');
  console.log('PASS saved gallery entries can be reused without duplicating imports');

  await inputSVG(source.replace('#264b32', '#718746'), 'race-source.svg');
  await readyArtwork('race-source.svg');
  const raceId = (await records()).find(record => record.name === 'race-source.svg').id;
  await evaluate(delayImageDecoding);
  await evaluate(id => document.querySelector(`#savedArtworks button[data-artwork-id="${CSS.escape(id)}"]`).click(), originalId);
  await waitFor(() => window.__raceDecodeStarted > 0 && document.getElementById('export').disabled, 'saved SVG decode in progress');
  await evaluate(() => document.querySelector('[data-design="arch"]').click());
  await finishDecoding();
  assert.match((await snapshot()).title, /Arch/);
  assert.equal((await snapshot()).exportDisabled, false, 'cancelled gallery work cannot keep the chosen preset disabled');
  await waitFor(() => JSON.parse(localStorage.getItem('clock-factory') || '{}').design === 'arch', 'newer preset selection to persist');
  assert.equal((await snapshot()).name, 'race-source.svg', 'cancelled gallery fetch cannot replace the currently loaded artwork');
  await click('removeArtwork');
  await waitFor(() => document.getElementById('artworkCard').hidden, 'temporary race artwork removal');
  assert.ok(!(await records()).some(record => record.id === raceId));
  await evaluate(id => document.querySelector(`#savedArtworks button[data-artwork-id="${CSS.escape(id)}"]`).click(), originalId);
  await readyArtwork('my-asymmetric-clock.svg');
  console.log('PASS a newer preset selection wins over delayed gallery loading');

  await persisted();
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Page.enable');
  const startupDelay = await window.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: `(${delayImageDecoding.toString()})('round')` });
  await reload();
  await waitFor(() => window.__racePresetTriggered, 'preset selection during startup SVG restoration');
  assert.equal(await evaluate(() => window.__raceWasPending), true, 'the preset was chosen while artwork restoration was still pending');
  await finishDecoding();
  assert.match((await snapshot()).title, /Essential/);
  assert.equal((await snapshot()).exportDisabled, false);
  assert.equal((await snapshot()).card, false, 'cancelled startup work cannot resurrect its imported artwork');
  await window.webContents.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier: startupDelay.identifier });
  window.webContents.debugger.detach();
  await evaluate(id => document.querySelector(`#savedArtworks button[data-artwork-id="${CSS.escape(id)}"]`).click(), originalId);
  await readyArtwork('my-asymmetric-clock.svg');
  console.log('PASS a newer preset selection also wins over delayed startup restoration');

  await persisted();
  await changeSavedSource(originalId, '<svg><path></svg>');
  await reload();
  await waitFor(() => !document.getElementById('export').disabled && document.getElementById('artworkCard').hidden, 'usable editor after corrupt saved SVG');
  assert.doesNotMatch((await snapshot()).title, /Custom Clock/);
  assert.match((await snapshot()).status, /restore|open|valid|couldn|load|import/i, 'a failed restore should explain why the saved artwork could not open');
  await waitFor(() => JSON.parse(localStorage.getItem('clock-factory') || '{}').design !== 'custom', 'invalid saved selection is not kept as an active SVG');
  await changeSavedSource(originalId, source);
  await evaluate(id => document.querySelector(`#savedArtworks button[data-artwork-id="${CSS.escape(id)}"]`).click(), originalId);
  await readyArtwork('my-asymmetric-clock.svg');
  console.log('PASS corrupt saved SVG falls back to a usable editor and can be replaced with a valid source');

  await evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('clock-factory-artwork');
      request.onsuccess = resolve; request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Test could not reset the artwork database'));
    });
    Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new DOMException('Test storage unavailable', 'SecurityError'); } });
  });
  await inputSVG(source.replace('#264b32', '#392143'), 'session-only.svg');
  await waitFor(() => !document.getElementById('artworkCard').hidden && !document.getElementById('export').disabled && /session|not saved|unavailable|couldn/i.test(document.getElementById('artworkSavedStatus').textContent), 'honest storage-failure status');
  assert.equal((await snapshot()).name, 'session-only.svg');
  assert.ok((await mesh()).volume > 0, 'a storage failure does not prevent using or exporting the current SVG');
  assert.deepEqual(await evaluate(() => window.__libraryErrors), []);
  console.log('PASS unavailable storage keeps the current SVG usable without claiming it was saved');
}

require('../desktop/main.cjs');
