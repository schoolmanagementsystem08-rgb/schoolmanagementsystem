import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || cooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.status === 200) {
        setSent(true);
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to send reset link';
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait before trying again.');
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-neutral-500 text-sm mb-6">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <button onClick={() => navigate('/login')}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-100">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-neutral-500 text-sm mt-1">Enter your email to receive a reset link</p>
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
            </div>
          </div>
          <button type="submit" disabled={loading || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : cooldown > 0 ? `Retry in ${cooldown}s` : 'Send Reset Link'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            <button type="button" onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1 text-black font-semibold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
