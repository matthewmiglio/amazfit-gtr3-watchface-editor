const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PREVIEW_DIR = path.resolve(__dirname, '..', 'preview');
const DEFAULT_PORT = 3456;
const WS_PORT = 3457;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function run(positional, flags) {
  const projectDir = positional[0] ? path.resolve(positional[0]) : null;
  const port = parseInt(flags.port) || DEFAULT_PORT;
  const mockFile = flags.mock ? path.resolve(flags.mock) : null;

  // --- HTTP Server ---
  const server = http.createServer((req, res) => {
    let filePath;
    const urlPath = req.url.split('?')[0];

    if (urlPath === '/' || urlPath === '/index.html') {
      filePath = path.join(PREVIEW_DIR, 'index.html');
    } else {
      // Try preview dir first, then project dir
      filePath = path.join(PREVIEW_DIR, urlPath);
      if (!fs.existsSync(filePath) && projectDir) {
        filePath = path.join(projectDir, urlPath);
      }
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`\n  Watchface Preview Server`);
    console.log(`  ────────────────────────`);
    console.log(`  Preview:   http://localhost:${port}`);
    console.log(`  WebSocket: ws://localhost:${WS_PORT}`);
    if (projectDir) {
      console.log(`  Project:   ${projectDir}`);
    }
    console.log(`\n  Open the URL above in your browser.\n`);
  });

  // --- WebSocket Server (hot reload) ---
  const wss = new WebSocketServer({ port: WS_PORT });
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('  [ws] Client connected');

    // Send initial code if project specified
    if (projectDir) {
      const watchfacePath = findWatchfaceEntry(projectDir);
      if (watchfacePath) {
        const code = fs.readFileSync(watchfacePath, 'utf-8');
        ws.send(JSON.stringify({ type: 'reload', code }));
      }
    }

    // Load custom mock data if provided
    if (mockFile && fs.existsSync(mockFile)) {
      try {
        const mockData = JSON.parse(fs.readFileSync(mockFile, 'utf-8'));
        for (const [sensor, data] of Object.entries(mockData)) {
          ws.send(JSON.stringify({ type: 'sensor-update', sensor, data }));
        }
      } catch (e) {
        console.error('  [mock] Error loading mock data:', e.message);
      }
    }

    ws.on('close', () => clients.delete(ws));
  });

  function broadcast(msg) {
    const payload = JSON.stringify(msg);
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }

  // --- File Watcher (hot reload) ---
  if (projectDir) {
    try {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(projectDir, {
        ignored: /(^|[\/\\])\.|node_modules|dist/,
        persistent: true,
        ignoreInitial: true,
      });

      watcher.on('change', (filePath) => {
        console.log(`  [watch] Changed: ${path.relative(projectDir, filePath)}`);

        if (filePath.endsWith('.js')) {
          const watchfacePath = findWatchfaceEntry(projectDir);
          if (watchfacePath) {
            const code = fs.readFileSync(watchfacePath, 'utf-8');
            broadcast({ type: 'reload', code });
          }
        }

        if (filePath.endsWith('.json') && filePath.includes('sensor.config')) {
          try {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            broadcast({ type: 'config-update', config });
          } catch (e) {
            // ignore parse errors during editing
          }
        }
      });

      console.log('  [watch] Watching for file changes...');
    } catch (e) {
      console.log('  [watch] Install chokidar for hot reload: npm install');
      console.log('          Continuing without file watching.\n');
    }
  }
}

function findWatchfaceEntry(projectDir) {
  // Try standard Zepp OS paths
  const candidates = [
    path.join(projectDir, 'watchface', 'gtr-3', 'index.js'),
    path.join(projectDir, 'watchface', 'default-target', 'index.js'),
    path.join(projectDir, 'watchface', 'index.js'),
    path.join(projectDir, 'index.js'),
  ];

  // Also check app.json for custom path
  const appJsonPath = path.join(projectDir, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const targets = appJson.targets || {};
      for (const target of Object.values(targets)) {
        const wfPath = target.module?.watchface?.path;
        if (wfPath) {
          candidates.unshift(path.join(projectDir, wfPath + '.js'));
        }
      }
      // v2 format
      if (appJson.module?.watchface?.path) {
        candidates.unshift(path.join(projectDir, appJson.module.watchface.path + '.js'));
      }
    } catch (e) {
      // ignore
    }
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = { run };
