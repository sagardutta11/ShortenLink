import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { verifyRegistrationOtp, resendRegistrationOtp, getPendingRegistrationEmail } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import OtpInput from '../ui/OtpInput';

export default function VerifyRegisterOtp() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email] = useState(() => getPendingRegistrationEmail());
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setNotice('');
  }, [otp]);

  // No pending signup in this session (e.g. direct URL visit) — send back to register
  if (!email) return <Navigate to="/register" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 5) {
      setError('Enter all 5 digits.');
      return;
    }
    setLoading(true);
    try {
      await verifyRegistrationOtp({ email, otp });
      refresh();
      navigate('/dashboard');
      // Deliberately not resetting loading here: this component is about to
      // unmount as the route changes. Re-rendering first (with the pending
      // signup already cleared) would trip the `!email` guard above and
      // redirect back to /register before the navigate takes effect.
    } catch (err) {
      setError(err.message || 'Could not verify that code. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendRegistrationOtp();
      setNotice('A new code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-mint-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-[0_16px_50px_rgba(20,184,166,0.15)] p-8 text-center">
        <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold text-ink-900 mb-8">
          <Logo size={32} />
          ShortenLink
        </Link>
        <h1 className="font-display font-bold text-2xl mb-1">Check your email</h1>
        <p className="text-sm text-ink-500 mb-1">
          We sent a 5-digit code to
        </p>
        <p className="text-sm font-medium text-ink-900 mb-6">{email}</p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <OtpInput length={5} value={otp} onChange={setOtp} error={error} />

          {notice && !error && (
            <p className="text-xs text-mint-600 bg-mint-50 rounded-lg px-3 py-2">{notice}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Verifying…' : 'Verify & create account'}
          </Button>
        </form>

        <p className="text-sm text-ink-500 mt-6">
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-mint-600 font-medium hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>

        <p className="text-sm text-ink-500 mt-3">
          Wrong email?{' '}
          <Link to="/register" className="text-mint-600 font-medium hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
