import React, { useEffect } from 'react';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#0B1F2A] tracking-[-0.5px] mb-4">
          Contact RoomVibe
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-xl">
          If you have a question about RoomVibe, your account, or how the platform works, feel free to reach out. We're happy to help.
        </p>

        <div className="space-y-8">
          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#C9A24A] mb-3">
              General Inquiries
            </h2>
            <a
              href="mailto:contact@roomvibe.app"
              className="text-xl font-medium text-[#0B1F2A] hover:text-[#264C61] transition-colors"
            >
              contact@roomvibe.app
            </a>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#C9A24A] mb-3">
              Support
            </h2>
            <a
              href="mailto:support@roomvibe.app"
              className="text-xl font-medium text-[#0B1F2A] hover:text-[#264C61] transition-colors"
            >
              support@roomvibe.app
            </a>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Need help with your account, artwork uploads, studio tools, or exhibitions? Email our support team and we'll assist you as soon as possible.
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          We usually respond as soon as possible during business days.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <a
            href="#/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0B1F2A] text-white text-sm font-semibold hover:bg-[#264C61] transition-colors"
          >
            Back to Homepage
          </a>
          <a
            href="#/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 text-[#0B1F2A] text-sm font-semibold hover:border-[#0B1F2A] transition-colors"
          >
            View Pricing
          </a>
        </div>
      </div>
    </main>
  );
}
