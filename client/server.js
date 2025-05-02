const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '.cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '.cert', 'cert.pem')),
};

app.prepare().then(() => {
  const server = createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production to specific origins
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('message', (message) => {
      console.log('Received message:', message);
      io.emit('message', message); // Broadcast to all clients
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  });

  server.listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
    console.log('> Also accessible on https://192.168.1.65:3000');
  });
});