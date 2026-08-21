import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../lib/api';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import FormField from '../ui/FormField';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      navigate('/forgot-password/verify');
    } catch (err) {
      setError(err.message || 'Could not send a reset code. Please try again.');
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
        <h1 className="font-display font-bold text-2xl mb-1">Reset your password</h1>
        <p className="text-sm text-ink-500 mb-6">
          Enter the email on your account and we'll send you a 5-digit code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            type="email"
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="you@example.com"
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Sending code…' : 'Send reset code'}
          </Button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-mint-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
