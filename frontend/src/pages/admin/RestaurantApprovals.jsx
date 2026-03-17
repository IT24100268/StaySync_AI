import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw, Search } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function RestaurantApprovals() {
  const [restaurants, setRestaurants] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line
  }, [filter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const [{ data: restaurantsData }, { data: pendingOwnersData }] = await Promise.all([
        api.get(`/admin/restaurants/?status=${filter}`),
        api.get(`/admin/users/?is_approved=false&user_type=restaurant_owner`),
      ]);
      setRestaurants(restaurantsData.results || restaurantsData || []);
      setPendingOwners(pendingOwnersData.results || pendingOwnersData || []);
    } catch (e) {
      console.error("Failed to fetch restaurants:", e);
    } finally {
      setLoading(false);
    }
  };

  const approveOwnerAccount = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      fetchRestaurants();
    } catch (e) {
      console.error("Failed to approve restaurant owner:", e);
      alert("Failed to approve owner account");
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return restaurants;
    const q = query.toLowerCase();
    return restaurants.filter(
      (r) =>
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.email || "").toLowerCase().includes(q) ||
        String(r.owner_username || "").toLowerCase().includes(q)
    );
  }, [restaurants, query]);

  const updateStatus = async (id, status) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/restaurants/${id}/update_status/`, {
        status,
        review_note: reviewNote,
      });
      setSelected(null);
      setReviewNote("");
      fetchRestaurants();
    } catch {
      alert("Failed to update restaurant status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Restaurant Approvals</h1>
            <p className="mt-1 text-slate-500">
              Review restaurant registrations and approve trusted providers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CHANGES">Needs Changes</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <button
              onClick={fetchRestaurants}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 font-semibold text-slate-700 hover:bg-white"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, owner..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </GlassCard>

      {pendingOwners.length > 0 && (
        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Pending Restaurant Owner Accounts</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
              {pendingOwners.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingOwners.map((owner) => (
              <div
                key={owner.id}
                className="rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {owner.profile?.restaurant_name || owner.username}
                    </p>
                    <p className="text-sm text-slate-500">{owner.email}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {owner.profile?.phone_number || "No phone"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {owner.profile?.address || "No address"}
                    </p>
                  </div>

                  <button
                    onClick={() => approveOwnerAccount(owner.id)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="font-semibold text-slate-700">No {filter.toLowerCase()} restaurants</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <GlassCard key={r.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-extrabold text-slate-900">{r.name}</h3>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <Info label="Email" value={r.email} />
                    <Info label="Phone" value={r.phone} />
                    <Info label="Owner" value={r.owner_username} />
                    <div className="md:col-span-3">
                      <Info label="Address" value={r.address} />
                    </div>
                  </div>

                  {r.review_note && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-900">
                        <strong>Review Note:</strong> {r.review_note}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelected(r)}
                  className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white"
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
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Review Restaurant</h2>
          <p className="mb-4 text-slate-500">{selected.name}</p>

          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Email" value={selected.email} />
            <Info label="Phone" value={selected.phone} />
            <Info label="Owner" value={selected.owner_username} />
            <Info label="Address" value={selected.address} />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">Review Note</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Write feedback (optional)"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <ActionButton onClick={() => updateStatus(selected.id, "APPROVED")} disabled={submitting} variant="green" icon={CheckCircle} text="Approve" />
            <ActionButton onClick={() => updateStatus(selected.id, "NEEDS_CHANGES")} disabled={submitting} variant="yellow" icon={AlertCircle} text="Needs Changes" />
            <ActionButton onClick={() => updateStatus(selected.id, "REJECTED")} disabled={submitting} variant="red" icon={XCircle} text="Reject" />
          </div>

          <button
            onClick={() => { setSelected(null); setReviewNote(""); }}
            className="mt-4 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
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
    <div className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 truncate font-semibold text-slate-900">{value || "—"}</div>
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
    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${colors[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#dfe7f3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        {children}
        <button onClick={onClose} className="sr-only">
          close
        </button>
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
      className={`flex-1 rounded-2xl py-3 font-extrabold text-white transition disabled:opacity-50 ${styles[variant]}`}
    >
      <Icon className="mr-2 inline" size={18} />
      {disabled ? "Processing..." : text}
    </button>
  );
}