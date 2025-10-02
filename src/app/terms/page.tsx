import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Vast Onboarding Platform',
  description: 'Terms of Service for Vast Onboarding Platform. Learn about your rights and responsibilities when using our Google and Meta account connection service.',
  keywords: 'terms of service, user agreement, Google API, Meta API, business onboarding',
  openGraph: {
    title: 'Terms of Service - Vast Onboarding Platform',
    description: 'Terms of Service for Vast Onboarding Platform. Learn about your rights and responsibilities.',
    type: 'website',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-lg text-gray-600">Terms of Service for Vast Onboarding Platform</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 10, 2025</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By using the Vast Onboarding Platform ("the App"), operated by Vast Brands LLC, you agree to these Terms of Service. 
                If you do not agree, you may not use the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Purpose of the App</h2>
              <p className="text-gray-700 leading-relaxed">
                The App allows businesses to connect and verify their accounts across Google and Meta for onboarding and management purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>You may only connect accounts you own or are authorized to manage.</li>
                <li>You must provide accurate information.</li>
                <li>You remain responsible for securing your accounts.</li>
                <li>You may not misuse the App, including unauthorized access attempts.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Usage</h2>
              <p className="text-gray-700 leading-relaxed">
                Your data is accessed only as described in our{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </a>. 
                We request only the minimal API permissions necessary to verify ownership and list accounts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. No Warranty</h2>
              <p className="text-gray-700 leading-relaxed">
                The App is provided "as is," without any warranties of any kind. We do not guarantee uninterrupted or error-free operation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by law, Vast Brands LLC shall not be liable for any damages resulting from your use of the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Changes</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update these Terms at any time. Continued use of the App indicates acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                For questions about these Terms of Service, contact:
              </p>
              <p className="text-gray-700">
                📧{' '}
                <a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">
                  info@vastmediamarketing.co.uk
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
