const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const ORIGIN = 'clock://studio';
const ASSETS = new Map([
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/studio.js', ['studio.js', 'text/javascript; charset=utf-8']],
  ['/export-worker.js', ['export-worker.js', 'text/javascript; charset=utf-8']],
]);
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "worker-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function isAppURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'clock:' && url.host === 'studio' && !url.username && !url.password;
  } catch { return false; }
}

async function appResponse(request, root) {
  if (!isAppURL(request.url) || !['GET', 'HEAD'].includes(request.method)) {
    return new Response('Not found', { status: 404 });
  }
  const url = new URL(request.url);
  const asset = ASSETS.get(url.pathname === '/' ? '/index.html' : url.pathname);
  if (!asset) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(join(root, asset[0]));
    return new Response(request.method === 'HEAD' ? null : data, {
      headers: {
        'Content-Type': asset[1],
        'Content-Security-Policy': CSP,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch { return new Response('Application asset missing. Rebuild Clock Factory.', { status: 500 }); }
}

module.exports = { ORIGIN, CSP, isAppURL, appResponse };
