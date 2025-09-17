'use client';

export default function TestOAuthPage() {
  const testMetaOAuth = () => {
    console.log('Testing Meta OAuth...');
    window.location.href = '/api/oauth/admin/connect/meta';
  };

  const testGoogleOAuth = () => {
    console.log('Testing Google OAuth...');
    window.location.href = '/api/oauth/admin/connect/google';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OAuth Test Page</h1>
      <p className="mb-4">This page tests the OAuth endpoints directly.</p>
      
      <div className="space-y-4">
        <button
          onClick={testMetaOAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Meta OAuth
        </button>
        
        <button
          onClick={testGoogleOAuth}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Test Google OAuth
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click &quot;Test Meta OAuth&quot; button</li>
          <li>Should redirect to Facebook login page</li>
          <li>After login, should redirect back to admin settings</li>
          <li>Check browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
}
