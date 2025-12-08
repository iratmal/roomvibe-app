import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('user');
  const [success, setSuccess] = useState<string | null>(null);
  const { register, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(null);
    try {
      const data = await register(email, password, role);
      setSuccess(data.message || 'Registration successful! You are now logged in.');
      setEmail('');
      setPassword('');
      const returnToPricing = sessionStorage.getItem('returnToPricing');
      setTimeout(() => {
        if (returnToPricing) {
          sessionStorage.removeItem('returnToPricing');
          window.location.hash = '#/pricing';
        } else {
          window.location.hash = '#/dashboard';
        }
      }, 1500);
    } catch (err) {
      // Error handled by context
    }
  };

  const roles = [
    { value: 'user', label: 'User', description: 'Browse and visualize artwork' },
    { value: 'artist', label: 'Artist', description: 'Upload and manage your artwork' },
    { value: 'designer', label: 'Designer', description: 'Create custom room designs' },
    { value: 'gallery', label: 'Gallery', description: 'Manage gallery collections' },
    { value: 'admin', label: 'All-Access', description: 'Full platform access' },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
      <h2 className="text-3xl font-bold mb-2 text-center text-rv-primary">Create Account</h2>
      <p className="text-center text-rv-textMuted mb-8">Join RoomVibe today</p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-rvMd text-green-700 text-sm">
            {success}
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
            placeholder="At least 6 characters"
          />
          <p className="mt-2 text-xs text-rv-textMuted">Minimum 6 characters</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-semibold mb-2 text-rv-text">
            Account Type
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border border-rv-neutral rounded-rvMd focus:outline-none focus:ring-2 focus:ring-rv-primary focus:border-transparent transition-all bg-white"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} - {r.description}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover disabled:opacity-50 disabled:cursor-not-allowed shadow-rvSoft hover:shadow-rvElevated transition-all"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {onSwitchToLogin && (
        <p className="mt-6 text-center text-sm text-rv-textMuted">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-rv-primary hover:text-rv-primaryHover font-semibold transition-colors"
          >
            Login
          </button>
        </p>
      )}
    </div>
  );
}
