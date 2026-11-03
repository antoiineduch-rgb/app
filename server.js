import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';
const root = import.meta.dirname;
const assets = { 'index.html':'text/html', 'style.css':'text/css', 'studio.js':'text/javascript', 'export-worker.js':'text/javascript', 'mesh-view.js':'text/javascript', 'app.js':'text/javascript', 'geometry.js':'text/javascript', 'THIRD_PARTY_NOTICES.txt':'text/plain' };
export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const name = pathname.endsWith('/') ? 'index.html' : basename(pathname);
      if (!(name in assets) || !['GET','HEAD'].includes(req.method)) {
        res.writeHead(404); return res.end('Not found');
      }
      const data = await readFile(resolve(root, name));
      res.writeHead(200, { 'Content-Type':assets[name]+'; charset=utf-8', 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to a free port or stop the existing server.` : `Could not start Clock Factory: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => console.log(`Clock Factory running on port ${port}`));
}
