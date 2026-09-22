import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestRegistrationOtp } from '../../lib/api';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import FormField from '../ui/FormField';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      errs.password = 'At least 8 characters, one uppercase letter, and one number';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await requestRegistrationOtp(form);
      navigate('/register/verify');
    } catch (err) {
      setError(err.message || 'Could not send a verification code. Please try again.');
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
        <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
        <p className="text-sm text-ink-500 mb-6">
          We'll email you a code to verify it's really you before your account is created.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="name"
            name="name"
            label="Name"
            required
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
            placeholder="Your name"
          />
          <FormField
            id="email"
            name="email"
            type="email"
            label="Email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="you@example.com"
          />
          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            required
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            placeholder="Min 8 chars, one uppercase, one number"
          />

          {error && (
            <p role="alert" className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Sending code…' : 'Send verification code'}
          </Button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-mint-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}