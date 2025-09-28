'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CollaborativeEditor } from '../../../../components/CollaborativeEditor';

interface DocumentData {
  id: string;
  title: string;
  content: string;
  fileType: string;
  originalFileName?: string;
  createdBy: { name: string; email: string };
  userRole: 'editor' | 'viewer';
}

export default function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string>('');

  // Extract the token from params when component mounts
  useEffect(() => {
    params.then(({ token }) => setToken(token));
  }, [params]);

  const fetchDocument = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/shared/${token}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else if (response.status === 404) {
        setError('Document not found or link has expired');
      } else if (response.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load document');
      }
    } catch (error) {
      setError('An error occurred while loading the document');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDocument();
    }
  }, [token, fetchDocument]);

  const handleSave = async (content: string) => {
    if (!document || document.userRole === 'viewer') return;

    try {
      await fetch(`/api/shared/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Document not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600 mr-8">
                Co-Edit
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{document.title}</h1>
                <p className="text-sm text-gray-600">
                  Shared document by {document.createdBy.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm ${
                document.userRole === 'editor' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {document.userRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
              </div>

              {session ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <CollaborativeEditor
            documentId={document.id}
            initialContent={document.content}
            onSave={handleSave}
            readOnly={document.userRole === 'viewer'}
            userName={session?.user?.name}
            isShared={true}
          />
        </div>
      </main>
    </div>
  );
}