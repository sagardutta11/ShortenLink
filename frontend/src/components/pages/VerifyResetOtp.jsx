import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { verifyPasswordResetOtp, resendPasswordResetOtp, getPendingResetEmail } from '../../lib/api';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import OtpInput from '../ui/OtpInput';

export default function VerifyResetOtp() {
  const navigate = useNavigate();
  const [email] = useState(() => getPendingResetEmail());
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 5) {
      setError('Enter all 5 digits.');
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordResetOtp({ email, otp });
      navigate('/reset-password');
    } catch (err) {
      setError(err.message || 'Could not verify that code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setResending(true);
    try {
      await resendPasswordResetOtp();
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
        <h1 className="font-display font-bold text-2xl mb-1">Enter your code</h1>
        <p className="text-sm text-ink-500 mb-1">We sent a 5-digit code to</p>
        <p className="text-sm font-medium text-ink-900 mb-6">{email}</p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <OtpInput length={5} value={otp} onChange={setOtp} error={error} />

          {notice && !error && (
            <p className="text-xs text-mint-600 bg-mint-50 rounded-lg px-3 py-2">{notice}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Verifying…' : 'Verify code'}
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
          <Link to="/forgot-password" className="text-mint-600 font-medium hover:underline">
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}
