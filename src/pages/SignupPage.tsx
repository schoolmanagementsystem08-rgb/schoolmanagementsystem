import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../lib/useAuth.tsx';

const roles = [
  { id: 'admin', label: 'Admin', desc: 'Full system access' },
  { id: 'teacher', label: 'Teacher', desc: 'Manage classes, grades, attendance' },
  { id: 'student', label: 'Student', desc: 'View grades and assignments' },
  { id: 'parent', label: 'Parent', desc: 'Monitor student progress' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError('');
    const result = await signUp(email, password, name, role);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.needsEmailConfirm) {
      setNeedsConfirm(true);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  if (needsConfirm) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-sm overflow-hidden p-8 text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-neutral-500 text-sm mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <button onClick={() => navigate('/login')}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-100">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">N</div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-neutral-500 text-sm mt-1">Join NexusEdu School System</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com" className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" required minLength={6} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button type="button" key={r.id} onClick={() => setRole(r.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r.id ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-neutral-300'
                  }`}>
                  <p className="font-bold text-sm">{r.label}</p>
                  <p className={`text-xs ${role === r.id ? 'text-white/70' : 'text-neutral-500'}`}>{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-black font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
