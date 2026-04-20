import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw, Search, ShieldOff, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

const PARTNER_IMAGE_FALLBACK = "https://ui-avatars.com/api/?name=P&background=EDE9FE&color=4C1D95";

function getPartnerImage(partner) {
  return partner.partner_display_image || partner.profile?.display_image || PARTNER_IMAGE_FALLBACK;
}

export default function PartnerApprovals() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => { fetchPartners(); }, [filter]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data: partnersData } = await api.get(`/admin/partners/?status=${filter}`);
      setPartners(partnersData.results || partnersData || []);
    } catch (e) {
      console.error("Failed to fetch partners:", e);
    } finally {
      setLoading(false);
    }
  };

  const blockPartner = async () => {
    if (!blockReason.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${blockTarget.user}/block/`, { block_reason: blockReason.trim() });
      setBlockTarget(null);
      setBlockReason("");
      setSelected(null);
      fetchPartners();
    } catch {
      alert("Failed to block partner");
    } finally {
      setSubmitting(false);
    }
  };

  const unblockPartner = async (userId) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${userId}/unblock/`);
      setSelected(null);
      fetchPartners();
    } catch {
      alert("Failed to unblock partner");
    } finally {
      setSubmitting(false);
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Delivery Partner Approvals</h1>
            <p className="mt-1 text-slate-500">Review delivery partner registrations and trust signals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CHANGES">Needs Changes</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button onClick={fetchPartners} className="inline-flex items-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 font-semibold text-slate-700 hover:bg-white">
              <RefreshCcw size={18} /> Refresh
            </button>
          </div>
        </div>
        <div className="relative mt-5">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search partner by username or email..." className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="font-semibold text-slate-700">No {filter.toLowerCase()} partners</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <GlassCard key={p.id} className="p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] xl:w-[280px]">
                  <img src={getPartnerImage(p)} alt={p.username} className="h-52 w-full bg-white object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-extrabold text-slate-900">{p.username}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <Info label="Email" value={p.email} />
                    <Info label="Rating" value={`${p.rating ?? "-"}/5.0`} />
                    <Info label="Phone" value={p.phone || "-"} />
                  </div>
                  {p.review_note && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-900"><strong>Review Note:</strong> {p.review_note}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(p)} className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white">
                  <Eye size={20} className="text-slate-800" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Partner review modal — with block button */}
      {selected && (
        <Modal onClose={() => { setSelected(null); setReviewNote(""); }}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Review Partner</h2>
          <p className="mb-4 text-slate-500">{selected.username}</p>
          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img src={getPartnerImage(selected)} alt={selected.username} className="h-64 w-full bg-white object-contain" />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Email" value={selected.email} />
            <Info label="Rating" value={`${selected.rating ?? "-"}/5.0`} />
            <Info label="Phone" value={selected.phone || "-"} />
            <Info label="Status" value={selected.status} />
          </div>
          {selected.partner_profile && (
            <div className="mb-4 rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
              <h3 className="mb-3 text-lg font-extrabold text-slate-900">Partner Registration Details</h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Info label="Username" value={selected.partner_profile.username} />
                <Info label="Email" value={selected.partner_profile.email} />
                <Info label="Phone Number" value={selected.partner_profile.phone_number} />
                <Info label="Vehicle Type" value={selected.partner_profile.vehicle_type} />
                <Info label="License No" value={selected.partner_profile.license_no} />
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">Review Note</label>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" placeholder="Write feedback (optional)" />
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <ActionButton onClick={() => updateStatus(selected.id, "APPROVED")} disabled={submitting} variant="green" icon={CheckCircle} text="Approve" />
            <ActionButton onClick={() => updateStatus(selected.id, "NEEDS_CHANGES")} disabled={submitting} variant="yellow" icon={AlertCircle} text="Needs Changes" />
            <ActionButton onClick={() => updateStatus(selected.id, "REJECTED")} disabled={submitting} variant="red" icon={XCircle} text="Reject" />
          </div>

          {/* Block / Unblock */}
          <div className="mt-3">
            {selected.user_is_blocked ? (
              <button onClick={() => unblockPartner(selected.user)} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                <ShieldCheck size={18} /> {submitting ? "Processing..." : "Unblock Partner"}
              </button>
            ) : (
              <button onClick={() => { setBlockTarget(selected); setBlockReason(""); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700">
                <ShieldOff size={18} /> Block Partner
              </button>
            )}
          </div>

          <button onClick={() => { setSelected(null); setReviewNote(""); }} className="mt-3 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Close</button>
        </Modal>
      )}

      {/* Block reason popup */}
      {blockTarget && (
        <Modal onClose={() => { setBlockTarget(null); setBlockReason(""); }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100"><ShieldOff size={22} className="text-rose-600" /></div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Block Partner</h2>
              <p className="text-sm text-slate-500">{blockTarget.username}</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600">This partner will be blocked immediately and cannot login. The reason will be shown to them when they attempt to login.</p>
          <label className="mb-2 block text-sm font-bold text-slate-700">Reason for blocking <span className="text-rose-500">*</span></label>
          <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} rows={3} autoFocus placeholder="e.g. Violation of terms, fraudulent activity..." className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
          <div className="mt-4 flex gap-3">
            <button onClick={blockPartner} disabled={submitting || !blockReason.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-50">
              <ShieldOff size={18} /> {submitting ? "Blocking..." : "Confirm Block"}
            </button>
            <button onClick={() => { setBlockTarget(null); setBlockReason(""); }} className="flex-1 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 truncate font-semibold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-rose-100 text-rose-800", NEEDS_CHANGES: "bg-orange-100 text-orange-800", SUSPENDED: "bg-slate-200 text-slate-800" };
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${colors[status] || "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#dfe7f3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        {children}
        <button onClick={onClose} className="sr-only">close</button>
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, variant, icon: Icon, text }) {
  const styles = { green: "bg-emerald-600 hover:bg-emerald-700", yellow: "bg-amber-600 hover:bg-amber-700", red: "bg-rose-600 hover:bg-rose-700" };
  return (
    <button onClick={onClick} disabled={disabled} className={`flex-1 rounded-2xl py-3 font-extrabold text-white transition disabled:opacity-50 ${styles[variant]}`}>
      <Icon className="mr-2 inline" size={18} />
      {disabled ? "Processing..." : text}
    </button>
  );
}
