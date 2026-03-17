import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldOff, AlertTriangle, Search, RefreshCcw } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users/");
      setUsers(data.results || data || []);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

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
        await api.patch(`/admin/users/${selectedUser.id}/block/`, {
          block_reason: reason,
        });
      } else if (actionType === "unblock") {
        await api.patch(`/admin/users/${selectedUser.id}/unblock/`);
      } else if (actionType === "warn") {
        await api.patch(`/admin/users/${selectedUser.id}/warn/`, {
          warning_note: reason,
        });
      }
      closeModal();
      fetchUsers();
    } catch {
      alert("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      fetchUsers();
    } catch (e) {
      console.error("Failed to approve user:", e);
      alert("Approve failed");
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">User Management</h1>
            <p className="mt-1 text-slate-500">
              Block, unblock, warn, and approve platform users.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 font-semibold text-slate-700 transition hover:bg-white"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-[#e9eef6] bg-[#f8fbff]">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Warnings</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eef3f8]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="transition hover:bg-[#f8fbff]">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">{u.username}</div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">
                        {String(u.user_type || "").replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {!u.is_approved ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
                          Pending Approval
                        </span>
                      ) : u.is_blocked ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-700">
                          Blocked
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      {u.warnings_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {!u.is_approved && (
                          <button
                            onClick={() => approveUser(u.id)}
                            className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}

                        {u.is_blocked ? (
                          <button
                            onClick={() => openAction(u, "unblock")}
                            className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 transition hover:bg-white"
                            title="Unblock"
                          >
                            <ShieldOff size={18} className="text-emerald-700" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAction(u, "block")}
                            className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 transition hover:bg-white"
                            title="Block"
                          >
                            <Shield size={18} className="text-rose-700" />
                          </button>
                        )}

                        <button
                          onClick={() => openAction(u, "warn")}
                          className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 transition hover:bg-white"
                          title="Warn"
                        >
                          <AlertTriangle size={18} className="text-amber-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {selectedUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#dfe7f3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <h2 className="mb-2 text-2xl font-extrabold text-slate-900">
              {actionType === "block" && "Block User"}
              {actionType === "unblock" && "Unblock User"}
              {actionType === "warn" && "Warn User"}
            </h2>

            <p className="mb-4 text-slate-500">
              User: <span className="font-bold text-slate-900">{selectedUser.username}</span>
            </p>

            {actionType !== "unblock" && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {actionType === "block" ? "Block Reason" : "Warning Note"}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="Write reason..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={submitting || (actionType !== "unblock" && !reason.trim())}
                className="flex-1 rounded-2xl bg-blue-600 py-3 font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}