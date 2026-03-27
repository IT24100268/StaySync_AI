import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  BadgeCheck,
  KeyRound,
  Mail,
  PencilLine,
  Save,
  Shield,
  User,
} from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user || null);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [message, setMessage] = useState("");

  const handleStartEditing = () => {
    setMessage("");
    setEditing(true);
  };

  useEffect(() => {
    setProfile(user || null);
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
    });
  }, [user]);

  const initials = useMemo(
    () => String(profile?.username || user?.username || "AD").slice(0, 2).toUpperCase(),
    [profile, user]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || user?.username || "",
      email: profile?.email || user?.email || "",
    });
    setEditing(false);
    setMessage("");
  };

  const handleSave = async () => {
    setMessage("");

    try {
      const { data } = await api.put("/auth/profile/", {
        username: formData.username,
        email: formData.email,
      });

      setProfile(data);
      updateUser(data);
      setFormData({
        username: data?.username || "",
        email: data?.email || "",
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
    <div className="max-w-6xl space-y-6">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.45fr]">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative rounded-[30px] bg-[linear-gradient(180deg,#f8f7ff_0%,#eef2ff_100%)] p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),transparent_65%)]" />
            <div className="relative">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-[linear-gradient(135deg,#201235_0%,#4f46e5_100%)] text-2xl font-black text-white shadow-[0_24px_50px_-28px_rgba(79,70,229,0.8)]">
                {initials}
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{profile?.username || user?.username || "Administrator"}</h2>
                <p className="mt-1 text-sm text-slate-500">Full system access</p>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                      <BadgeCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Role</p>
                      <p className="mt-1 font-bold text-slate-900">Administrator</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Username</p>
                      <p className="mt-1 break-words font-bold text-slate-900">{profile?.username || user?.username || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <Mail size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Email</p>
                      <p className="mt-1 break-words font-bold text-slate-900">{profile?.email || user?.email || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Security profile</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Your administrator account controls approvals, logs, users, and platform oversight.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="rounded-[30px] bg-white p-6 md:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-violet-700">
                  <KeyRound size={12} />
                  Account Settings
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">Account Information</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the basic details attached to your admin identity.
                </p>
              </div>
              <div className="rounded-[22px] border border-violet-100 bg-violet-50/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500">Profile State</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{editing ? "Editing enabled" : "Ready to review"}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <User size={16} />
                    Username
                  </label>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full rounded-2xl border border-[#e4ebf5] bg-white px-4 py-3 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-80"
                    placeholder="Enter username"
                  />
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full rounded-2xl border border-[#e4ebf5] bg-white px-4 py-3 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-80"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-violet-100 bg-[linear-gradient(135deg,#f8f5ff_0%,#eef2ff_100%)] p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Security Note</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      These changes update your visible administrator details. Keep your email accurate so security notices and platform updates reach you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#3b2a67_0%,#4f46e5_100%)] px-6 py-3 font-semibold text-white shadow-[0_20px_38px_-20px_rgba(79,70,229,0.85)] transition hover:-translate-y-0.5"
                    >
                      <Save size={18} />
                      Save Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#3b2a67_0%,#4f46e5_100%)] px-6 py-3 font-semibold text-white shadow-[0_20px_38px_-20px_rgba(79,70,229,0.85)] transition hover:-translate-y-0.5"
                  >
                    <PencilLine size={18} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
