import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import FormField from '../ui/FormField';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Success banners from other flows redirecting here
  const justReset = location.state?.passwordReset;
  const justVerified = location.state?.emailVerified;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mint-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-[0_16px_50px_rgba(20,184,166,0.15)] p-8">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink-900 mb-8">
          <Logo size={32} />
          ShortenLink
        </Link>
        <h1 className="font-display font-bold text-2xl mb-1">Welcome back</h1>
        <p className="text-sm text-ink-500 mb-6">Log in to manage your links.</p>

        {/* Email verified banner — shown after registration OTP flow */}
        {justVerified && (
          <p className="text-sm text-mint-600 bg-mint-50 rounded-lg px-3 py-2 mb-4">
            ✓ Email verified! You can now log in.
          </p>
        )}

        {/* Password reset banner — shown after reset flow */}
        {justReset && (
          <p className="text-sm text-mint-600 bg-mint-50 rounded-lg px-3 py-2 mb-4">
            ✓ Your password has been updated. Please log in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            name="email"
            type="email"
            label="Email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-ink-900">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-mint-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-mint-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-300 focus:border-mint-400 transition-colors bg-white"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-mint-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}