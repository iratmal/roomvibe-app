import React from 'react';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-rv-primary font-display mb-6">Terms of Service</h1>
        <p className="text-sm text-rv-textMuted mb-8">Last updated: November 24, 2025</p>

        <div className="space-y-6 text-rv-text">
          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using RoomVibe Studio, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">2. Use of Service</h2>
            <p className="leading-relaxed">
              RoomVibe Studio provides a platform for visualizing artwork in room environments. You may use our service for personal and commercial purposes, subject to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">3. User Accounts</h2>
            <p className="leading-relaxed">
              When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">4. Content and Intellectual Property</h2>
            <p className="leading-relaxed">
              You retain all rights to content you upload. By uploading content, you grant us a license to display and process it for the purpose of providing our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">5. Prohibited Activities</h2>
            <p className="leading-relaxed">
              You may not use our service to upload illegal content, infringe on others' rights, or engage in any activity that could harm our platform or other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              RoomVibe Studio is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">7. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">8. Contact</h2>
            <p className="leading-relaxed">
              For questions about these Terms of Service, contact us at{' '}
              <a href="mailto:legal@roomvibe.studio" className="text-rv-primary hover:text-rv-primaryHover underline font-semibold">
                legal@roomvibe.studio
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-rv-neutral">
          <a href="#/" className="text-rv-primary hover:text-rv-primaryHover font-semibold">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
