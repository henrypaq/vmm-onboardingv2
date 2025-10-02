export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Privacy Policy for Vast Onboarding Platform
          </h1>
          
          <p className="text-sm text-gray-600 mb-8 text-center">
            Last updated: October 2, 2025
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Who we are
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The Vast Onboarding Platform ("the App") is operated by Vast Brands LLC. 
                You can reach us at <a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">info@vastmediamarketing.co.uk</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Data we collect
              </h2>
              <p className="text-gray-700 leading-relaxed">
                When you connect your accounts through the App, we receive limited information via official APIs from Google, Meta, TikTok, and Shopify. 
                The data collected is limited to account identifiers, metadata, and other information strictly necessary to verify ownership and list assets.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How we use your data
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use this information only to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4 space-y-2">
                <li>Allow you to connect your business accounts (Google, Meta, TikTok, Shopify).</li>
                <li>Display your connected accounts in the App.</li>
                <li>Verify ownership and configuration of those accounts.</li>
                <li>Provide a unified onboarding experience.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We do not sell, rent, or share your data with third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Platform-specific data collection and use
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Google APIs
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We request access to the following Google APIs and scopes:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4 space-y-1">
                  <li>Google Ads API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/adwords</code>) – list Google Ads accounts.</li>
                  <li>Google Analytics API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/analytics.readonly</code>) – list GA4 accounts/properties and display a simple read-only report.</li>
                  <li>Google Tag Manager API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/tagmanager.readonly</code>) – list GTM accounts and containers.</li>
                  <li>Google Search Console API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/webmasters.readonly</code>) – list verified websites.</li>
                  <li>Google Business Profile API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/business.manage</code>) – list business locations.</li>
                  <li>Google Merchant API (<code className="bg-gray-100 px-2 py-1 rounded text-sm">https://www.googleapis.com/auth/content</code>) – list Merchant Center accounts.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> All data is read-only unless no read-only scope exists (GBP, Merchant). We do not edit or modify assets.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke access anytime via your Google Security Settings.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Meta APIs (Facebook & Instagram)
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We request access to the following Meta APIs and scopes:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4 space-y-1">
                  <li>Marketing API: <code className="bg-gray-100 px-2 py-1 rounded text-sm">ads_read</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">ads_management</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">business_management</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">catalog_management</code> – list Ad Accounts, Catalogs, and Datasets.</li>
                  <li>Pages API: <code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_show_list</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_read_engagement</code>, <code className="bg-gray-100 px-2 py-1 rounded text-sm">pages_manage_posts</code> – list and verify Facebook Pages, and manage post access.</li>
                  <li>Instagram Graph API: <code className="bg-gray-100 px-2 py-1 rounded text-sm">instagram_basic</code> – verify linked Instagram Business accounts.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> Access is limited to listing and verifying assets; we do not post or manage content.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke access anytime via your Facebook Business Settings.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  TikTok APIs
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We request access to the following TikTok Business APIs:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4 space-y-1">
                  <li>Business Assets API – list Advertiser Accounts, Catalogs, Pixels, and Audiences.</li>
                  <li>Advertiser API – read access to advertiser accounts.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> Data is used only to list and verify connected advertiser assets.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke access anytime via your TikTok Business Center.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Shopify
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  The App requests collaborator access to your Shopify store using your Store ID and Collaborator Code.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Permissions requested:</strong> Orders, Products, Customers, Apps & Channels, and Store Settings.
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Use:</strong> Data is accessed only to verify store connection and provide onboarding support.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Revocation:</strong> You may revoke collaborator access anytime in Shopify Admin → Users and Permissions.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data storage & security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                OAuth tokens and collaborator codes are stored securely, encrypted in transit and at rest.
                No raw credentials are shared with third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Children's privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The App is not directed to children under 13 and does not knowingly collect personal data from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                📧 <a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">info@vastmediamarketing.co.uk</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
