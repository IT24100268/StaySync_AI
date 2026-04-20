import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw, Search, ShieldOff, ShieldCheck, UtensilsCrossed, X } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

const RESTAURANT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
const FOOD_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

function getRestaurantImage(restaurant) {
  return restaurant.owner_display_image || restaurant.image || restaurant.logo || RESTAURANT_IMAGE_FALLBACK;
}

export default function RestaurantApprovals() {
  const [restaurants, setRestaurants] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [approvedOwners, setApprovedOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [selectedPendingOwner, setSelectedPendingOwner] = useState(null);
  const [selectedApprovedOwner, setSelectedApprovedOwner] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [ownerUser, setOwnerUser] = useState(null); // user record for selected restaurant's owner
  const [menuRestaurant, setMenuRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => { fetchRestaurants(); }, [filter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const [{ data: restaurantsData }, { data: pendingOwnersData }, { data: approvedOwnersData }] = await Promise.all([
        api.get(`/admin/restaurants/?status=${filter}`),
        api.get(`/admin/users/?is_approved=false&user_type=restaurant_owner`),
        api.get(`/admin/users/?is_approved=true&user_type=restaurant_owner`),
      ]);
      setRestaurants(restaurantsData.results || restaurantsData || []);
      setPendingOwners(pendingOwnersData.results || pendingOwnersData || []);
      // exclude blocked from approved list
      const approved = approvedOwnersData.results || approvedOwnersData || [];
      setApprovedOwners(approved);
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
    } catch {
      alert("Failed to approve owner account");
    }
  };

  const rejectOwnerAccount = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${rejectTarget.id}/reject/`, { reject_reason: rejectReason.trim() });
      setRejectTarget(null);
      setRejectReason("");
      fetchRestaurants();
    } catch {
      alert("Failed to reject owner account");
    } finally {
      setSubmitting(false);
    }
  };

  const blockOwner = async () => {
    if (!blockReason.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${blockTarget.id}/block/`, { block_reason: blockReason.trim() });
      setBlockTarget(null);
      setBlockReason("");
      setSelectedApprovedOwner(null);
      setSelected(null);
      fetchRestaurants();
    } catch {
      alert("Failed to block owner");
    } finally {
      setSubmitting(false);
    }
  };

  const unblockOwner = async (userId) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${userId}/unblock/`);
      setSelectedApprovedOwner(null);
      setSelected(null);
      fetchRestaurants();
    } catch {
      alert("Failed to unblock owner");
    } finally {
      setSubmitting(false);
    }
  };

  const viewMenu = async (restaurant) => {
    setMenuRestaurant(restaurant);
    setMenuItems([]);
    setMenuLoading(true);
    try {
      const { data } = await api.get(`/admin/restaurants/${restaurant.id}/menu/`);
      setMenuItems(data);
    } catch {
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const blockedOwners = approvedOwners.filter((o) => o.is_blocked);
  const activeApprovedOwners = approvedOwners.filter((o) => !o.is_blocked);
  const displayItems = filter === "APPROVED" ? activeApprovedOwners : filter === "BLOCKED" ? blockedOwners : (filter === "REJECTED" || filter === "NEEDS_CHANGES" || filter === "SUSPENDED") ? restaurants : restaurants;

  const filtered = useMemo(() => {
    if (!query.trim()) return displayItems;
    const q = query.toLowerCase();
    return displayItems.filter((item) =>
      (filter === "APPROVED" || filter === "BLOCKED")
        ? (
            String(item.profile?.restaurant_name || "").toLowerCase().includes(q) ||
            String(item.username || "").toLowerCase().includes(q) ||
            String(item.email || "").toLowerCase().includes(q) ||
            String(item.profile?.phone_number || "").toLowerCase().includes(q)
          )
        : (
            String(item.name || "").toLowerCase().includes(q) ||
            String(item.email || "").toLowerCase().includes(q) ||
            String(item.owner_username || "").toLowerCase().includes(q)
          )
    );
  }, [displayItems, filter, query]);

  const updateStatus = async (id, status) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/restaurants/${id}/update_status/`, { status, review_note: reviewNote });
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
            <p className="mt-1 text-slate-500">Review restaurant registrations and approve trusted providers.</p>
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
              <option value="BLOCKED">Blocked</option>
            </select>
            <button onClick={fetchRestaurants} className="inline-flex items-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 font-semibold text-slate-700 hover:bg-white">
              <RefreshCcw size={18} /> Refresh
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

      {filter === "PENDING" && pendingOwners.length > 0 && (
        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Pending Restaurant Owner Accounts</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">{pendingOwners.length} Pending</span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingOwners.map((owner) => (
              <div key={owner.id} className="rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
                <div className="flex items-start justify-between gap-4">
                  <button type="button" onClick={() => setSelectedPendingOwner(owner)} className="flex flex-1 items-start gap-4 text-left">
                    <div className="overflow-hidden rounded-[20px] border border-[#d9e5f3] bg-white">
                      <img src={owner.profile?.display_image || RESTAURANT_IMAGE_FALLBACK} alt={owner.profile?.restaurant_name || owner.username} className="h-24 w-24 bg-white object-contain" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">{owner.profile?.restaurant_name || owner.username}</p>
                      <p className="text-sm text-slate-500">{owner.email}</p>
                      <p className="mt-1 text-sm text-slate-700">{owner.profile?.phone_number || "No phone"}</p>
                      <p className="mt-2 text-xs text-slate-500">{owner.profile?.address || "No address"}</p>
                    </div>
                  </button>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => approveOwnerAccount(owner.id)} className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700">Approve</button>
                    <button onClick={() => { setRejectTarget(owner); setRejectReason(""); }} className="rounded-2xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="font-semibold text-slate-700">No {filter.toLowerCase()} restaurants</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {(filter === "APPROVED" || filter === "BLOCKED")
            ? filtered.map((owner) => (
                <GlassCard key={owner.id} className="p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] xl:w-[280px]">
                      <img src={owner.profile?.display_image || RESTAURANT_IMAGE_FALLBACK} alt={owner.profile?.restaurant_name || owner.username} className="h-52 w-full bg-white object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-extrabold text-slate-900">{owner.profile?.restaurant_name || owner.username}</h3>
                        <StatusBadge status={owner.is_blocked ? "BLOCKED" : "APPROVED"} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <Info label="Username" value={owner.username} />
                        <Info label="Email" value={owner.email} />
                        <Info label="Phone" value={owner.profile?.phone_number} />
                        <div className="md:col-span-3"><Info label="Address" value={owner.profile?.address} /></div>
                      </div>
                      {owner.is_blocked && owner.block_reason && (
                        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-sm text-rose-800"><strong>Block Reason:</strong> {owner.block_reason}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedApprovedOwner(owner)} className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white">
                      <Eye size={20} className="text-slate-800" />
                    </button>
                    <button
                      onClick={async () => {
                        // find the restaurant record for this owner
                        try {
                          const { data } = await api.get(`/admin/restaurants/?status=APPROVED`);
                          const list = data.results || data || [];
                          const match = list.find((r) => r.owner_username === owner.username || r.email === owner.email);
                          if (match) viewMenu(match);
                          else setMenuRestaurant({ id: null, name: owner.profile?.restaurant_name || owner.username });
                        } catch { setMenuRestaurant({ id: null, name: owner.profile?.restaurant_name || owner.username }); }
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 font-bold text-orange-700 hover:bg-orange-100"
                    >
                      <UtensilsCrossed size={16} /> View Menu
                    </button>
                  </div>
                </GlassCard>
              ))
            : filtered.map((r) => (
                <GlassCard key={r.id} className="p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] xl:w-[280px]">
                      <img src={getRestaurantImage(r)} alt={r.name} className="h-52 w-full bg-white object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-extrabold text-slate-900">{r.name}</h3>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <Info label="Email" value={r.email} />
                        <Info label="Phone" value={r.phone} />
                        <Info label="Owner" value={r.owner_username} />
                        <div className="md:col-span-3"><Info label="Address" value={r.address} /></div>
                      </div>
                      {r.review_note && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm text-amber-900"><strong>Review Note:</strong> {r.review_note}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={async () => {
                      setSelected(r);
                      setOwnerUser(null);
                      if (r.owner) {
                        try { const { data } = await api.get(`/admin/users/${r.owner}/`); setOwnerUser(data); } catch {}
                      }
                    }} className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white">
                      <Eye size={20} className="text-slate-800" />
                    </button>
                    {r.status === "PENDING" && (
                      <button
                        onClick={() => { setSelected(r); setOwnerUser(null); }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                    )}
                    {r.status === "PENDING" && (
                      <button
                        onClick={async () => { await updateStatus(r.id, "REJECTED"); }}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => viewMenu(r)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 font-bold text-orange-700 hover:bg-orange-100"
                    >
                      <UtensilsCrossed size={16} /> View Menu
                    </button>
                  </div>
                </GlassCard>
              ))}
        </div>
      )}

      {selected && (
        <Modal onClose={() => { setSelected(null); setReviewNote(""); setOwnerUser(null); }}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Review Restaurant</h2>
          <p className="mb-4 text-slate-500">{selected.name}</p>

          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img src={getRestaurantImage(selected)} alt={selected.name} className="h-64 w-full bg-white object-contain" />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Email" value={selected.email} />
            <Info label="Phone" value={selected.phone} />
            <Info label="Owner" value={selected.owner_username} />
            <Info label="Address" value={selected.address} />
            <Info label="Status" value={selected.status} />
          </div>

          {selected.owner_profile && (
            <div className="mb-4 rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
              <h3 className="mb-3 text-lg font-extrabold text-slate-900">Owner Registration Details</h3>
              <div className="mb-4 overflow-hidden rounded-[20px] border border-[#d9e5f3] bg-white">
                <img src={selected.owner_profile.display_image || RESTAURANT_IMAGE_FALLBACK} alt={selected.owner_profile.restaurant_name} className="h-56 w-full bg-white object-contain" />
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Info label="Restaurant Name" value={selected.owner_profile.restaurant_name} />
                <Info label="Username" value={selected.owner_profile.username} />
                <Info label="Email" value={selected.owner_profile.email} />
                <Info label="Phone Number" value={selected.owner_profile.phone_number} />
                <Info label="Address" value={selected.owner_profile.address} />
              </div>
            </div>
          )}

          {/* Review note */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">Review Note</label>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" placeholder="Write feedback (optional)" />
          </div>

          {/* Status action buttons */}
          <div className="mb-4 flex flex-wrap gap-3">
            <button onClick={() => updateStatus(selected.id, "APPROVED")} disabled={submitting || selected.status === "APPROVED"} className="flex-1 rounded-2xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-40">
              <CheckCircle className="mr-2 inline" size={16} />{submitting ? "Processing..." : "Approve"}
            </button>
            <button onClick={() => updateStatus(selected.id, "REJECTED")} disabled={submitting || selected.status === "REJECTED"} className="flex-1 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-40">
              <XCircle className="mr-2 inline" size={16} />{submitting ? "Processing..." : "Reject"}
            </button>
            <button onClick={() => updateStatus(selected.id, "NEEDS_CHANGES")} disabled={submitting || selected.status === "NEEDS_CHANGES"} className="flex-1 rounded-2xl bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-40">
              <AlertCircle className="mr-2 inline" size={16} />{submitting ? "Processing..." : "Needs Changes"}
            </button>
            <button onClick={() => updateStatus(selected.id, "SUSPENDED")} disabled={submitting || selected.status === "SUSPENDED"} className="flex-1 rounded-2xl bg-slate-600 py-3 font-bold text-white hover:bg-slate-700 disabled:opacity-40">
              <ShieldOff className="mr-2 inline" size={16} />{submitting ? "Processing..." : "Suspend"}
            </button>
          </div>

          {/* Block / Unblock owner account */}
          <div className="rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Owner Account</p>
            {ownerUser ? (
              ownerUser.is_blocked ? (
                <>
                  <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                    <p className="text-sm text-rose-800"><strong>Owner is blocked.</strong>{ownerUser.block_reason ? ` Reason: ${ownerUser.block_reason}` : ""}</p>
                  </div>
                  <button onClick={() => unblockOwner(ownerUser.id)} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                    <ShieldCheck size={18} /> {submitting ? "Processing..." : "Unblock Owner"}
                  </button>
                </>
              ) : (
                <button onClick={() => { setBlockTarget(ownerUser); setBlockReason(""); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700">
                  <ShieldOff size={18} /> Block Owner
                </button>
              )
            ) : (
              <p className="text-sm text-slate-400">Owner account info unavailable</p>
            )}
          </div>

          <button onClick={() => { setSelected(null); setReviewNote(""); setOwnerUser(null); }} className="mt-3 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Close</button>
        </Modal>
      )}

      {/* Pending owner detail modal */}
      {selectedPendingOwner && (
        <Modal onClose={() => setSelectedPendingOwner(null)}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Pending Restaurant Owner</h2>
          <p className="mb-4 text-slate-500">{selectedPendingOwner.profile?.restaurant_name || selectedPendingOwner.username}</p>
          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img src={selectedPendingOwner.profile?.display_image || RESTAURANT_IMAGE_FALLBACK} alt={selectedPendingOwner.profile?.restaurant_name || selectedPendingOwner.username} className="h-64 w-full bg-white object-contain" />
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Restaurant Name" value={selectedPendingOwner.profile?.restaurant_name} />
            <Info label="Username" value={selectedPendingOwner.username} />
            <Info label="Email" value={selectedPendingOwner.email} />
            <Info label="Phone Number" value={selectedPendingOwner.profile?.phone_number || "-"} />
            <Info label="Address" value={selectedPendingOwner.profile?.address || "-"} />
          </div>
          <button onClick={() => setSelectedPendingOwner(null)} className="mt-4 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Close</button>
        </Modal>
      )}

      {/* Approved owner detail modal — with block button */}
      {selectedApprovedOwner && (
        <Modal onClose={() => setSelectedApprovedOwner(null)}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Approved Restaurant Owner</h2>
          <p className="mb-4 text-slate-500">{selectedApprovedOwner.profile?.restaurant_name || selectedApprovedOwner.username}</p>
          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img src={selectedApprovedOwner.profile?.display_image || RESTAURANT_IMAGE_FALLBACK} alt={selectedApprovedOwner.profile?.restaurant_name || selectedApprovedOwner.username} className="h-64 w-full bg-white object-contain" />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Restaurant Name" value={selectedApprovedOwner.profile?.restaurant_name} />
            <Info label="Username" value={selectedApprovedOwner.username} />
            <Info label="Email" value={selectedApprovedOwner.email} />
            <Info label="Phone Number" value={selectedApprovedOwner.profile?.phone_number} />
            <Info label="Address" value={selectedApprovedOwner.profile?.address} />
          </div>
          {selectedApprovedOwner.is_blocked && selectedApprovedOwner.block_reason && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-800"><strong>Block Reason:</strong> {selectedApprovedOwner.block_reason}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {selectedApprovedOwner.is_blocked ? (
              <button onClick={() => unblockOwner(selectedApprovedOwner.id)} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                <ShieldCheck size={18} /> {submitting ? "Processing..." : "Unblock Owner"}
              </button>
            ) : (
              <button onClick={() => { setBlockTarget(selectedApprovedOwner); setBlockReason(""); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700">
                <ShieldOff size={18} /> Block Owner
              </button>
            )}
          </div>
          <button onClick={() => setSelectedApprovedOwner(null)} className="mt-3 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Close</button>
        </Modal>
      )}

      {/* Menu modal */}
      {menuRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#dfe7f3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-100">
                  <UtensilsCrossed size={20} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{menuRestaurant.name} — Menu</h2>
                  <p className="text-xs text-slate-400">{menuItems.length} item{menuItems.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button onClick={() => { setMenuRestaurant(null); setMenuItems([]); }} className="rounded-xl p-2 hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {menuLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
              </div>
            ) : !menuRestaurant.id ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <UtensilsCrossed size={40} className="mb-3 opacity-40" />
                <p className="font-semibold">Restaurant record not found</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <UtensilsCrossed size={40} className="mb-3 opacity-40" />
                <p className="font-semibold">No menu items added yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-[20px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] border border-[#e4ebf5] bg-white">
                      <img
                        src={item.image_url || FOOD_IMAGE_FALLBACK}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-extrabold text-slate-900 leading-snug">{item.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.is_available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
                      )}
                      <p className="mt-2 text-sm font-extrabold text-orange-600">LKR {Number(item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject owner popup */}
      {rejectTarget && (
        <Modal onClose={() => { setRejectTarget(null); setRejectReason(""); }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100"><XCircle size={22} className="text-rose-600" /></div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Reject Account</h2>
              <p className="text-sm text-slate-500">{rejectTarget.profile?.restaurant_name || rejectTarget.username}</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600">This owner's registration will be rejected and they will not be able to login. The reason will be shown to them.</p>
          <label className="mb-2 block text-sm font-bold text-slate-700">Reason for rejection <span className="text-rose-500">*</span></label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} autoFocus placeholder="e.g. Incomplete documents, invalid business details..." className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
          <div className="mt-4 flex gap-3">
            <button onClick={rejectOwnerAccount} disabled={submitting || !rejectReason.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-50">
              <XCircle size={18} /> {submitting ? "Rejecting..." : "Confirm Reject"}
            </button>
            <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="flex-1 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Block reason popup */}
      {blockTarget && (
        <Modal onClose={() => { setBlockTarget(null); setBlockReason(""); }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100"><ShieldOff size={22} className="text-rose-600" /></div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Block Owner</h2>
              <p className="text-sm text-slate-500">{blockTarget.profile?.restaurant_name || blockTarget.username}</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-600">This owner will be blocked immediately and cannot login. The reason will be shown to them when they attempt to login.</p>
          <label className="mb-2 block text-sm font-bold text-slate-700">Reason for blocking <span className="text-rose-500">*</span></label>
          <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} rows={3} autoFocus placeholder="e.g. Violation of terms, fraudulent activity..." className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
          <div className="mt-4 flex gap-3">
            <button onClick={blockOwner} disabled={submitting || !blockReason.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-50">
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
      <div className="mt-1 truncate font-semibold text-slate-900">{value || "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", BLOCKED: "bg-rose-100 text-rose-800", REJECTED: "bg-rose-100 text-rose-800", NEEDS_CHANGES: "bg-orange-100 text-orange-800", SUSPENDED: "bg-slate-200 text-slate-800" };
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
