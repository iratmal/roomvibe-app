import React, { useEffect } from 'react';

const HELP_TOPICS = [
  'Account access',
  'Artwork upload issues',
  'Studio and visualization questions',
  'Exhibition and sharing issues',
];

export default function SupportPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#0B1F2A] tracking-[-0.5px] mb-4">
          RoomVibe Support
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-xl">
          Need help with your account, artwork uploads, studio tools, or exhibitions? We're here to help.
        </p>

        <div className="border border-gray-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#C9A24A] mb-3">
            Email Support
          </h2>
          <a
            href="mailto:support@roomvibe.app"
            className="text-xl font-medium text-[#0B1F2A] hover:text-[#264C61] transition-colors"
          >
            support@roomvibe.app
          </a>
        </div>

        <div className="mb-10">
          <h2 className="text-sm font-semibold text-[#0B1F2A] uppercase tracking-widest mb-4">
            We can help with
          </h2>
          <ul className="space-y-3">
            {HELP_TOPICS.map((topic) => (
              <li key={topic} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A24A] flex-shrink-0" />
                <span className="text-gray-700">{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-500 border-t border-gray-100 pt-8">
          For general business or partnership inquiries, please use{' '}
          <a href="mailto:contact@roomvibe.app" className="text-[#0B1F2A] hover:underline font-medium">
            contact@roomvibe.app
          </a>
        </p>

        <div className="mt-10">
          <a
            href="#/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0B1F2A] text-white text-sm font-semibold hover:bg-[#264C61] transition-colors"
          >
            Back to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}
