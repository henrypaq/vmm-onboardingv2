import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions - Vast Onboarding Platform',
  description: 'Learn how to request deletion of your data from the Vast Onboarding Platform. Step-by-step instructions for removing your account and revoking API access.',
  keywords: 'data deletion, GDPR, privacy rights, account deletion, data removal, Meta API, Google API',
  openGraph: {
    title: 'Data Deletion Instructions - Vast Onboarding Platform',
    description: 'Learn how to request deletion of your data from the Vast Onboarding Platform.',
    type: 'website',
  },
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Instructions</h1>
            <p className="text-lg text-gray-600">Data Deletion Instructions for Vast Onboarding Platform</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: October 2, 2025</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                If you would like to request deletion of data collected through the Vast Onboarding Platform, 
                please follow the steps below:
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Contact Request</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Send an email to{' '}
                <a href="mailto:info@vastmediamarketing.co.uk?subject=Data Deletion Request" 
                   className="text-blue-600 hover:text-blue-800 underline">
                  info@vastmediamarketing.co.uk
                </a>{' '}
                with the subject line <strong>"Data Deletion Request."</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                Include the email address or account identifier used with the Vast Onboarding Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Verification</h2>
              <p className="text-gray-700 leading-relaxed">
                We will verify your identity to ensure the request is legitimate.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Deletion</h2>
              <p className="text-gray-700 leading-relaxed">
                Once verified, we will delete all data associated with your account from our systems, 
                including OAuth tokens and onboarding records, within <strong>30 days</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Platform-Specific Actions</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Meta Users</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  If you connected Meta (Facebook/Instagram) accounts, you may also revoke access immediately through:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    Facebook Settings → Business Integrations
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Google Users</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  If you connected Google accounts, you may also revoke access immediately through:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Google Security Settings
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium">
                  No additional data is retained after deletion.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                If you have any questions about data deletion or need assistance with the process, 
                please contact us at:
              </p>
              <p className="text-gray-700">
                📧{' '}
                <a href="mailto:info@vastmediamarketing.co.uk" 
                   className="text-blue-600 hover:text-blue-800 underline">
                  info@vastmediamarketing.co.uk
                </a>
              </p>
            </section>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Note</h3>
              <p className="text-yellow-700 text-sm">
                Data deletion is permanent and cannot be undone. Once your data is deleted, 
                you will need to go through the onboarding process again if you wish to use 
                the platform in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
