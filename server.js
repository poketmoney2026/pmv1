const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { trackRequest, flushNow } = require('./lib/requestCounter.cjs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try { trackRequest(req); } catch {}
    handle(req, res);
  });
  const io = new Server(server, { path: '/socket.io', cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('chat:join', (payload = {}) => {
      try {
        if (payload.room) socket.join(String(payload.room));
        if (payload.role === 'admin') socket.join('admin:all');
        if (payload.threadId) socket.join(`thread:${String(payload.threadId)}`);
      } catch {}
    });

    socket.on('chat:notify', (payload = {}) => {
      try {
        const threadId = String(payload.threadId || '');
        if (!threadId) return;
        io.to(`thread:${threadId}`).emit('chat:new', { threadId });
        io.to('admin:all').emit('chat:new', { threadId });
      } catch {}
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  const closeAndExit = async (code = 0) => {
    try { await flushNow(); } catch {}
    process.exit(code);
  };

  process.on('SIGINT', () => { void closeAndExit(0); });
  process.on('SIGTERM', () => { void closeAndExit(0); });
});
