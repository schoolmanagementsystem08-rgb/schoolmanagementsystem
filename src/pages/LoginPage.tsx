import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/useAuth.tsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-100">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold">NexusEdu</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                required
              />
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="text-center text-sm">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-neutral-500 hover:text-black hover:underline">
              Forgot password?
            </button>
          </div>
          <p className="text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="text-black font-semibold hover:underline">
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
