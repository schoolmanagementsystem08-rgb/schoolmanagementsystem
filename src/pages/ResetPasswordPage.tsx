import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase-client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(({ error: sessionError }) => {
          if (sessionError) {
            setError('Invalid or expired reset link. Please request a new one.');
          } else {
            setReady(true);
          }
        });
      } else {
        setError('Invalid reset link. Please request a new one.');
      }
    } else if (window.location.search.includes('type=recovery') || window.location.search.includes('error=access_denied')) {
      setError('Invalid or expired reset link. Please request a new one.');
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          setError('No reset token found. Please request a new reset link.');
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      await supabase.auth.signOut();
      localStorage.clear();
      setSuccess(true);
      setLoading(false);
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Password Updated</h1>
          <p className="text-neutral-500 text-sm mb-6">Your password has been successfully reset.</p>
          <p className="text-xs text-neutral-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-100">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-neutral-500 text-sm mt-1">Must be at least 6 characters</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          {!ready && !error && (
            <div className="text-center py-4 text-neutral-400 text-sm">Verifying reset link...</div>
          )}
          {ready && (
            <>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required minLength={6} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required minLength={6} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </>
          )}
          <p className="text-center text-sm text-neutral-500">
            <button type="button" onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-1 text-black font-semibold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
