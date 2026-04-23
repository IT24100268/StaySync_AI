import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  BadgeCheck,
  Mail,
  Shield,
  User,
} from "lucide-react";
import GlassCard from "./components/GlassCard";

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

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

  return (
    <div className="max-w-6xl space-y-6">

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
                  Account Settings
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">Account Information</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the basic details attached to your admin identity.
                </p>
              </div>
              <div className="rounded-[22px] border border-violet-100 bg-violet-50/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500">Profile State</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Read only</p>
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
                    disabled
                    className="w-full rounded-2xl border border-[#e4ebf5] bg-slate-100 px-4 py-3 outline-none cursor-not-allowed opacity-80"
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
                    disabled
                    className="w-full rounded-2xl border border-[#e4ebf5] bg-slate-100 px-4 py-3 outline-none cursor-not-allowed opacity-80"
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
                      Username and email are managed by the system administrator and cannot be changed here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
