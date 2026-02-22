import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="landing-theme min-h-screen bg-background flex flex-col selection:bg-primary/30">
      <Navbar />

      <main className="flex-1 pt-40 pb-20">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#888] font-mono text-sm tracking-wide">
              Last updated: January 30, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 text-[#A1A1AA] leading-relaxed text-lg">

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="mb-4">
                Welcome to Khanflow ("we," "our," or "us"). We are committed to protecting your privacy and
                ensuring the security of your personal information. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our calendar and meeting management service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Name and email address when you create an account.</li>
                <li>Profile information you provide.</li>
                <li>Authentication credentials (OAuth tokens) for third-party services.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Calendar and Meeting Data</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Calendar events from connected services (Google Calendar, Microsoft Outlook).</li>
                <li>Meeting details, availability, and scheduling preferences.</li>
                <li>Task information from connected services (Google Tasks, Microsoft To-Do).</li>
                <li>Zoom meeting information if you connect Zoom integration.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Log data including IP address, browser type, and access times.</li>
                <li>Device information and operating system.</li>
                <li>Features and services you use within our application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Provide, maintain, and improve our calendar and scheduling services.</li>
                <li>Sync your calendar events and tasks across connected platforms.</li>
                <li>Create and manage meeting schedules and availability.</li>
                <li>Send you service-related notifications and updates.</li>
                <li>Analyze usage patterns to enhance user experience.</li>
                <li>Detect, prevent, and address technical issues and security threats.</li>
                <li>Comply with legal obligations and enforce our Terms of Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
              <p className="mb-4">
                Khanflow integrates with third-party services to provide functionality. When you connect these services,
                we may access and store information from:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li><strong className="text-white font-medium">Google Services:</strong> Google Calendar, Google Tasks (with your explicit permission via OAuth).</li>
                <li><strong className="text-white font-medium">Microsoft Services:</strong> Outlook Calendar, Microsoft To-Do (with your explicit permission via OAuth).</li>
                <li><strong className="text-white font-medium">Zoom:</strong> Meeting creation and management (with your explicit permission via OAuth).</li>
              </ul>
              <p className="mt-4">
                These integrations use OAuth 2.0 authentication. You can revoke access at any time through your
                account settings or the respective service provider's settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Data is encrypted in transit using TLS/SSL.</li>
                <li>Sensitive data is encrypted at rest.</li>
                <li>OAuth tokens are securely stored and never exposed.</li>
                <li>Regular security audits and monitoring.</li>
                <li>Access controls and authentication requirements.</li>
              </ul>
              <p className="mt-4">
                Your data is stored on secure servers hosted by Amazon Web Services (AWS) and Supabase,
                which comply with industry security standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li><strong className="text-white font-medium">With your consent:</strong> When you explicitly authorize data sharing.</li>
                <li><strong className="text-white font-medium">Service providers:</strong> Third-party vendors who help us operate our service.</li>
                <li><strong className="text-white font-medium">Legal requirements:</strong> When required by law, court order, or legal process.</li>
                <li><strong className="text-white font-medium">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                <li><strong className="text-white font-medium">Protection:</strong> To protect the rights, property, or safety of Khanflow, our users, or the public.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights and Choices</h2>
              <p className="mb-4">You have the following rights regarding your data:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li><strong className="text-white font-medium">Access:</strong> Request a copy of your personal data.</li>
                <li><strong className="text-white font-medium">Correction:</strong> Update or correct inaccurate information.</li>
                <li><strong className="text-white font-medium">Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong className="text-white font-medium">Export:</strong> Download your data in a portable format.</li>
                <li><strong className="text-white font-medium">Revoke access:</strong> Disconnect third-party integrations at any time.</li>
                <li><strong className="text-white font-medium">Opt-out:</strong> Unsubscribe from marketing communications.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at privacy@khanflow.com or through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as your account is active or as needed to provide services.
                If you delete your account, we will delete your data within 30 days, except where we are required to retain
                it for legal, regulatory, or security purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="mb-4">
                Khanflow is not intended for use by children under 13 years of age. We do not knowingly collect
                personal information from children under 13. If we become aware that a child under 13 has provided
                us with personal information, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place to protect your data in accordance with this Privacy Policy
                and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date. Your continued use of
                Khanflow after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us at:
              </p>
              <div className="bg-[#111111] border border-white/10 p-6 rounded-lg text-sm text-[#A1A1AA]">
                <p className="mb-2"><strong className="text-white">Email:</strong> privacy@khanflow.com</p>
                <p><strong className="text-white">Website:</strong> <Link href="/" className="text-white hover:underline">https://khanflow.com</Link></p>
              </div>
            </section>

            <section className="mt-16 pt-12 border-t border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-4">Google API Services User Data Policy</h2>
              <p className="mb-4 text-sm leading-relaxed">
                Khanflow's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline underline-offset-4"
                >
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </p>
              <p className="text-sm leading-relaxed">
                Specifically, Khanflow uses the minimum scopes necessary to provide calendar and task management functionality,
                and does not use Google user data for serving advertisements or any purposes beyond providing the
                core scheduling and calendar services you've requested.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
