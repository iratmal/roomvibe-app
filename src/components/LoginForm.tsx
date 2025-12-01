import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const returnToPricing = sessionStorage.getItem('returnToPricing');
      if (returnToPricing) {
        sessionStorage.removeItem('returnToPricing');
        window.location.hash = '#/pricing';
      } else {
        onSuccess?.();
      }
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
      <h2 className="text-3xl font-bold mb-2 text-center text-rv-primary">Welcome back</h2>
      <p className="text-center text-rv-textMuted mb-8">Login to your RoomVibe account</p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-2 text-rv-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-2 text-rv-text">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary focus:border-transparent transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover disabled:opacity-50 disabled:cursor-not-allowed shadow-rvSoft hover:shadow-rvElevated transition-all"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {onSwitchToRegister && (
        <p className="mt-6 text-center text-sm text-rv-textMuted">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-rv-primary hover:text-rv-primaryHover font-semibold transition-colors"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}
