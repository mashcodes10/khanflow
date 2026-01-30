export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: January 30, 2026</p>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
            <p>
              Welcome to Khanflow ("we," "our," or "us"). We are committed to protecting your privacy and 
              ensuring the security of your personal information. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our calendar and meeting management service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Profile information you provide</li>
              <li>Authentication credentials (OAuth tokens) for third-party services</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Calendar and Meeting Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calendar events from connected services (Google Calendar, Microsoft Outlook)</li>
              <li>Meeting details, availability, and scheduling preferences</li>
              <li>Task information from connected services (Google Tasks, Microsoft To-Do)</li>
              <li>Zoom meeting information if you connect Zoom integration</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Log data including IP address, browser type, and access times</li>
              <li>Device information and operating system</li>
              <li>Features and services you use within our application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our calendar and scheduling services</li>
              <li>Sync your calendar events and tasks across connected platforms</li>
              <li>Create and manage meeting schedules and availability</li>
              <li>Send you service-related notifications and updates</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <p className="mb-3">
              Khanflow integrates with third-party services to provide functionality. When you connect these services, 
              we may access and store information from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Services:</strong> Google Calendar, Google Tasks (with your explicit permission via OAuth)</li>
              <li><strong>Microsoft Services:</strong> Outlook Calendar, Microsoft To-Do (with your explicit permission via OAuth)</li>
              <li><strong>Zoom:</strong> Meeting creation and management (with your explicit permission via OAuth)</li>
            </ul>
            <p className="mt-3">
              These integrations use OAuth 2.0 authentication. You can revoke access at any time through your 
              account settings or the respective service provider's settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Storage and Security</h2>
            <p className="mb-3">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data is encrypted in transit using TLS/SSL</li>
              <li>Sensitive data is encrypted at rest</li>
              <li>OAuth tokens are securely stored and never exposed</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication requirements</li>
            </ul>
            <p className="mt-3">
              Your data is stored on secure servers hosted by Amazon Web Services (AWS) and Supabase, 
              which comply with industry security standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sharing and Disclosure</h2>
            <p className="mb-3">We do not sell your personal information. We may share your information only in these circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With your consent:</strong> When you explicitly authorize data sharing</li>
              <li><strong>Service providers:</strong> Third-party vendors who help us operate our service (e.g., AWS, Supabase)</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or legal process</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Protection:</strong> To protect the rights, property, or safety of Khanflow, our users, or the public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights and Choices</h2>
            <p className="mb-3">You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Revoke access:</strong> Disconnect third-party integrations at any time</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at privacy@khanflow.com or through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. 
              If you delete your account, we will delete your data within 30 days, except where we are required to retain 
              it for legal, regulatory, or security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
            <p>
              Khanflow is not intended for use by children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we become aware that a child under 13 has provided 
              us with personal information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure 
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy 
              and applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new policy on this page and updating the "Last updated" date. Your continued use of 
              Khanflow after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="mb-3">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>Email:</strong> privacy@khanflow.com</p>
              <p><strong>Website:</strong> https://khanflow.com</p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Google API Services User Data Policy</h2>
            <p className="mb-3">
              Khanflow's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p>
              Specifically, Khanflow uses the minimum scopes necessary to provide calendar and task management functionality, 
              and does not use Google user data for serving advertisements or any purposes beyond providing the 
              core scheduling and calendar services you've requested.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
