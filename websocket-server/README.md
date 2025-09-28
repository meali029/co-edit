# Co-Edit WebSocket Server

This is a standalone WebSocket server for the Co-Edit collaborative document editor.

## Deployment Options

### Option 1: Railway (Recommended)

1. Create account at [Railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Connect this websocket-server folder
4. Railway will automatically detect the Node.js app
5. Set environment variables:
   - `PORT` (Railway sets this automatically)
   - `NODE_ENV=production`
6. Deploy!

Your WebSocket URL will be: `wss://your-app-name.railway.app`

### Option 2: Render

1. Create account at [Render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo, set root directory to `websocket-server`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Deploy!

### Option 3: Heroku

```bash
cd websocket-server
heroku create your-websocket-app
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a your-websocket-app
git push heroku main
```

## Local Development

```bash
cd websocket-server
npm install
npm start
```

## Environment Variables

- `PORT` - Port to run the server (default: 1234)
- `NODE_ENV` - Set to "production" for production deployment

## Health Check

The server provides a health check endpoint at `/health` (HTTP port + 1) when running in production mode.

## Connecting from Co-Edit

After deploying, update your Co-Edit application's environment variables:

```env
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.railway.app
```

Or for localhost development:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:1234
```