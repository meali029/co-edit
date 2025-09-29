# Deploy WebSocket Server to Railway

Follow these steps to deploy your WebSocket server to Railway:

## Step 1: Prepare WebSocket Server for Deployment

1. Create a new directory for the WebSocket server:
```bash
mkdir websocket-server
cd websocket-server
```

2. Initialize a new Node.js project:
```bash
npm init -y
```

3. Install dependencies:
```bash
npm install ws y-websocket yjs
```

4. Create `server.js`:
```javascript
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.PORT || 1234;

console.log('Starting Y.js WebSocket server...');

const wss = new WebSocket.Server({ 
  port: PORT,
  perMessageDeflate: {
    zlibDeflateOptions: {
      threshold: 1024
    }
  }
});

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  setupWSConnection(ws, req);
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log(`Y.js WebSocket server running on port ${PORT}`);
console.log('Environment:', process.env.NODE_ENV || 'development');
```

5. Update `package.json`:
```json
{
  "name": "co-edit-websocket-server",
  "version": "1.0.0",
  "description": "WebSocket server for Co-Edit collaborative editing",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "y-websocket": "^1.5.0",
    "yjs": "^13.6.10"
  }
}
```

## Step 2: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Sign up/Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your websocket-server repository
5. Railway will automatically detect it's a Node.js project
6. The app will deploy and you'll get a URL like: `https://your-app.railway.app`

## Step 3: Configure Your Main App

1. In your Vercel dashboard, add environment variable:
   - Key: `NEXT_PUBLIC_WS_URL`
   - Value: `wss://your-app.railway.app` (replace with your Railway URL)

2. Update your local `.env.local`:
```env
NEXT_PUBLIC_WS_URL=wss://your-app.railway.app
```

## Alternative: Use a Public WebSocket Service

If you prefer not to deploy your own server, you can use a public Yjs server:

```env
NEXT_PUBLIC_WS_URL=wss://demos.yjs.dev
```

**Note**: This is for testing only, not recommended for production.