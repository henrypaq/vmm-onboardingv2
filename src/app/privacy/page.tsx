import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Vast Onboarding Platform',
  description: 'Privacy Policy for Vast Onboarding Platform. Learn how we collect, use, and protect your data when connecting Google and Meta accounts.',
  keywords: 'privacy policy, data protection, GDPR, Google API, Meta API, OAuth',
  openGraph: {
    title: 'Privacy Policy - Vast Onboarding Platform',
    description: 'Privacy Policy for Vast Onboarding Platform. Learn how we collect, use, and protect your data.',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Privacy Policy for Vast Onboarding Platform</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 10, 2025</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Who we are</h2>
              <p className="text-gray-700 leading-relaxed">
                The Vast Onboarding Platform ("the App") is operated by Vast Brands LLC. 
                You can reach us at{' '}
                <a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">
                  info@vastmediamarketing.co.uk
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data we collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you connect your accounts through the App, we receive limited information via official APIs from Google and Meta.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The data collected is limited to account identifiers, metadata, and other information strictly necessary to verify ownership and display your connected assets.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How we use your data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use this information only to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Allow you to connect your Google and Meta business accounts.</li>
                <li>Display your connected accounts and assets in the App.</li>
                <li>Verify ownership and configuration of those accounts.</li>
                <li>Provide a unified onboarding experience.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed font-medium">
                We do not sell, rent, or share your data with third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Platform-specific data collection and use</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Google APIs</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We request access to the following Google APIs and scopes:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>Google Ads API</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/adwords</code> – list and display Google Ads accounts.</li>
                  <li><strong>Google Analytics API</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/analytics.readonly</code> – display connected Analytics properties.</li>
                  <li><strong>Google Tag Manager API</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/tagmanager.readonly</code> – list GTM accounts and containers.</li>
                  <li><strong>Google Search Console API</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/webmasters.readonly</code> – display verified websites.</li>
                  <li><strong>Google Business Profile API</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/business.manage</code> – display Google Business Profile locations.</li>
                  <li><strong>Google Merchant (Content API for Shopping)</strong> – <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/content</code> – display Merchant Center accounts.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> All data is accessed in read-only mode where possible. Where no read-only scope exists (e.g. Business Profile, Merchant), data is still only used to verify connection and display assets.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke access anytime via your Google Security Settings.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Meta APIs (Facebook & Instagram)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We request access to the following Meta APIs and scopes:
                </p>
                
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Marketing API</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mb-2">
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">ads_management</code> – read connected Ad Accounts and campaigns.</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">ads_read</code> – read insights from connected Ad Accounts.</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">business_management</code> – list Business assets (datasets, catalogs).</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Pages API</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mb-2">
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_show_list</code> – list connected Pages.</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_read_engagement</code> – display Page insights.</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_manage_posts</code> – list recent posts from connected Pages.</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Instagram Graph API</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mb-2">
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">instagram_basic</code> – display connected Instagram Business accounts.</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Catalog Management</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mb-2">
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">catalog_management</code> – list connected product catalogs.</li>
                  </ul>
                </div>

                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> Data is used only to display accounts, assets, and insights to the authenticated user. The App does not create posts, manage campaigns, or modify assets.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke access anytime via your Meta Business Settings.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data storage & security</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>OAuth tokens are stored securely, encrypted in transit and at rest.</li>
                <li>No raw credentials are stored or shared with third parties.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Children's privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                The App is not directed to children under 13 and does not knowingly collect personal data from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                If you have any questions about this Privacy Policy, contact us at:
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
