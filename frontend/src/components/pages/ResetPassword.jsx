import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { resetPassword, getPendingResetEmail } from '../../lib/api';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import FormField from '../ui/FormField';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email] = useState(() => getPendingResetEmail());
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only reachable after the OTP step verified this email in this session
  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      errs.password = 'At least 8 characters, one uppercase letter, and one number';
    }
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword({ email, newPassword: form.password });
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.message || 'Could not update your password. Please try again.');
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
        <h1 className="font-display font-bold text-2xl mb-1">Create a new password</h1>
        <p className="text-sm text-ink-500 mb-6">Choose a new password for {email}.</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="password"
            name="password"
            type="password"
            label="New password"
            required
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            placeholder="Min 8 chars, one uppercase, one number"
          />
          <FormField
            id="confirm"
            name="confirm"
            type="password"
            label="Confirm new password"
            required
            value={form.confirm}
            onChange={handleChange}
            error={fieldErrors.confirm}
            placeholder="Re-enter your new password"
          />

          {error && (
            <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </div>
    </div>
  );
}