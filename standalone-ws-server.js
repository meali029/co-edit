const WebSocket = require('ws');

const PORT = process.env.PORT || 1234;

console.log('🚀 Starting Co-Edit WebSocket server...');

const wss = new WebSocket.Server({ 
  port: PORT,
  perMessageDeflate: {
    threshold: 1024
  }
});

// Store active documents and their connections
const documents = new Map();

wss.on('connection', (ws, req) => {
  console.log('📡 New connection from:', req.headers.origin || 'unknown');
  
  let currentRoom = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle room joining
      if (data.type === 'join-room' && data.room) {
        currentRoom = data.room;
        
        // Add connection to room
        if (!documents.has(currentRoom)) {
          documents.set(currentRoom, new Set());
        }
        documents.get(currentRoom).add(ws);
        
        console.log(`👤 Client joined room: ${currentRoom}`);
        
        // Notify client of successful join
        ws.send(JSON.stringify({ type: 'joined-room', room: currentRoom }));
        return;
      }
      
      // Broadcast message to all clients in the same room
      if (currentRoom && documents.has(currentRoom)) {
        const roomClients = documents.get(currentRoom);
        roomClients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    
    // Remove from all rooms
    if (currentRoom && documents.has(currentRoom)) {
      const roomClients = documents.get(currentRoom);
      roomClients.delete(ws);
      
      // Clean up empty rooms
      if (roomClients.size === 0) {
        documents.delete(currentRoom);
        console.log(`🧹 Cleaned up empty room: ${currentRoom}`);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

console.log(`✅ Co-Edit WebSocket server running on port ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Health check endpoint for Railway
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      connections: wss.clients.size,
      rooms: documents.size
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start HTTP server on a different port for health checks
const HTTP_PORT = process.env.HTTP_PORT || (parseInt(PORT) + 1);
server.listen(HTTP_PORT, () => {
  console.log(`💊 Health check server running on port ${HTTP_PORT}`);
});