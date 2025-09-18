'use client';

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your platform configuration and preferences</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Platform Connections</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <span>Meta</span>
            </div>
              <div>
                  <h3 className="font-medium">Meta (Facebook)</h3>
            </div>
              </div>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  console.log('Connecting to Meta...');
                  window.location.href = '/api/oauth/admin/connect/meta';
                }}
              >
                Connect
              </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
}