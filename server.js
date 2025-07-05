const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const SIGNALING_URL = process.env.SIGNALING_URL || 'ws://localhost:3000';

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;

  if (filePath === '/index.html') {
    fs.readFile(path.join(__dirname, 'public/template.html'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading template');
      }
      const rendered = data.replace('{{SIGNALING_URL}}', `"${SIGNALING_URL}"`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(rendered);
    });
    return;
  }

  // Static files
  filePath = path.join(__dirname, 'public', filePath);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }

    let contentType = 'text/plain';
    if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const wss = new WebSocket.Server({ server });
const peers = new Map();

wss.on('connection', (ws) => {
  let username = null;

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    switch (data.type) {
      case 'register':
        username = data.username;
        peers.set(username, ws);
        broadcastUserList();
        break;

      case 'offer':
      case 'answer':
      case 'candidate': {
        const target = peers.get(data.to);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({ ...data, from: username }));
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (username) {
      peers.delete(username);
      broadcastUserList();
    }
  });
});

function broadcastUserList() {
  const users = Array.from(peers.keys());
  const msg = JSON.stringify({ type: 'user_list', users });
  for (const ws of peers.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
