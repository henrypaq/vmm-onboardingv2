export default function DataDeletionInstructions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Data Deletion Instructions
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                If you wish to request deletion of your data from the Vast Onboarding Platform, please follow the steps below:
              </p>
              
              <ol className="list-decimal list-inside text-gray-700 leading-relaxed space-y-3 mb-6">
                <li>
                  Send an email to <strong><a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">info@vastmediamarketing.co.uk</a></strong> with the subject line: <strong>"Data Deletion Request"</strong>.
                </li>
                <li>
                  Include the email address or business account ID you used to connect to the platform.
                </li>
                <li>
                  We will permanently delete all data associated with your account, including OAuth tokens and onboarding information, within 7 business days.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                Alternatively, you may revoke access directly via:
              </p>
              
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-3 mb-6">
                <li>
                  <strong>Google:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google Security Settings</a>
                </li>
                <li>
                  <strong>Meta (Facebook/Instagram):</strong> <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Facebook Business Integrations Settings</a>
                </li>
                <li>
                  <strong>TikTok:</strong> <a href="https://business.tiktokglobalshop.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">TikTok Business Center</a>
                </li>
                <li>
                  <strong>Shopify:</strong> Remove collaborator access in Shopify Admin → Users and Permissions.
                </li>
              </ul>
              
              <p className="text-gray-700 leading-relaxed">
                Once revoked, our App will no longer have access to your accounts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                For further assistance, contact us at:
              </h2>
              <p className="text-gray-700 leading-relaxed">
                📧 <a href="mailto:info@vastmediamarketing.co.uk" className="text-blue-600 hover:text-blue-800 underline">info@vastmediamarketing.co.uk</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
