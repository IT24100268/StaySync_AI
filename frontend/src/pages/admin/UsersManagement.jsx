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
        await api.patch(`/admin/users/${selectedUser.id}/block/`, { block_reason: reason });
      } else if (actionType === "unblock") {
        await api.patch(`/admin/users/${selectedUser.id}/unblock/`);
      } else if (actionType === "warn") {
        await api.patch(`/admin/users/${selectedUser.id}/warn/`, { warning_note: reason });
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-1">Block/unblock users, issue warnings, and manage platform safety.</p>
          </div>

          <button
            onClick={fetchUsers}
            className="px-4 py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold"
            title="Refresh"
          >
            <div className="flex items-center gap-2">
              <RefreshCcw size={18} />
              Refresh
            </div>
          </button>
        </div>

        <div className="mt-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50">
                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Warnings</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">{u.username}</div>
                      <div className="text-sm text-slate-700">{u.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
                        {u.user_type}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {!u.is_approved ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-extrabold">
                          Pending Approval
                        </span>
                      ) : u.is_blocked ? (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      {u.warnings_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!u.is_approved && (
                          <button
                            onClick={() => approveUser(u.id)}
                            className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 transition text-white text-xs font-extrabold"
                            title="Approve user"
                          >
                            Approve
                          </button>
                        )}
                        {u.is_blocked ? (
                          <button
                            onClick={() => openAction(u, "unblock")}
                            className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
                            title="Unblock"
                          >
                            <ShieldOff size={18} className="text-emerald-700" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAction(u, "block")}
                            className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
                            title="Block"
                          >
                            <Shield size={18} className="text-rose-700" />
                          </button>
                        )}

                        <button
                          onClick={() => openAction(u, "warn")}
                          className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
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
        <Modal onClose={closeModal}>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {actionType === "block" && "Block User"}
            {actionType === "unblock" && "Unblock User"}
            {actionType === "warn" && "Warn User"}
          </h2>

          <p className="text-slate-600 mb-4">
            User: <span className="font-bold text-slate-900">{selectedUser.username}</span>
          </p>

          {actionType !== "unblock" && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {actionType === "block" ? "Block Reason" : "Warning Note"}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/50 outline-none"
                placeholder="Write reason..."
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAction}
              disabled={submitting || (actionType !== "unblock" && !reason.trim())}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm"}
            </button>
            <button
              onClick={closeModal}
              className="flex-1 py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-3xl bg-white/65 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_rgba(2,6,23,0.25)] p-6">
        {children}
        <button onClick={onClose} className="sr-only">close</button>
      </div>
    </div>
  );
}
