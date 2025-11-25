import React from 'react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-rv-primary tracking-[-0.5px] mb-6">Privacy Policy</h1>
        <p className="text-sm text-rv-textMuted mb-8">Last updated: November 24, 2025</p>

        <div className="space-y-6 text-rv-text">
          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, and usage data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to analyze usage patterns through tools like Google Analytics and Hotjar (only with your consent).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">3. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service. You can control cookie settings through our cookie consent banner. We use:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Google Analytics 4 (GA4) for analytics</li>
              <li>Hotjar for user behavior analysis</li>
              <li>Essential cookies for authentication and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">4. Data Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share your information with service providers who help us operate our platform, such as hosting providers and analytics services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">5. Your Rights</h2>
            <p className="leading-relaxed">
              You have the right to access, update, or delete your personal information. You can also withdraw your consent for cookies at any time through the cookie settings in our footer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">6. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@roomvibe.studio" className="text-rv-primary hover:text-rv-primaryHover underline font-semibold">
                privacy@roomvibe.studio
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
