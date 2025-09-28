#!/bin/bash

# Co-Edit WebSocket Server Deployment Script

echo "🚀 Co-Edit WebSocket Server Deployment Helper"
echo "============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Navigate to websocket server directory
cd websocket-server

echo "📋 Available deployment options:"
echo "1. Railway (Recommended)"
echo "2. Render" 
echo "3. Heroku"
echo "4. Manual setup instructions"

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo "🚂 Deploying to Railway..."
        railway login
        railway new co-edit-websocket
        railway up
        echo "✅ Deployment complete!"
        echo "📋 Your WebSocket URL will be shown in Railway dashboard"
        ;;
    2)
        echo "🎨 Render deployment instructions:"
        echo "1. Go to https://render.com"
        echo "2. Create new 'Web Service'"
        echo "3. Connect GitHub repo, set root directory to 'websocket-server'"
        echo "4. Set build command: npm install"
        echo "5. Set start command: npm start"
        ;;
    3)
        echo "🟣 Heroku deployment instructions:"
        echo "1. Install Heroku CLI"
        echo "2. Run: heroku create your-websocket-app"
        echo "3. Run: git init && git add . && git commit -m 'Initial commit'"
        echo "4. Run: heroku git:remote -a your-websocket-app"
        echo "5. Run: git push heroku main"
        ;;
    4)
        echo "📚 Manual deployment instructions:"
        echo ""
        echo "Deploy the websocket-server folder to any Node.js hosting service:"
        echo "- Set NODE_ENV=production"
        echo "- Run: npm install && npm start"
        echo "- Ensure WebSocket connections are allowed"
        echo "- Copy the deployment URL and add to your main app as NEXT_PUBLIC_WS_URL"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next steps:"
echo "1. Copy your WebSocket server URL"
echo "2. Add it to your main app's environment variables:"
echo "   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.railway.app"
echo "3. Redeploy your main application"
echo ""
echo "✅ Done! Your collaborative editing should now work across devices."