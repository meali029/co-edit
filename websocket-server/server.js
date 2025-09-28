const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.PORT || process.env.WS_SERVER_PORT || 1234;

console.log('🚀 Starting Y.js WebSocket server...');

const wss = new WebSocket.Server({ 
  port: PORT,
  // Add CORS headers for cross-origin requests
  verifyClient: (info) => {
    // Allow all origins in development/production
    return true;
  }
});

wss.on('connection', (ws, req) => {
  console.log('📡 New WebSocket connection from:', req.headers.origin || 'unknown');
  
  try {
    setupWSConnection(ws, req);
  } catch (error) {
    console.error('❌ Error setting up WebSocket connection:', error);
    ws.close();
  }
});

wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
});

wss.on('close', () => {
  console.log('🔌 WebSocket server closed');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

console.log(`✅ Y.js WebSocket server running on port ${PORT}`);
console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);

// Health check endpoint for deployment platforms
if (process.env.NODE_ENV === 'production') {
  const http = require('http');
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  const healthPort = parseInt(PORT) + 1;
  healthServer.listen(healthPort, () => {
    console.log(`🏥 Health check server running on port ${healthPort}`);
  });
}