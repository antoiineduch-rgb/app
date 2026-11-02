// Exercises the shipped desktop app, including its custom protocol and CSP.
// Linux without a display: electron --no-sandbox --ozone-platform=headless
// --disable-gpu tests/svg-import.electron.cjs
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { app } = require('electron');

const profile = mkdtempSync(join(tmpdir(), 'clock-factory-svg-tests-'));
app.setPath('userData', profile);
app.disableHardwareAcceleration();
let completed = false;
const watchdog = setTimeout(() => finish(new Error('SVG desktop tests exceeded 90 seconds.')), 90000);

function finish(error) {
  if (completed) return;
  completed = true;
  clearTimeout(watchdog);
  if (error) console.error(error.stack || error);
  else console.log('All SVG import desktop regressions passed.');
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
  const initial = await evaluate(() => {
    window.__svgErrors = [];
    window.addEventListener('error', event => window.__svgErrors.push(event.message));
    window.addEventListener('unhandledrejection', event => window.__svgErrors.push(String(event.reason)));
    window.__svgDownloads = [];
    window.__svgBlobs = new Map();
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (blob) {
      const url = createObjectURL(blob);
      window.__svgBlobs.set(url, blob);
      return url;
    };
    HTMLAnchorElement.prototype.click = function () {
      if (this.download.endsWith('.stl')) window.__svgDownloads.push({ url: this.href, name: this.download });
    };
    const diameter = document.getElementById('diameter');
    diameter.value = '100';
    diameter.dispatchEvent(new Event('input', { bubbles: true }));
    return { url: location.href, presets: document.querySelectorAll('.design-card').length, node: typeof window.require };
  });
  assert.equal(initial.url, 'clock://studio/index.html');
  assert.equal(initial.presets, 6);
  assert.equal(initial.node, 'undefined');

  async function importFixture(name) {
    const source = readFileSync(join(__dirname, 'fixtures', name), 'utf8');
    return evaluate(async (text, filename) => {
      document.getElementById('uploadTab').click();
      const input = document.getElementById('svgUpload');
      const transfer = new DataTransfer();
      transfer.items.add(new File([text], filename, { type: 'image/svg+xml' }));
      input.files = transfer.files;
      if (typeof input.onchange !== 'function') throw new Error('SVG input handler is not installed.');
      await input.onchange({ target: input });
      return {
        status: document.getElementById('uploadStatus').textContent,
        title: document.getElementById('designTitle').textContent,
        mask: document.getElementById('faceMask')?.innerHTML || '',
        executed: Boolean(window.__svgExecuted),
      };
    }, source, name);
  }

  async function visibleFacePixels() {
    return evaluate(async () => {
      const svg = document.getElementById('clockSvg').cloneNode(true);
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '400');
      svg.setAttribute('height', '400');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 400;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, 400, 400).data;
        let count = 0, minX = 400, minY = 400, maxX = -1, maxY = -1;
        for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++) {
          // The center cap and illustrative hands alone cannot pass this check.
          if (Math.hypot(x - 200, y - 200) < 60 || pixels[(y * 400 + x) * 4 + 3] < 128) continue;
          count++;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        return { count, width: maxX - minX + 1, height: maxY - minY + 1, cornerAlpha: pixels[(45 * 400 + 45) * 4 + 3] };
      } finally { URL.revokeObjectURL(url); }
    });
  }

  async function exportedTriangles() {
    return evaluate(async () => {
      const before = window.__svgDownloads.length;
      document.getElementById('export').click();
      const deadline = performance.now() + 10000;
      while (window.__svgDownloads.length === before && performance.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      const download = window.__svgDownloads[before];
      if (!download) throw new Error('SVG export did not produce an STL: ' + document.getElementById('toast').textContent);
      const buffer = await window.__svgBlobs.get(download.url).arrayBuffer();
      const count = new DataView(buffer).getUint32(80, true);
      return { count, bytes: buffer.byteLength, name: download.name };
    });
  }

  let roundedSquarePixels = 0;
  const visibleCounts = new Map();
  const comparableShapes = new Map([
    ['percent-circle.svg', 'numeric-circle.svg'],
    ['percent-rectangle.svg', 'numeric-rectangle.svg'],
    ['percent-stroke.svg', 'numeric-stroke.svg'],
    ['symbol-percent.svg', 'numeric-circle.svg'],
  ]);
  for (const name of ['filled.svg', 'stroke-only.svg', 'styled-use.svg', 'clipped.svg', 'large-viewbox.svg', 'rounded-square.svg', 'root-transform.svg', 'root-rotate-scale.svg', 'numeric-circle.svg', 'percent-circle.svg', 'numeric-rectangle.svg', 'percent-rectangle.svg', 'numeric-stroke.svg', 'percent-stroke.svg', 'symbol-percent.svg', 'unsafe-with-shape.svg']) {
    const imported = await importFixture(name);
    assert.match(imported.title, /Custom Clock/, `${name}: ${imported.status}`);
    assert.ok(imported.status.includes(name), `${name}: ${imported.status}`);
    assert.ok(imported.mask.length > 30, `${name}: mask is empty`);
    assert.equal(imported.executed, false, `${name}: imported code executed`);
    assert.doesNotMatch(imported.mask, /<script|<foreignObject|https:\/\/example\.invalid|onload=/i);
    const visible = await visibleFacePixels();
    assert.ok(visible.count > 2000, `${name}: imported face is not visible (${visible.count} pixels)`);
    assert.ok(Math.max(visible.width, visible.height) >= 290, `${name}: artwork did not fit the preview (${visible.width} × ${visible.height})`);
    if (name === 'clipped.svg') assert.equal(visible.cornerAlpha, 0, 'clip path should keep the corners transparent');
    if (name === 'rounded-square.svg') roundedSquarePixels = visible.count;
    if (['root-transform.svg', 'root-rotate-scale.svg'].includes(name)) {
      assert.ok(Math.abs(visible.count - roundedSquarePixels) / roundedSquarePixels < .03,
        `root transform clipped the artwork: ${visible.count} pixels versus ${roundedSquarePixels} for equivalent geometry`);
    }
    const reference = comparableShapes.get(name);
    if (reference) {
      const referenceCount = visibleCounts.get(reference);
      assert.ok(Math.abs(visible.count - referenceCount) / referenceCount < .03,
        `${name}: percentage coordinates changed the artwork (${visible.count} pixels versus ${referenceCount} for ${reference})`);
    }
    visibleCounts.set(name, visible.count);
    const exported = await exportedTriangles();
    assert.ok(exported.count > 100, `${name}: no printable mesh`);
    assert.equal(exported.bytes, 84 + exported.count * 50);
    assert.ok(exported.name.endsWith('custom-100mm.stl'));
    console.log(`PASS ${name}: ${visible.count} preview pixels, ${exported.count} STL triangles`);
  }

  for (const name of ['malformed.svg', 'empty.svg']) {
    const imported = await importFixture(name);
    assert.ok(!imported.status.startsWith('Loaded '), `${name}: unexpectedly imported empty or invalid content`);
    assert.match(imported.status, /svg|valid|empty|visible|shape|filled|artwork|draw|geometry/i, `${name}: missing useful error: ${imported.status}`);
    console.log(`PASS ${name}: ${imported.status}`);
  }
  assert.deepEqual(await evaluate(() => window.__svgErrors), []);
}

require('../desktop/main.cjs');
