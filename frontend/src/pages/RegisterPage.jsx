import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { register } = useAuth();
  const navigate = useNavigate();

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
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">

          {/* Left Side */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600/80 via-indigo-600/70 to-slate-900/80 p-10 text-white lg:flex">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur-md">
                StaySync AI
              </div>

              <h1 className="mt-8 text-4xl font-bold leading-tight">
                Create your
                <span className="block text-cyan-200">Restaurant Account</span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                Join StaySync AI and manage your restaurant, menu items, and customer orders
                with a clean and modern platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-sm font-semibold">Why register?</p>
                <p className="mt-1 text-sm text-white/75">
                  Easily manage restaurant details, update menu items, and monitor bookings in one place.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-sm font-semibold">Fast onboarding</p>
                <p className="mt-1 text-sm text-white/75">
                  Complete your account setup in minutes and start using the dashboard immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side Form */}
          <div className="bg-white/85 p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Register Now
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Fill in your restaurant details to create your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Username
                    </label>
                    <input
                      name="username"
                      type="text"
                      placeholder="Enter your username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter password (min 8 characters)"
                      value={form.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Confirm Password
                    </label>
                    <input
                      name="confirm_password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      minLength={8}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Restaurant Name
                    </label>
                    <input
                      name="restaurant_name"
                      type="text"
                      placeholder="Enter restaurant name"
                      value={form.restaurant_name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Restaurant Email
                    </label>
                    <input
                      name="restaurant_email"
                      type="email"
                      placeholder="Enter restaurant email"
                      value={form.restaurant_email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="text"
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows="4"
                      placeholder="Enter your restaurant address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}