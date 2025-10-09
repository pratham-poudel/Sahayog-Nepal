const http = require('http');
const app = require('./app');
require('dotenv').config();

// Initialize AML Worker
const amlWorker = require('./workers/amlWorker');
console.log('[Server] AML Worker initialized');

const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, closing gracefully...');
  await amlWorker.close();
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, closing gracefully...');
  await amlWorker.close();
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
}); 