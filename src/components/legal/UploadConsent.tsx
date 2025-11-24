import React from 'react';

export default function UploadConsent() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-rv-primary font-display mb-6">Upload Consent</h1>
        <p className="text-sm text-rv-textMuted mb-8">Last updated: November 24, 2025</p>

        <div className="space-y-6 text-rv-text">
          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">1. Content Ownership</h2>
            <p className="leading-relaxed">
              By uploading images or other content to RoomVibe Studio, you confirm that you own the rights to this content or have obtained all necessary permissions from the rights holder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">2. License Grant</h2>
            <p className="leading-relaxed">
              When you upload content, you grant RoomVibe Studio a non-exclusive, worldwide license to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Store and process your uploaded images</li>
              <li>Display your content within our visualization tools</li>
              <li>Create previews and thumbnails for platform functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">3. Content Guidelines</h2>
            <p className="leading-relaxed">
              You agree not to upload content that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Violates copyright, trademark, or other intellectual property rights</li>
              <li>Contains illegal, harmful, or offensive material</li>
              <li>Violates privacy rights or contains personal information of others</li>
              <li>Contains malware, viruses, or other harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">4. Content Removal</h2>
            <p className="leading-relaxed">
              You can delete your uploaded content at any time through your account settings. We reserve the right to remove content that violates these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">5. Data Processing</h2>
            <p className="leading-relaxed">
              Your uploaded images are processed and stored securely. We do not share your uploaded content with third parties except as necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">6. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify and hold harmless RoomVibe Studio from any claims arising from content you upload that infringes on third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-rv-primary mb-3">7. Questions</h2>
            <p className="leading-relaxed">
              If you have questions about upload consent or content policies, contact us at{' '}
              <a href="mailto:support@roomvibe.studio" className="text-rv-primary hover:text-rv-primaryHover underline font-semibold">
                support@roomvibe.studio
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
