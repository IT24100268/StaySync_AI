import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCcw,
  Search,
  Shield,
  ShieldOff,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import api from "../../services/api";

const roleToneMap = {
  student: "bg-blue-100 text-blue-700",
  hostel_owner: "bg-orange-100 text-orange-700",
  restaurant_owner: "bg-emerald-100 text-emerald-700",
  delivery: "bg-violet-100 text-violet-700",
};

const normalizeRole = (value) => String(value || "").replace(/_/g, " ");

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SummaryCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StatusPill({ user }) {
  const isNonStudent = ['hostel_owner', 'restaurant_owner', 'delivery'].includes(user.user_type);
  if (!user.is_approved && !user.is_blocked && !isNonStudent) {
    return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Pending Approval</span>;
  }
  if (user.is_blocked) {
    return <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Blocked</span>;
  }
  return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>;
}

function UserActionModal({ selectedUser, actionType, reason, setReason, submitting, onClose, onConfirm }) {
  if (!selectedUser || !actionType) return null;

  const titleMap = {
    block: "Block User",
    unblock: "Unblock User",
    warn: "Warn User",
  };

  const descriptionMap = {
    block: "This will prevent the user from actively using the platform until they are unblocked.",
    unblock: "This will restore the user's account access.",
    warn: "This adds an admin warning to the user's profile history.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-24px_rgba(15,23,42,0.5)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Admin Action</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{titleMap[actionType]}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{descriptionMap[actionType]}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{selectedUser.username}</p>
          <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${roleToneMap[selectedUser.user_type] || "bg-slate-100 text-slate-700"}`}>
              {normalizeRole(selectedUser.user_type)}
            </span>
            <StatusPill user={selectedUser} />
          </div>
        </div>

        {actionType !== "unblock" ? (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {actionType === "block" ? "Reason for blocking" : "Warning note"}
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder={actionType === "block" ? "Explain why this user is being blocked..." : "Add a short admin warning note..."}
            />
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={submitting || (actionType !== "unblock" && !reason.trim())}
            className="flex-1 rounded-2xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Confirm Action"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users/");
      setUsers(data.results || data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const isNonStudent = (u) => ['hostel_owner', 'restaurant_owner', 'delivery'].includes(u.user_type);
    return {
      total: users.length,
      active: users.filter((u) => !u.is_blocked && (u.is_approved || isNonStudent(u))).length,
      pending: users.filter((u) => !u.is_approved && !u.is_blocked && u.user_type === 'student').length,
      blocked: users.filter((u) => u.is_blocked).length,
      warned: users.filter((u) => (u.warnings_count || 0) > 0).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.username, user.email, user.profile?.restaurant_name, user.profile?.hostel_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      // For non-student roles, treat unapproved-but-not-blocked as active
      // (they are managed in their own approval panels)
      const isNonStudent = ['hostel_owner', 'restaurant_owner', 'delivery'].includes(user.user_type);
      const effectiveStatus = user.is_blocked
        ? 'blocked'
        : !user.is_approved && !isNonStudent
        ? 'pending'
        : 'active';

      const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
      const matchesRole = roleFilter === 'all' || user.user_type === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const openAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setReason("");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
    setReason("");
  };

  const handleAction = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      if (actionType === "block") {
        await api.patch(`/admin/users/${selectedUser.id}/block/`, { block_reason: reason });
      } else if (actionType === "unblock") {
        await api.patch(`/admin/users/${selectedUser.id}/unblock/`);
      } else if (actionType === "warn") {
        await api.patch(`/admin/users/${selectedUser.id}/warn/`, { warning_note: reason });
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("User action failed", error);
      alert("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to approve user:", error);
      alert("Approve failed");
    }
  };

  const rejectUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/block/`, { block_reason: "Registration rejected by admin." });
      fetchUsers();
    } catch (error) {
      console.error("Failed to reject user:", error);
      alert("Reject failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Users" value={summary.total} subtitle="Everyone currently on the platform" icon={Users} accent="bg-gradient-to-r from-indigo-600 to-sky-500" />
        <SummaryCard title="Active Users" value={summary.active} subtitle="Approved and not blocked" icon={CheckCircle2} accent="bg-gradient-to-r from-emerald-600 to-teal-500" />
        <SummaryCard title="Pending Approval" value={summary.pending} subtitle="Accounts waiting for admin review" icon={UserCheck} accent="bg-gradient-to-r from-amber-500 to-orange-500" />
        <SummaryCard title="Risk Watch" value={summary.blocked + summary.warned} subtitle={`${summary.blocked} blocked • ${summary.warned} warned`} icon={Shield} accent="bg-gradient-to-r from-slate-800 to-slate-600" />
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">User Directory</h2>
              <p className="mt-1 text-sm text-slate-500">Built for moderation, approvals, and quick identity checks.</p>
            </div>

            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 transition hover:bg-white"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by username, email, hostel, or restaurant..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <Filter size={16} />
                Filters
              </span>
              {[
                ["all", "All"],
                ["active", "Active"],
                ["pending", "Pending"],
                ["blocked", "Blocked"],
              ].map(([value, label]) => (
                <FilterChip key={value} active={statusFilter === value} label={label} onClick={() => setStatusFilter(value)} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All roles"],
              ["student", "Students"],
              ["hostel_owner", "Hostel owners"],
              ["restaurant_owner", "Restaurant owners"],
              ["delivery", "Delivery"],
            ].map(([value, label]) => (
              <FilterChip key={value} active={roleFilter === value} label={label} onClick={() => setRoleFilter(value)} />
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,2.3fr)_300px]">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[minmax(320px,1.6fr)_150px_130px_120px_210px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  <span>User</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span>Warnings</span>
                  <span>Actions</span>
                </div>

                <div className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-base font-semibold text-slate-700">No users match the current filters.</p>
                    <p className="mt-2 text-sm text-slate-500">Try widening the search or switching status filters.</p>
                  </div>
              ) : (
                filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="grid grid-cols-[minmax(320px,1.6fr)_150px_130px_120px_210px] items-center gap-4 rounded-none px-6 py-5 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-900 text-sm font-black uppercase text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                        {getInitials(user.username)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-black tracking-tight text-slate-900">{user.username}</p>
                          {!user.is_approved && user.user_type === 'student' ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                              Needs review
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                        {user.profile?.restaurant_name || user.profile?.hostel_name ? (
                          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                            {user.profile?.restaurant_name || user.profile?.hostel_name}
                          </p>
                        ) : null}
                        {user.profile?.phone_number ? (
                          <p className="mt-1 text-xs text-slate-400">{user.profile.phone_number}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${roleToneMap[user.user_type] || "bg-slate-100 text-slate-700"}`}>
                        {normalizeRole(user.user_type)}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <StatusPill user={user} />
                    </div>

                    <div className="flex items-center">
                      <div className="min-w-[104px] rounded-2xl bg-slate-50 px-3 py-3 text-center ring-1 ring-slate-100">
                        <p className="text-2xl font-black text-slate-900 leading-none">{user.warnings_count ?? 0}</p>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Warnings</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!user.is_approved && user.user_type === 'student' ? (
                        <>
                          <button
                            onClick={() => approveUser(user.id)}
                            className="rounded-2xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectUser(user.id)}
                            className="rounded-2xl bg-rose-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {user.is_blocked ? (
                        <button
                          onClick={() => openAction(user, "unblock")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <ShieldOff size={15} />
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => openAction(user, "block")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                        >
                          <Shield size={15} />
                          Block
                        </button>
                      )}

                      <button
                        onClick={() => openAction(user, "warn")}
                        className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                      >
                        <AlertTriangle size={15} />
                        Warn
                      </button>
                    </div>
                  </article>
                ))
              )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-[#111827] p-6 text-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.5)]">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-200">Moderation Snapshot</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight">Safety balance</h3>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Accounts waiting for review</p>
                  <p className="mt-2 text-3xl font-black">{summary.pending}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Users with warning history</p>
                  <p className="mt-2 text-3xl font-black">{summary.warned}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <UserCog size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Useful Breakdown</h3>
                  <p className="text-sm text-slate-500">Role distribution at a glance.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {["student", "hostel_owner", "restaurant_owner", "delivery"].map((role) => {
                  const count = users.filter((user) => user.user_type === role).length;
                  return (
                    <div key={role} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${roleToneMap[role] || "bg-slate-100 text-slate-700"}`}>
                          {normalizeRole(role)}
                        </span>
                        <span className="text-lg font-black text-slate-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      )}

      <UserActionModal
        selectedUser={selectedUser}
        actionType={actionType}
        reason={reason}
        setReason={setReason}
        submitting={submitting}
        onClose={closeModal}
        onConfirm={handleAction}
      />
    </div>
  );
}
