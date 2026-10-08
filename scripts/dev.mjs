import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {Readable} from 'node:stream';
import lead from '../api/lead.js';

const root = resolve('dist'), port = 4175;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.vtt':'text/vtt'};
createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/lead') {
      const request = new Request(url, {method:req.method, headers:req.headers, ...(!['GET','HEAD'].includes(req.method) ? {body:Readable.toWeb(req),duplex:'half'} : {})});
      const response = await lead.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    let path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path,'index.html');
    const body = await readFile(path);
    res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port,'127.0.0.1', () => console.log(`AutixAI preview: http://127.0.0.1:${port} (email disabled without server configuration)`));
