@echo off
echo 🚀 Setting up Co-Edit Development Environment

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create uploads directory if it doesn't exist
if not exist "uploads\" (
    echo 📁 Creating uploads directory...
    mkdir uploads
    echo # Uploads directory for file storage > uploads\.gitkeep
)

REM Check environment file
if not exist ".env.local" (
    echo ⚠️  .env.local not found. Please create it with required environment variables:
    echo    - MONGODB_URI
    echo    - NEXTAUTH_SECRET
    echo    - NEXTAUTH_URL
    echo    - GOOGLE_CLIENT_ID
    echo    - GOOGLE_CLIENT_SECRET
    echo    - WS_SERVER_PORT
) else (
    echo ✅ Environment file found
)

echo.
echo 🎉 Setup complete!
echo.
echo To start development:
echo 1. Start MongoDB
echo 2. Terminal 1: npm run dev
echo 3. Terminal 2: npm run ws-server
echo.
echo Then visit http://localhost:3000

pause