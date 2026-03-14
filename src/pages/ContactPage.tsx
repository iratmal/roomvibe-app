import React, { useEffect, useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) { setValidationError('Please enter your name.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Please enter a valid email address.'); return;
    }
    if (!message.trim()) { setValidationError('Please enter a message.'); return; }

    setFormState('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setFormState('success');
        setName(''); setEmail(''); setMessage('');
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  };

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

        <div className="mt-14 border-t border-gray-100 pt-12">
          <h2 className="text-2xl font-semibold text-[#0B1F2A] mb-2">Send us a message</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            If you have a question about RoomVibe, your account, or how the platform works, send us a message and we'll get back to you as soon as possible.
          </p>

          {formState === 'success' ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-[#0B1F2A] font-medium">Thanks — your message has been sent successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F2A] mb-1.5" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#0B1F2A] placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#264C61] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1F2A] mb-1.5" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#0B1F2A] placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#264C61] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1F2A] mb-1.5" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#0B1F2A] placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#264C61] transition-colors resize-none"
                />
              </div>

              {validationError && (
                <p className="text-sm text-red-600">{validationError}</p>
              )}

              {formState === 'error' && (
                <p className="text-sm text-red-600">
                  Something went wrong while sending your message. Please try again or email us directly at{' '}
                  <a href="mailto:contact@roomvibe.app" className="underline">contact@roomvibe.app</a>.
                </p>
              )}

              <button
                type="submit"
                disabled={formState === 'submitting'}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0B1F2A] text-white text-sm font-semibold hover:bg-[#264C61] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formState === 'submitting' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <a
            href="#/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 text-[#0B1F2A] text-sm font-semibold hover:border-[#0B1F2A] transition-colors"
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
