import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function PartnerApprovals() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line
  }, [filter]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/partners/?status=${filter}`);
      setPartners(data.results || data || []);
    } catch (e) {
      console.error("Failed to fetch partners:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return partners;
    const q = query.toLowerCase();
    return partners.filter(
      (p) =>
        String(p.username || "").toLowerCase().includes(q) ||
        String(p.email || "").toLowerCase().includes(q)
    );
  }, [partners, query]);

  const updateStatus = async (id, status) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/partners/${id}/update_status/`, { status, review_note: reviewNote });
      setSelected(null);
      setReviewNote("");
      fetchPartners();
    } catch {
      alert("Failed to update partner status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Delivery Partner Approvals
            </h1>
            <p className="text-slate-600 mt-1">
              Verify partners and maintain delivery quality.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CHANGES">Needs Changes</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <button
              onClick={fetchPartners}
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
            placeholder="Search partner by username or email..."
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
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="text-slate-700 font-semibold">No {filter.toLowerCase()} partners</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <GlassCard key={p.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900">{p.username}</h3>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Info label="Email" value={p.email} />
                    <Info label="Rating" value={`${p.rating ?? "—"}/5.0`} />
                    <Info label="Phone" value={p.phone || "—"} />
                  </div>

                  {p.review_note && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-100/60 border border-white/40">
                      <p className="text-sm text-amber-900">
                        <strong>Review Note:</strong> {p.review_note}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelected(p)}
                  className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
                >
                  <Eye size={20} className="text-slate-800" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setReviewNote(""); }}>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Review Partner</h2>
          <p className="text-slate-600 mb-4">{selected.username}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <Info label="Email" value={selected.email} />
            <Info label="Rating" value={`${selected.rating ?? "—"}/5.0`} />
            <Info label="Phone" value={selected.phone || "—"} />
            <Info label="Status" value={selected.status} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Review Note</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Write feedback (optional)"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <ActionButton onClick={() => updateStatus(selected.id, "APPROVED")} disabled={submitting} variant="green" icon={CheckCircle} text="Approve" />
            <ActionButton onClick={() => updateStatus(selected.id, "NEEDS_CHANGES")} disabled={submitting} variant="yellow" icon={AlertCircle} text="Needs Changes" />
            <ActionButton onClick={() => updateStatus(selected.id, "REJECTED")} disabled={submitting} variant="red" icon={XCircle} text="Reject" />
          </div>

          <button
            onClick={() => { setSelected(null); setReviewNote(""); }}
            className="mt-4 w-full py-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold"
          >
            Close
          </button>
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
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    NEEDS_CHANGES: "bg-orange-100 text-orange-800",
    SUSPENDED: "bg-slate-200 text-slate-800",
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

function ActionButton({ onClick, disabled, variant, icon: Icon, text }) {
  const styles = {
    green: "bg-emerald-600 hover:bg-emerald-700",
    yellow: "bg-amber-600 hover:bg-amber-700",
    red: "bg-rose-600 hover:bg-rose-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-3 rounded-2xl text-white font-extrabold transition disabled:opacity-50 ${styles[variant]}`}
    >
      <Icon className="inline mr-2" size={18} />
      {disabled ? "Processing..." : text}
    </button>
  );
}