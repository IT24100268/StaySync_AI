import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileText,
  RefreshCcw,
  Search,
  Shield,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import api from "../../services/api";

const toneByTarget = {
  USER: "bg-indigo-100 text-indigo-700",
  ROOM: "bg-orange-100 text-orange-700",
  RESTAURANT: "bg-emerald-100 text-emerald-700",
  REPORT: "bg-amber-100 text-amber-700",
  PARTNER: "bg-violet-100 text-violet-700",
};

const roleToneMap = {
  student: "bg-blue-100 text-blue-700",
  hostel_owner: "bg-orange-100 text-orange-700",
  restaurant_owner: "bg-emerald-100 text-emerald-700",
  delivery: "bg-violet-100 text-violet-700",
};

function formatRoleLabel(value) {
  return String(value || "").replace(/_/g, " ");
}

function formatTimeAgo(dateValue) {
  if (!dateValue) return "No recent activity";

  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function formatLogTimestamp(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getActorLabel(log, targetUser) {
  const userActionLabels = new Set([
    "User logged in",
    "User registered",
    "Profile updated",
    "Room booking created",
    "Food order placed",
  ]);

  if (userActionLabels.has(log.action)) {
    return formatRoleLabel(log.actor_role || targetUser?.effective_role || targetUser?.user_type || "administrator");
  }

  return formatRoleLabel(targetUser?.effective_role || targetUser?.user_type || log.actor_role || "administrator");
}

function parseDetails(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function formatLogDetails(log, details, targetUser) {
  const targetLabel = targetUser?.username || `${log.target_type} #${log.target_id}`;

  if (!details) {
    return `${log.action} on ${targetLabel}.`;
  }

  if (typeof details === "string") {
    return details;
  }

  if (details.reason) {
    return `${targetLabel} was updated. Reason: ${details.reason}`;
  }

  if (details.warning_note) {
    return `${targetLabel} received a warning. Note: ${details.warning_note}`;
  }

  if (details.review_note) {
    return `${targetLabel} was reviewed. Note: ${details.review_note}`;
  }

  if (details.admin_note) {
    return `${targetLabel} was handled by admin. Note: ${details.admin_note}`;
  }

  if (details.is_approved === true) {
    return `${targetLabel} registration was approved and access is now active.`;
  }

  if (details.is_approved === false) {
    return `${targetLabel} approval access was removed.`;
  }

  if (details.old_status && details.new_status) {
    return `${targetLabel} status changed from ${String(details.old_status).replace(/_/g, " ")} to ${String(details.new_status).replace(/_/g, " ")}.`;
  }

  if (typeof details.warnings_count === "number") {
    return `${targetLabel} warning count is now ${details.warnings_count}.`;
  }

  if (Array.isArray(details.updated_fields) && details.updated_fields.length) {
    return `${targetLabel} updated: ${details.updated_fields.join(", ")}.`;
  }

  if (details.room_title && details.status) {
    return `${targetLabel} created a booking for ${details.room_title}. Status: ${details.status}.`;
  }

  if (details.restaurant_name && details.order_type) {
    return `${targetLabel} placed a ${details.order_type} order from ${details.restaurant_name}.`;
  }

  if (details.user_type && log.action === "User logged in") {
    return `${targetLabel} logged into the platform as ${details.user_type}.`;
  }

  if (details.user_type && log.action === "User registered") {
    return `${targetLabel} registered as ${details.user_type}.`;
  }

  const entries = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`);

  if (entries.length) {
    return `${targetLabel} details: ${entries.join(" • ")}`;
  }

  return `${log.action} on ${targetLabel}.`;
}

function ActionModal({ targetUser, actionType, reason, setReason, submitting, onClose, onConfirm }) {
  if (!targetUser || !actionType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-24px_rgba(15,23,42,0.5)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">User Action</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {actionType === "warn" ? "Warn User" : targetUser.is_blocked ? "Unblock User" : "Block User"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {actionType === "warn"
                ? "Add a warning note for this user directly from the activity feed."
                : targetUser.is_blocked
                  ? "Restore access for this blocked user."
                  : "Block this user and record the reason."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{targetUser.username}</p>
          <p className="mt-1 text-sm text-slate-500">{targetUser.email}</p>
        </div>

        {(actionType === "warn" || !targetUser.is_blocked) && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {actionType === "warn" ? "Warning reason" : "Block reason"}
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder={actionType === "warn" ? "Explain this warning..." : "Explain why this user is blocked..."}
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={submitting || ((actionType === "warn" || !targetUser.is_blocked) && !reason.trim())}
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

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        api.get("/admin/logs/"),
        api.get("/admin/users/"),
      ]);
      setLogs(logsRes.data.results || logsRes.data || []);
      setUsers(usersRes.data.results || usersRes.data || []);
    } catch (error) {
      console.error("Failed to fetch admin logs or users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const details = parseDetails(log.details);
      const detailsText = typeof details === "string" ? details : JSON.stringify(details || {});
      return [
        log.action,
        log.admin_username,
        log.target_type,
        String(log.target_id),
        detailsText,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [logs, query]);

  const logSummary = useMemo(() => {
    const userTargets = logs.filter((log) => log.target_type === "USER").length;
    const moderationActions = logs.filter((log) =>
      ["User warned", "User blocked", "User unblocked", "User approved"].some((label) =>
        String(log.action || "").startsWith(label)
      )
    ).length;
    const todayCount = logs.filter((log) => {
      const created = new Date(log.created_at);
      const now = new Date();
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }).length;
    const latestLog = logs[0] || null;
    const oldestLog = logs[logs.length - 1] || null;

    return {
      total: logs.length,
      userTargets,
      moderationActions,
      todayCount,
      latestLog,
      oldestLog,
    };
  }, [logs]);

  const actionableUser = (log) => {
    if (log.target_user) return users.find((user) => user.id === log.target_user.id) || log.target_user;
    if (log.target_type !== "USER") return null;
    return users.find((user) => user.id === log.target_id) || null;
  };

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
    if (!selectedUser || !actionType) return;

    setSubmitting(true);
    try {
      if (actionType === "warn") {
        await api.patch(`/admin/users/${selectedUser.id}/warn/`, { warning_note: reason });
      } else if (selectedUser.is_blocked) {
        await api.patch(`/admin/users/${selectedUser.id}/unblock/`);
      } else {
        await api.patch(`/admin/users/${selectedUser.id}/block/`, { block_reason: reason });
      }
      closeModal();
      fetchAll();
    } catch (error) {
      console.error("Failed to apply user action from logs:", error);
      alert("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_220px]">
        <LogTopCard
          label="Total Logs"
          value={logSummary.total}
          note={
            logSummary.oldestLog
              ? `Tracking activity since ${new Date(logSummary.oldestLog.created_at).toLocaleDateString()}.`
              : "No activity has been recorded yet."
          }
        />
        <LogTopCard
          label="Today"
          value={logSummary.todayCount}
          note={
            logSummary.todayCount > 0
              ? `${logSummary.todayCount} event${logSummary.todayCount > 1 ? "s" : ""} captured today.`
              : "No events have been recorded today yet."
          }
        />
        <LogTopCard
          label="User Actions"
          value={logSummary.moderationActions}
          note={
            logSummary.latestLog
              ? `Latest activity was ${formatTimeAgo(logSummary.latestLog.created_at)}.`
              : "No moderation actions recorded yet."
          }
        />
        <button
          onClick={fetchAll}
          className="flex min-h-[104px] items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-5 text-sm font-bold text-slate-700 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
            <RefreshCcw size={18} />
          </span>
          Refresh Logs
        </button>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] md:p-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, admin, target, or reason..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : filtered.length === 0 ? (
        <section className="rounded-[30px] border border-slate-200 bg-white p-12 text-center shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-lg font-bold text-slate-900">No activity logs found</p>
          <p className="mt-2 text-sm text-slate-500">Try a different search or perform an admin action.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
          <div className="grid grid-cols-[180px_180px_minmax(0,1.1fr)_180px_minmax(0,1fr)_240px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            <span>Date & Time</span>
            <span>Actor</span>
            <span>Action</span>
            <span>Target</span>
            <span>Details</span>
            <span>User Tools</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((log) => {
              const details = parseDetails(log.details);
              const targetUser = actionableUser(log);
              const detailsText = formatLogDetails(log, details, targetUser);

              return (
                <article
                  key={log.id}
                  className="grid grid-cols-1 gap-4 px-6 py-5 transition hover:bg-slate-50/70 md:grid-cols-[180px_180px_minmax(0,1.1fr)_180px_minmax(0,1fr)_240px]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{formatLogTimestamp(log.created_at)}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatTimeAgo(log.created_at)}</p>
                  </div>

                  <div>
                    <p className="font-bold capitalize text-slate-900">{getActorLabel(log, targetUser)}</p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {log.action}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneByTarget[log.target_type] || "bg-slate-100 text-slate-700"}`}>
                      {log.target_type}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">ID: {log.target_id}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-3 text-sm leading-6 text-slate-700">{detailsText || "-"}</p>
                  </div>

                  <div>
                    {targetUser && !targetUser.is_staff && !targetUser.is_superuser ? (
                      <div className="space-y-2">
                        <div className="rounded-2xl bg-slate-50 px-3 py-3">
                          <div className="flex items-center gap-2">
                            <UserRound size={15} className="text-slate-500" />
                            <span className="truncate text-sm font-bold text-slate-900">{targetUser.username}</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">{targetUser.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${roleToneMap[targetUser.user_type] || "bg-slate-100 text-slate-700"}`}>
                              {formatRoleLabel(targetUser.effective_role || targetUser.user_type)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openAction(targetUser, "warn")}
                            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            <AlertTriangle size={14} />
                            Warn
                          </button>

                          <button
                            onClick={() => openAction(targetUser, "block")}
                            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition ${
                              targetUser.is_blocked
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            {targetUser.is_blocked ? <ShieldOff size={14} /> : <Shield size={14} />}
                            {targetUser.is_blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Event Context</p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {log.admin_username || "Administrator"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {log.target_type === "USER"
                            ? "This activity belongs to an admin account, so warn and block tools are hidden."
                            : `Admin or system event linked to ${String(log.target_type || "activity").toLowerCase()}.`}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <ActionModal
        targetUser={selectedUser}
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

function LogTopCard({ label, value, note }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}
