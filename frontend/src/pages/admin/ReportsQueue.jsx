import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function ReportsQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/reports/?status=${filter}`);
      setReports(data.results || data || []);
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return reports;
    const q = query.toLowerCase();
    return reports.filter(
      (r) =>
        String(r.reporter_username || "").toLowerCase().includes(q) ||
        String(r.reason || "").toLowerCase().includes(q) ||
        String(r.target_type || "").toLowerCase().includes(q) ||
        String(r.target_id || "").toLowerCase().includes(q)
    );
  }, [reports, query]);

  const updateStatus = async () => {
    if (!newStatus || !selected) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/reports/${selected.id}/update_status/`, {
        status: newStatus,
        admin_note: adminNote,
      });
      setSelected(null);
      setAdminNote("");
      setNewStatus("");
      fetchReports();
    } catch {
      alert("Failed to update report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Reports Queue</h1>
            <p className="text-slate-600 mt-1">Handle user reports and complaints professionally.</p>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none"
            >
              <option value="PENDING">Pending</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <button
              onClick={fetchReports}
              className="px-4 py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>

        <div className="mt-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reporter, reason, target..."
            className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-slate-700 font-semibold">No {filter.toLowerCase()} reports</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50">
                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/40">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/40 transition">
                    <td className="px-6 py-4 font-extrabold text-slate-900">#{r.id}</td>
                    <td className="px-6 py-4 text-slate-800">{r.reporter_username}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{r.target_type}</div>
                      <div className="text-xs text-slate-600">ID: {r.target_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-800">{r.reason}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelected(r)}
                        className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
                        title="View"
                      >
                        <Eye size={18} className="text-slate-800" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setAdminNote(""); setNewStatus(""); }}>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            Report #{selected.id}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <Info label="Reporter" value={selected.reporter_username} />
            <Info label="Target" value={`${selected.target_type} (ID: ${selected.target_id})`} />
            <Info label="Reason" value={selected.reason} />
            <Info label="Status" value={selected.status} />
          </div>

          <div className="p-4 rounded-3xl bg-white/50 border border-white/40 mb-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Description</div>
            <p className="text-slate-800 mt-1">{selected.description || "—"}</p>
          </div>

          {selected.admin_note && (
            <div className="p-4 rounded-3xl bg-blue-100/60 border border-white/40 mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase">Previous Admin Note</div>
              <p className="text-slate-800 mt-1">{selected.admin_note}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/50 outline-none"
              >
                <option value="">Select status...</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/50 outline-none"
                placeholder="Add notes..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={updateStatus}
              disabled={submitting || !newStatus}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-extrabold disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Report"}
            </button>
            <button
              onClick={() => { setSelected(null); setAdminNote(""); setNewStatus(""); }}
              className="flex-1 py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="p-3 rounded-2xl bg-white/50 border border-white/40">
      <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
      <div className="font-semibold text-slate-900 mt-1 truncate">{value || "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-amber-100 text-amber-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    DISMISSED: "bg-slate-200 text-slate-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${colors[status]}`}>
      {status}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-3xl bg-white/65 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_rgba(2,6,23,0.25)] p-6 max-h-[90vh] overflow-y-auto">
        {children}
        <button onClick={onClose} className="sr-only">close</button>
      </div>
    </div>
  );
}