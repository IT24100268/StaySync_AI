import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) {
    return 'Unable to register right now. Please try again.';
  }
  if (typeof data === 'string') {
    return data;
  }
  if (data.detail) {
    return data.detail;
  }
  const messages = Object.values(data).flat().filter(Boolean);
  return messages.length ? messages.join(' ') : 'Unable to register right now. Please try again.';
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm_password: '',
    restaurant_name: '',
    restaurant_email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Create Restaurant Account</h2>
        <p className="mt-1 text-sm text-slate-500">Start managing your restaurant with StaySync AI.</p>

        <div className="mt-5 grid gap-3">
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <input
            name="confirm_password"
            type="password"
            placeholder="Confirm Password"
            value={form.confirm_password}
            onChange={handleChange}
            minLength={8}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <input
            name="restaurant_name"
            type="text"
            placeholder="Restaurant Name"
            value={form.restaurant_name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <input
            name="restaurant_email"
            type="email"
            placeholder="Restaurant Email"
            value={form.restaurant_email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <input
            name="phone"
            type="text"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <textarea
            name="address"
            rows="3"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          {error ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-700">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
