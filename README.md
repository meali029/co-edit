# Co-Edit - Collaborative Document Editor

A real-time collaborative document editing platform built with Next.js, TipTap, and Yjs. Upload, edit, and share documents with team members in real-time.

## Features

- **User Authentication**: NextAuth with Google OAuth and email/password signup
- **Document Management**: Upload .docx and .pdf files, store in local uploads folder
- **Real-time Collaboration**: Multiple users can edit documents simultaneously using Yjs CRDT
- **Document Processing**: Convert .docx to editable HTML using Mammoth, extract text from PDFs
- **Smart Sharing**: Invite collaborators with granular permissions (owner, editor, viewer)
- **Auto-save**: Automatic saving every 15 seconds and manual save functionality
- **Export**: Download edited documents as .docx or .pdf

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time Collaboration**: TipTap editor with Yjs and y-websocket
- **Document Processing**: Mammoth (docx), pdf-parse (pdf)
- **File Upload**: Multer for handling file uploads

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   └── documents/     # Document CRUD operations
│   │   ├── auth/              # Auth pages (signin, signup)
│   │   ├── dashboard/         # Document list page
│   │   ├── document/[id]/     # Document editor page
│   │   └── layout.tsx         # Root layout with AuthProvider
│   └── components/            # React components
│       ├── AuthProvider.tsx   # NextAuth session provider
│       └── CollaborativeEditor.tsx  # TipTap + Yjs editor
├── lib/                       # Utilities
│   ├── dbConnect.ts          # MongoDB connection
│   ├── fileUpload.ts         # File upload handling
│   └── documentProcessor.ts  # Document conversion utilities
├── models/                    # Mongoose schemas
│   ├── User.ts               # User model
│   └── Document.ts           # Document model with collaborators
├── ws-server/                 # WebSocket server
│   └── index.ts              # y-websocket server for real-time sync
├── uploads/                   # Local file storage (mock S3)
└── .env.local                # Environment variables
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file with the following variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/co-edit

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (replace with your credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# WebSocket server
WS_SERVER_PORT=1234
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### 4. Database Setup

Install and start MongoDB:

```bash
# macOS with Homebrew
brew install mongodb/brew/mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows: Download from mongodb.com and follow installer
```

### 5. Start Development Servers

You need to run both the Next.js app and the WebSocket server:

```bash
# Terminal 1: Start Next.js development server
npm run dev

# Terminal 2: Start WebSocket server for real-time collaboration
npm run ws-server
```

### 6. Access the Application

- **Web App**: http://localhost:3000
- **WebSocket Server**: ws://localhost:1234

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with Google
2. **Upload Documents**: Go to dashboard and upload .docx or .pdf files
3. **Edit Documents**: Click on any document to open the collaborative editor
4. **Share Documents**: Use the "Share" button to invite collaborators by email
5. **Real-time Collaboration**: Multiple users can edit simultaneously with live cursors
6. **Auto-save**: Changes are automatically saved every 15 seconds

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Documents
- `GET /api/documents` - List user's documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/[id]` - Get document details
- `PUT /api/documents/[id]` - Update document content
- `POST /api/documents/[id]/share` - Share document with collaborator
- `GET /api/documents/[id]/export` - Export document as .docx or .pdf

## Development Notes

- MongoDB models include proper indexing for performance
- File uploads are stored locally in `uploads/` directory (easily replaceable with S3)
- Yjs provides conflict-free replicated data types (CRDT) for real-time collaboration
- TipTap editor is extensible and provides rich text editing capabilities
- NextAuth handles OAuth flows and session management
- TypeScript ensures type safety across the application

## Limitations

- PDF files are read-only (text extraction only, no rich editing)
- Local file storage (not production-ready, should use cloud storage)
- No deployment configuration included
- Basic UI without external component libraries
- No testing framework included

## Contributing

This is a development-ready codebase. To extend functionality:

1. Add new TipTap extensions for additional editor features
2. Implement cloud storage (AWS S3, Google Cloud Storage)
3. Add real-time notifications
4. Implement document versioning
5. Add more authentication providers
6. Enhance export functionality with better formatting

## License

MIT License - feel free to use this code for your own projects.
