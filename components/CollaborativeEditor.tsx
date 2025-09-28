'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  userName?: string;
  isShared?: boolean;
}

export function CollaborativeEditor({ 
  documentId, 
  initialContent = '', 
  onSave,
  readOnly = false,
  userName,
  isShared = false
}: CollaborativeEditorProps) {
  const { data: session } = useSession();
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    // Get WebSocket URL from environment or fallback to localhost
    const getWebSocketUrl = () => {
      if (typeof window !== 'undefined') {
        // Client-side: use environment variable or construct from current host
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (wsUrl) return wsUrl;
        
        // Fallback: construct WebSocket URL based on current location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NEXT_PUBLIC_WS_PORT || '1234';
        
        // For localhost, use the specified port
        if (host === 'localhost' || host === '127.0.0.1') {
          return `${protocol}//${host}:${port}`;
        }
        
        // For production, try WebSocket on same host with different port
        // This assumes you have a WebSocket server deployed
        return `${protocol}//${host}:${port}`;
      }
      return 'ws://localhost:1234'; // Server-side fallback
    };

    const wsUrl = getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    // Create WebSocket provider
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `document-${documentId}`,
      ydoc
    );

    wsProvider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
      if (status === 'connected') {
        console.log('✅ WebSocket connected successfully');
      } else if (status === 'disconnected') {
        console.log('❌ WebSocket disconnected');
      }
    });

    // Handle connection errors
    wsProvider.on('connection-error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
    };
  }, [documentId, ydoc]);

  const getUserName = () => {
    if (userName) return userName;
    if (session?.user?.name) return session.user.name;
    if (isShared) {
      // Generate a random guest name for shared documents
      const guestNames = ['Guest User', 'Visitor', 'Anonymous Editor', 'Collaborator'];
      const randomName = guestNames[Math.floor(Math.random() * guestNames.length)];
      const randomId = Math.floor(Math.random() * 1000);
      return `${randomName} ${randomId}`;
    }
    return 'Anonymous';
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      ...(provider ? [CollaborationCursor.configure({
        provider,
        user: {
          name: getUserName(),
          color: getRandomColor(),
        },
      })] : []),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onSave && !readOnly) {
        const content = editor.getHTML();
        onSave(content);
      }
    },
  }, [provider, session?.user?.name, userName, isShared]);

  // Auto-save functionality
  useEffect(() => {
    if (!editor || readOnly) return;

    const interval = setInterval(() => {
      if (onSave) {
        const content = editor.getHTML();
        onSave(content);
      }
    }, 15000); // Auto-save every 15 seconds

    return () => clearInterval(interval);
  }, [editor, onSave, readOnly]);

  if (!editor) {
    return <div className="p-4">Loading editor...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
      {/* Editor Toolbar */}
      {!readOnly && (
        <div className="border-b border-gray-300 p-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                editor.isActive('bold') 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                editor.isActive('italic') 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                editor.isActive('heading', { level: 1 }) 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                editor.isActive('heading', { level: 2 }) 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                editor.isActive('bulletList') 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              • List
            </button>
            
            <div className="ml-auto flex items-center gap-3">
              <div className={`px-3 py-2 text-xs font-medium rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`}></span>
                {isConnected ? 'Live Collaboration' : 'Solo Mode'}
              </div>
              
              {!isConnected && (
                <div className="text-xs text-gray-500 max-w-xs">
                  Real-time collaboration unavailable. Changes will be saved but not synced with other users.
                </div>
              )}
              
              {onSave && (
                <button
                  onClick={() => {
                    const content = editor.getHTML();
                    onSave(content);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-6 bg-white">
        <style jsx>{`
          :global(.ProseMirror) {
            outline: none !important;
            color: #374151 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
            line-height: 1.6 !important;
            font-size: 16px !important;
          }
          :global(.ProseMirror h1) {
            color: #111827 !important;
            font-size: 2rem !important;
            font-weight: 700 !important;
            margin: 1.5rem 0 1rem 0 !important;
          }
          :global(.ProseMirror h2) {
            color: #111827 !important;
            font-size: 1.5rem !important;
            font-weight: 600 !important;
            margin: 1.25rem 0 0.75rem 0 !important;
          }
          :global(.ProseMirror p) {
            color: #374151 !important;
            margin: 0.75rem 0 !important;
          }
          :global(.ProseMirror strong) {
            color: #111827 !important;
            font-weight: 700 !important;
          }
          :global(.ProseMirror em) {
            color: #374151 !important;
            font-style: italic !important;
          }
          :global(.ProseMirror ul) {
            color: #374151 !important;
            padding-left: 1.5rem !important;
            margin: 0.75rem 0 !important;
          }
          :global(.ProseMirror li) {
            color: #374151 !important;
            margin: 0.25rem 0 !important;
          }
          :global(.collaboration-cursor__caret) {
            border-left: 2px solid;
            border-right: 2px solid;
            margin-left: -1px;
            margin-right: -1px;
            pointer-events: none;
            position: relative;
            word-break: normal;
          }
          :global(.collaboration-cursor__label) {
            background-color: inherit;
            border-radius: 4px;
            color: #fff !important;
            font-size: 12px;
            font-weight: 600;
            left: -1px;
            line-height: normal;
            padding: 0.2rem 0.4rem;
            position: absolute;
            top: -1.8em;
            user-select: none;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] text-gray-900 focus:outline-none"
        />
      </div>
    </div>
  );
}

function getRandomColor() {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}