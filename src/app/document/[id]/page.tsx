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
  collaborators: Array<{
    userId: { _id: string; name: string; email: string };
    role: string;
  }>;
  createdBy: { name: string; email: string };
  userRole: 'owner' | 'editor' | 'viewer';
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');
  const [sharing, setSharing] = useState(false);
  const [documentId, setDocumentId] = useState<string>('');
  
  // Link sharing state
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [showLinkSharing, setShowLinkSharing] = useState(false);
  const [linkRole, setLinkRole] = useState<'editor' | 'viewer'>('viewer');
  const [linkExpiry, setLinkExpiry] = useState('never');
  const [generatingLink, setGeneratingLink] = useState(false);

  // Extract the ID from params when component mounts
  useEffect(() => {
    params.then(({ id }) => setDocumentId(id));
  }, [params]);

  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else if (response.status === 404) {
        setError('Document not found');
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
  }, [documentId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && documentId) {
      fetchDocument();
    }
  }, [status, router, documentId, fetchDocument]);

  useEffect(() => {
    if (showShareModal && documentId) {
      loadShareLinks();
    }
  }, [showShareModal, documentId]);

  const handleSave = async (content: string) => {
    if (!document || document.userRole === 'viewer') return;

    try {
      await fetch(`/api/documents/${documentId}`, {
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

  const handleShare = async () => {
    if (!shareEmail.trim()) return;

    setSharing(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: shareEmail,
          role: shareRole,
        }),
      });

      if (response.ok) {
        setShareEmail('');
        setShowShareModal(false);
        await fetchDocument(); // Refresh to show new collaborator
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to share document');
      }
    } catch (error) {
      alert('An error occurred while sharing the document');
    } finally {
      setSharing(false);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/share-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: linkRole,
          expiresIn: linkExpiry === 'never' ? null : linkExpiry,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadShareLinks(); // Refresh share links
        
        // Copy link to clipboard
        navigator.clipboard.writeText(data.shareLink.url);
        alert('Share link generated and copied to clipboard!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate share link');
      }
    } catch (error) {
      alert('An error occurred while generating the share link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const loadShareLinks = useCallback(async () => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/share-link`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.shareLinks || []);
      }
    } catch (error) {
      console.error('Failed to load share links:', error);
    }
  }, [documentId]);

  const handleDeleteLink = async (token: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/share-link`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        await loadShareLinks(); // Refresh share links
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete share link');
      }
    } catch (error) {
      alert('An error occurred while deleting the share link');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Dashboard
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

  const canEdit = ['owner', 'editor'].includes(document.userRole);
  const isOwner = document.userRole === 'owner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Back
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {document.title}
              </h1>
              <span className="text-sm text-gray-500">
                ({document.fileType.toUpperCase()})
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isOwner && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Share
                </button>
              )}
              <div className="text-sm text-gray-600">
                Your role: <span className="font-medium">{document.userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <CollaborativeEditor
                  documentId={documentId}
                  initialContent={document.content}
                  onSave={handleSave}
                  readOnly={!canEdit}
                  userName={session?.user?.name}
                  isShared={false}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Collaborators</h3>
              <div className="space-y-3">
                {document.collaborators.map((collab) => (
                  <div
                    key={collab.userId._id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {collab.userId.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {collab.userId.email}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                      {collab.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Share Document</h2>
            
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setShowLinkSharing(false)}
                className={`px-4 py-2 font-medium ${
                  !showLinkSharing
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Share with People
              </button>
              <button
                onClick={() => setShowLinkSharing(true)}
                className={`px-4 py-2 font-medium ${
                  showLinkSharing
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Share with Link
              </button>
            </div>

            {!showLinkSharing ? (
              /* Email Sharing Tab */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer (Read only)</option>
                    <option value="editor">Editor (Can edit)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={sharing || !shareEmail.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sharing ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </div>
            ) : (
              /* Link Sharing Tab */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permission Level
                    </label>
                    <select
                      value={linkRole}
                      onChange={(e) => setLinkRole(e.target.value as 'editor' | 'viewer')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="viewer">Viewer (Read only)</option>
                      <option value="editor">Editor (Can edit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Expiry
                    </label>
                    <select
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="never">Never expires</option>
                      <option value="1hour">1 hour</option>
                      <option value="1day">1 day</option>
                      <option value="7days">7 days</option>
                      <option value="30days">30 days</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateLink}
                  disabled={generatingLink}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {generatingLink ? 'Generating...' : 'Generate Share Link'}
                </button>

                {/* Existing Share Links */}
                {shareLinks.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Active Share Links</h3>
                    <div className="space-y-3">
                      {shareLinks.map((link) => (
                        <div key={link.token} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              link.role === 'editor' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {link.role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                            </span>
                            <button
                              onClick={() => handleDeleteLink(link.token)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={link.url}
                              readOnly
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(link.url)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Copy
                            </button>
                          </div>
                          {link.expiresAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(link.expiresAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}