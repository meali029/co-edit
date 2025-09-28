import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" suppressHydrationWarning={true}>
      <div className="container mx-auto px-4 py-16" suppressHydrationWarning={true}>
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Co-Edit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Collaborative document editing platform with real-time synchronization. 
            Upload, edit, and share documents with your team seamlessly.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16" suppressHydrationWarning={true}>
          <div className="bg-white rounded-lg p-6 shadow-lg" suppressHydrationWarning={true}>
            <div className="text-blue-500 mb-4" suppressHydrationWarning={true}>
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Document Upload</h3>
            <p className="text-gray-600">
              Upload .docx and .pdf files. Convert documents to editable HTML format for seamless editing.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg" suppressHydrationWarning={true}>
            <div className="text-green-500 mb-4" suppressHydrationWarning={true}>
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600">
              Multiple users can edit the same document simultaneously with live cursor tracking and changes.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg" suppressHydrationWarning={true}>
            <div className="text-purple-500 mb-4" suppressHydrationWarning={true}>
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Sharing</h3>
            <p className="text-gray-600">
              Invite collaborators with granular permissions: owner, editor, or viewer roles.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center" suppressHydrationWarning={true}>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto" suppressHydrationWarning={true}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of teams already collaborating on Co-Edit
            </p>
            <div className="space-y-3" suppressHydrationWarning={true}>
              <Link
                href="/auth/signup"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors block"
              >
                Create Account
              </Link>
              <Link
                href="/auth/signin"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500">
          <p>&copy; 2024 Co-Edit. Built with Next.js, TipTap, and Yjs.</p>
        </footer>
      </div>
    </div>
  );
}
