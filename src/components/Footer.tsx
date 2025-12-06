import React, { useState } from 'react';
import { useCookieConsent } from '../context/CookieConsentContext';

export function Footer() {
  const { resetConsent } = useCookieConsent();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#264C61] text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div>
            <img 
              src="/roomvibe-logo-transparent.png" 
              alt="RoomVibe" 
              className="h-16 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-white/80 text-sm mb-3">
              Visualize Art in Your Space.
            </p>
            <p className="text-white/60 text-sm">
              © 2025 RoomVibe
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#how" className="text-white/80 hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#artists" className="text-white/80 hover:text-white transition-colors">
                  For Artists
                </a>
              </li>
              <li>
                <a href="#designers" className="text-white/80 hover:text-white transition-colors">
                  For Designers
                </a>
              </li>
              <li>
                <a href="#galleries" className="text-white/80 hover:text-white transition-colors">
                  For Galleries
                </a>
              </li>
              <li>
                <a href="#/pricing" className="text-white/80 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#/register" className="text-white/80 hover:text-white transition-colors">
                  Start Free
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#about" className="text-white/80 hover:text-white transition-colors">
                  About RoomVibe
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/80 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#/terms" className="text-white/80 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#/privacy" className="text-white/80 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <button
                  onClick={resetConsent}
                  className="text-white/80 hover:text-white transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2 text-sm uppercase tracking-wide">
              Stay Inspired. Stay Ahead.
            </h4>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Get fresh updates from the worlds of art, design, and RoomVibe. Only good vibes, no spam, ever.
            </p>
            {subscribed ? (
              <p className="text-[#C9A24A] font-medium text-sm">
                Thanks for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-3 items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email…"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#E1E1E1] text-[#1A1A1A] placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#264C61] transition-colors min-h-[44px]"
                  required
                />
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center text-sm font-semibold text-white rounded-lg cursor-pointer transition-colors duration-200 ease-in-out min-h-[44px] border-none hover:bg-[#1E3C4D]"
                  style={{
                    backgroundColor: 'var(--rv-primary)',
                    padding: '12px 24px'
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
