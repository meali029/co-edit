# 🚀 Quick Fix: Enable Real-time Collaboration in Production

## Immediate Solution (5 minutes)

### Step 1: Add Environment Variable to Vercel
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your co-edit project
3. Go to Settings → Environment Variables
4. Add a new variable:
   - **Name**: `NEXT_PUBLIC_WS_URL`
   - **Value**: `wss://demos.yjs.dev`
   - **Environment**: Production

### Step 2: Redeploy
1. Go to Deployments tab
2. Click "..." on the latest deployment
3. Click "Redeploy"

**✅ This will immediately fix real-time collaboration using a public test server.**

---

## Production Solution (15 minutes)

### Deploy Your Own WebSocket Server to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up

2. **Create New Project**:
   - Click "New Project" 
   - Select "Empty Project"

3. **Deploy WebSocket Server**:
   - Copy the contents of `standalone-ws-server.js` 
   - Copy the contents of `ws-package.json` (rename to `package.json`)
   - Create a new GitHub repo with these files
   - Connect Railway to your GitHub repo

4. **Get Your WebSocket URL**:
   - Railway will give you a URL like: `co-edit-ws-production.up.railway.app`
   - Your WebSocket URL will be: `wss://co-edit-ws-production.up.railway.app`

5. **Update Vercel Environment**:
   - Change `NEXT_PUBLIC_WS_URL` to: `wss://your-railway-app.up.railway.app`
   - Redeploy

### Alternative: Deploy to Render (Free Tier)

1. Go to [render.com](https://render.com)
2. Create "Web Service"
3. Connect GitHub repo with WebSocket server files
4. Use the URL format: `wss://your-app.onrender.com`

---

## Test Your Fix

1. Open your app: https://co-edit-eta.vercel.app
2. Create/open a document
3. Look for: "🟢 Live Collaboration Active" 
4. Open the same document in another browser/device
5. Type in both - you should see real-time updates!

## Troubleshooting

- **Still shows "unavailable"?** Check browser console (F12) for WebSocket errors
- **Not syncing?** Make sure both users are on the same document URL
- **Connection fails?** The WebSocket server might be sleeping (free tiers sleep after inactivity)

## Files Created:
- `standalone-ws-server.js` - Standalone WebSocket server
- `ws-package.json` - Package.json for WebSocket server
- `railway-deploy.md` - Detailed deployment guide