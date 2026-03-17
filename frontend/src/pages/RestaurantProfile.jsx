import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, UtensilsCrossed, MapPin, Save } from 'lucide-react';
import api from '../services/api';

export default function RestaurantProfile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    restaurant_name: user?.profile?.restaurant_name || '',
    phone_number: user?.profile?.phone_number || '',
    address: user?.profile?.address || '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile/', {
        username: formData.username,
        email: formData.email,
        profile: {
          restaurant_name: formData.restaurant_name,
          phone_number: formData.phone_number,
          address: formData.address,
        }
      });
      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Manage your restaurant account information</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-2xl p-4 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={16} /> Username
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Mail size={16} /> Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UtensilsCrossed size={16} /> Restaurant Name
              </label>
              <input
                name="restaurant_name"
                value={formData.restaurant_name}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Phone size={16} /> Phone Number
              </label>
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin size={16} /> Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                rows="3"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-cyan-600"
                >
                  <Save size={18} /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-cyan-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
