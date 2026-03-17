import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield, Save, PencilLine } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function AdminProfile() {
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
    });
    setEditing(false);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.put("/auth/profile/", {
        username: formData.username,
        email: formData.email,
      });

      setMessage("Profile updated successfully!");
      setEditing(false);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage("Failed to update profile");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Profile</h1>
            <p className="mt-1 text-slate-500">
              Manage your administrator account details and identity.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <PencilLine size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </GlassCard>

      {message && (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            message.toLowerCase().includes("success")
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <GlassCard className="p-6">
          <div className="rounded-[24px] bg-[#f3f7fc] p-5 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white shadow-sm">
              <Shield size={34} className="text-blue-600" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              {user?.username || "Administrator"}
            </h2>
            <p className="text-sm text-slate-500">Full system access</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Role
                </p>
                <p className="mt-1 font-bold text-slate-900">Administrator</p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Username
                </p>
                <p className="mt-1 font-bold text-slate-900 break-words">
                  {user?.username || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-1 font-bold text-slate-900 break-words">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Account Information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your basic admin details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User size={16} />
                  Username
                </label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-5">
              <p className="text-sm font-bold text-slate-700">Security Note</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                These changes update your visible administrator profile details.
                Make sure your email remains valid and accessible.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {editing ? (
                <>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-6 py-3 font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <PencilLine size={18} />
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}