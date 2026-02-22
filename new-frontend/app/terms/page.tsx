import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="landing-theme min-h-screen bg-background flex flex-col selection:bg-primary/30">
      <Navbar />

      <main className="flex-1 pt-40 pb-20">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-[#888] font-mono text-sm tracking-wide">
              Last updated: January 30, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12 text-[#A1A1AA] leading-relaxed text-lg">

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to Khanflow. By accessing or using our calendar and meeting management service ("Service"),
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
                please do not use our Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you ("User," "you," or "your") and
                Khanflow ("we," "us," or "our"). We reserve the right to update these Terms at any time, and your
                continued use of the Service constitutes acceptance of any modifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="mb-4">Khanflow provides a comprehensive calendar and meeting management platform that:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Integrates with third-party calendar services (Google Calendar, Microsoft Outlook).</li>
                <li>Manages tasks and to-do lists (Google Tasks, Microsoft To-Do).</li>
                <li>Creates and schedules meetings via Zoom integration.</li>
                <li>Provides availability management and smart scheduling suggestions.</li>
                <li>Offers voice assistant features for meeting management.</li>
              </ul>
              <p className="mt-4">
                The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any
                aspect of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts and Registration</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Account Creation</h3>
              <p className="mb-4">To use our Service, you must:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Be at least 13 years of age.</li>
                <li>Provide accurate and complete registration information.</li>
                <li>Maintain the security of your account credentials.</li>
                <li>Promptly update any changes to your account information.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Account Responsibility</h3>
              <p>
                You are responsible for all activities that occur under your account. You must immediately notify us
                of any unauthorized use of your account or any other security breach. We are not liable for any loss
                or damage arising from your failure to maintain account security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Integrations</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">OAuth Authorizations</h3>
              <p className="mb-4">
                Our Service integrates with third-party platforms using OAuth 2.0 authentication. When you connect
                these services, you authorize Khanflow to:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li><strong className="text-white font-medium">Google:</strong> Access your calendar events, tasks, and profile information.</li>
                <li><strong className="text-white font-medium">Microsoft:</strong> Access your Outlook calendar, To-Do tasks, and profile information.</li>
                <li><strong className="text-white font-medium">Zoom:</strong> Create and manage meetings on your behalf.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Third-Party Terms</h3>
              <p className="mb-4">
                Your use of integrated third-party services is subject to their respective terms of service and
                privacy policies. We are not responsible for the practices or content of third-party services.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Revoking Access</h3>
              <p>
                You may revoke Khanflow's access to any third-party service at any time through your account settings
                or the third-party service's authorization settings. Revoking access may limit or disable certain features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use Policy</h2>
              <p className="mb-4">You agree <strong className="text-white">NOT</strong> to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Violate any applicable laws, regulations, or third-party rights.</li>
                <li>Upload, transmit, or distribute malicious code, viruses, or harmful software.</li>
                <li>Engage in unauthorized access, hacking, or disruption of the Service.</li>
                <li>Impersonate any person or entity, or falsely represent your affiliation.</li>
                <li>Collect or harvest personal information of other users.</li>
                <li>Use automated systems (bots, scrapers) without our prior written consent.</li>
                <li>Interfere with or disrupt the Service or servers/networks connected to the Service.</li>
                <li>Use the Service for any commercial purpose without our explicit permission.</li>
                <li>Reverse engineer, decompile, or disassemble any aspect of the Service.</li>
              </ul>
              <p className="mt-4">
                We reserve the right to investigate violations and take appropriate action, including terminating
                your account and reporting illegal activities to law enforcement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property Rights</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Our Content</h3>
              <p className="mb-4">
                The Service, including all content, features, functionality, software, and design, is owned by
                Khanflow and protected by copyright, trademark, and other intellectual property laws. You may not
                copy, modify, distribute, or create derivative works without our prior written consent.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Your Content</h3>
              <p className="mb-4">
                You retain all rights to the calendar data, tasks, and other content you submit to the Service
                ("User Content"). By using the Service, you grant us a limited, worldwide, non-exclusive,
                royalty-free license to use, store, and process your User Content solely to provide and improve
                the Service.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Feedback</h3>
              <p>
                Any feedback, suggestions, or ideas you provide about the Service become our property, and we may
                use them without compensation or attribution to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Privacy and Security</h2>
              <p>
                Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
                <Link href="/privacy" className="text-white hover:underline underline-offset-4">Privacy Policy</Link>, which is
                incorporated into these Terms by reference. By using the Service, you consent to our data practices
                as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Payment Terms (If Applicable)</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Free and Paid Services</h3>
              <p className="mb-4">
                Khanflow may offer both free and paid subscription tiers. Paid features, pricing, and billing terms
                will be clearly communicated before you subscribe.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Billing and Renewals</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Subscription fees are billed in advance on a recurring basis (monthly or annually).</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
                <li>All fees are non-refundable except as required by law.</li>
                <li>We reserve the right to change pricing with 30 days' notice.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Cancellation</h3>
              <p>
                You may cancel your subscription at any time through your account settings. Cancellation takes
                effect at the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Service Availability and Support</h2>
              <p className="mb-4">
                While we strive to provide continuous service availability, we do not guarantee that the Service
                will be uninterrupted, error-free, or completely secure. We may perform maintenance or updates that
                temporarily affect service availability.
              </p>
              <p>
                Technical support is provided on a best-effort basis. We do not guarantee response times or
                resolution of all issues.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimers and Limitation of Liability</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Service Disclaimers</h3>
              <p className="mb-4 uppercase tracking-wide text-sm font-semibold text-[#888]">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                NON-INFRINGEMENT, OR SECURITY.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Limitation of Liability</h3>
              <p className="mb-4 uppercase tracking-wide text-sm font-semibold text-[#888]">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, KHANFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS
                INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
              <p className="uppercase tracking-wide text-sm font-semibold text-[#888]">
                IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
                PRECEDING THE CLAIM, OR $100 USD, WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Khanflow, its officers, directors, employees, and
                agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising
                from: (a) your use of the Service, (b) your violation of these Terms, (c) your violation of any rights
                of another party, or (d) your User Content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Termination</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Termination by You</h3>
              <p className="mb-4">
                You may terminate your account at any time by deleting it through your account settings or
                contacting us at support@khanflow.com.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Termination by Us</h3>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account and access to the Service, without notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2 marker:text-[#444]">
                <li>Violation of these Terms or our Acceptable Use Policy.</li>
                <li>Fraudulent, illegal, or abusive behavior.</li>
                <li>Non-payment of subscription fees (if applicable).</li>
                <li>Prolonged inactivity.</li>
                <li>At our sole discretion to protect the Service or other users.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Effects of Termination</h3>
              <p>
                Upon termination, your right to access the Service immediately ceases. We may delete your account
                data in accordance with our data retention policies. Some provisions of these Terms survive
                termination, including intellectual property rights, disclaimers, and limitation of liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Dispute Resolution</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Informal Resolution</h3>
              <p className="mb-4">
                Before filing any formal claim, you agree to contact us at legal@khanflow.com and attempt to resolve
                the dispute informally for at least 30 days.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Arbitration</h3>
              <p className="mb-4">
                Any disputes that cannot be resolved informally shall be settled through binding arbitration in
                accordance with the rules of the American Arbitration Association. The arbitration shall take place
                remotely or in a mutually agreed location.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Class Action Waiver</h3>
              <p>
                You agree to resolve disputes on an individual basis only, and waive any right to participate in
                class-action lawsuits or class-wide arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Governing Law and Jurisdiction</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the United States and the
                state in which Khanflow is incorporated, without regard to conflict of law principles. You consent
                to the exclusive jurisdiction of courts in that location for any disputes not subject to arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Miscellaneous</h2>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and
                Khanflow regarding the Service.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
                shall remain in full force and effect.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that
                right or provision.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Assignment</h3>
              <p className="mb-4">
                You may not assign or transfer these Terms or your account without our prior written consent. We may
                assign these Terms without restriction.
              </p>

              <h3 className="text-xl font-medium text-white mt-8 mb-3">Force Majeure</h3>
              <p>
                We shall not be liable for any failure or delay in performance due to circumstances beyond our
                reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, or
                government actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">16. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-[#111111] border border-white/10 p-6 rounded-lg text-sm text-[#A1A1AA]">
                <p className="mb-2"><strong className="text-white">Email:</strong> legal@khanflow.com</p>
                <p className="mb-2"><strong className="text-white">Support:</strong> support@khanflow.com</p>
                <p><strong className="text-white">Website:</strong> <Link href="/" className="text-white hover:underline">https://khanflow.com</Link></p>
              </div>
            </section>

            <section className="mt-16 pt-12 border-t border-white/10">
              <p className="text-sm text-[#888] font-mono tracking-wide uppercase">
                By using Khanflow, you acknowledge that you have read, understood, and agree to be bound by these
                Terms of Service.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
