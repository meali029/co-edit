#!/bin/bash

echo "🚀 Setting up Co-Edit Development Environment"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
    echo "# Uploads directory for file storage" > uploads/.gitkeep
fi

# Check for MongoDB
echo "🔍 Checking for MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB:"
    echo "   - macOS: brew install mongodb/brew/mongodb-community"
    echo "   - Ubuntu: sudo apt-get install mongodb"
    echo "   - Windows: Download from https://www.mongodb.com/try/download/community"
else
    echo "✅ MongoDB found"
fi

# Check environment file
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Please create it with required environment variables:"
    echo "   - MONGODB_URI"
    echo "   - NEXTAUTH_SECRET"
    echo "   - NEXTAUTH_URL"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo "   - WS_SERVER_PORT"
else
    echo "✅ Environment file found"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "1. Start MongoDB: mongod (or brew services start mongodb-community)"
echo "2. Terminal 1: npm run dev"
echo "3. Terminal 2: npm run ws-server"
echo ""
echo "Then visit http://localhost:3000"