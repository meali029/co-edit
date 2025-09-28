#!/usr/bin/env node

/**
 * Simple Y.js WebSocket server
 */

const WebSocket = require('ws');
const Y = require('yjs');

const PORT = parseInt(process.env.WS_SERVER_PORT || '1234');

console.log('Starting Y.js WebSocket server...');

const wss = new WebSocket.Server({ port: PORT });

// Store documents
const docs = new Map();

wss.on('connection', (ws: any, req: any) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message: any) => {
    try {
      const data = JSON.parse(message);
      const { type, docId } = data;
      
      if (type === 'sync' && docId) {
        // Handle document sync
        if (!docs.has(docId)) {
          docs.set(docId, new Y.Doc());
        }
        
        const doc = docs.get(docId);
        
        // Broadcast to other clients
        wss.clients.forEach((client: any) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

wss.on('error', (error: any) => {
  console.error('WebSocket server error:', error);
});

console.log(`Y.js WebSocket server running on ws://localhost:${PORT}`);