import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackgroundAnimation from '../components/BackgroundAnimation';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (!email) { toast.error('Email is required'); return; }
    if (!password) { toast.error('Password is required'); return; }
    setLoading(true);
    try { await login(email, password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 relative" style={{ background: 'var(--bg-page)' }}>
      <BackgroundAnimation />
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to continue to TeamSync</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" className="text-brand font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
