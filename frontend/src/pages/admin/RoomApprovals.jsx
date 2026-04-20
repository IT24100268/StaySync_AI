import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Eye, RefreshCcw, Search, ShieldOff, ShieldCheck, Building, X, BedDouble, BadgeCheck } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

const FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";

export default function HostelOwnerApprovals() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [roomsOwner, setRoomsOwner] = useState(null);   // owner whose rooms are being viewed
  const [ownerRooms, setOwnerRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyForm, setVerifyForm] = useState(null);
  const [verifyFormLoading, setVerifyFormLoading] = useState(false);

  useEffect(() => { fetchOwners(); }, [filter]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      let url;
      if (filter === "PENDING") url = `/admin/users/?is_approved=false&user_type=hostel_owner`;
      else if (filter === "APPROVED") url = `/admin/users/?is_approved=true&user_type=hostel_owner`;
      else url = `/admin/users/?user_type=hostel_owner`;

      const { data } = await api.get(url);
      let list = data.results || data || [];

      if (filter === "BLOCKED") list = list.filter((u) => u.is_blocked);
      else if (filter === "APPROVED") list = list.filter((u) => !u.is_blocked);

      setOwners(list);
    } catch (e) {
      console.error("Failed to fetch hostel owners:", e);
    } finally {
      setLoading(false);
    }
  };

  const approveOwner = async (userId) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      setSelectedOwner(null);
      fetchOwners();
    } catch {
      alert("Failed to approve hostel owner");
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
      setSelectedOwner(null);
      fetchOwners();
    } catch {
      alert("Failed to block hostel owner");
    } finally {
      setSubmitting(false);
    }
  };

  const unblockOwner = async (userId) => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${userId}/unblock/`);
      setSelectedOwner(null);
      fetchOwners();
    } catch {
      alert("Failed to unblock hostel owner");
    } finally {
      setSubmitting(false);
    }
  };

  const viewOwnerRooms = async (owner) => {
    setRoomsOwner(owner);
    setOwnerRooms([]);
    setRoomsLoading(true);
    try {
      const contacts = [
        owner.profile?.phone_number,
        owner.email,
      ].filter(Boolean);
      const { data } = await api.get(`/admin/rooms/`);
      const all = data.results || data || [];
      const matched = all.filter((r) =>
        contacts.some((c) => String(r.owner_contact || "").trim() === String(c).trim())
      );
      setOwnerRooms(matched);
    } catch {
      setOwnerRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const openVerify = async (owner) => {
    setVerifyTarget(owner);
    setVerifyNote("");
    setVerifyForm(null);
    setVerifyFormLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${owner.id}/verification_form/`);
      setVerifyForm(data);
    } catch {
      setVerifyForm(null);
    } finally {
      setVerifyFormLoading(false);
    }
  };

  const sendVerifyRequest = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${verifyTarget.id}/request_verification/`, { note: verifyNote });
      setVerifyTarget(null);
      setVerifyNote("");
      fetchOwners();
    } catch {
      alert("Failed to send verification request");
    } finally {
      setSubmitting(false);
    }
  };

  const completeVerification = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${verifyTarget.id}/complete_verification/`);
      setVerifyTarget(null);
      setVerifyForm(null);
      fetchOwners();
    } catch {
      alert("Failed to complete verification");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return owners;
    const q = query.toLowerCase();
    return owners.filter((u) =>
      String(u.profile?.hostel_name || "").toLowerCase().includes(q) ||
      String(u.username || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.profile?.phone_number || "").toLowerCase().includes(q)
    );
  }, [owners, query]);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Hostel Owner Approvals</h1>
            <p className="mt-1 text-slate-500">
              Approve hostel owners to grant access. Approving an owner automatically publishes all their pending room listings. Blocked owners cannot login and their rooms are hidden from students.
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
              <option value="BLOCKED">Blocked</option>
            </select>

            <button
              onClick={fetchOwners}
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
            placeholder="Search by hostel name, username, email..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="font-semibold text-slate-700">No {filter.toLowerCase()} hostel owners</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filtered.map((owner) => (
            <GlassCard key={owner.id} className="p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] xl:w-[280px]">
                  <img
                    src={owner.profile?.display_image || FALLBACK}
                    alt={owner.profile?.hostel_name || owner.username}
                    className="h-52 w-full bg-white object-contain"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {owner.profile?.hostel_name || owner.username}
                    </h3>
                    <StatusBadge owner={owner} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <Info label="Username" value={owner.username} />
                    <Info label="Email" value={owner.email} />
                    <Info label="Phone" value={owner.profile?.phone_number} />
                    <div className="md:col-span-3">
                      <Info label="Address" value={owner.profile?.address} />
                    </div>
                  </div>

                  {owner.is_blocked && owner.block_reason && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                      <p className="text-sm text-rose-800">
                        <strong>Block Reason:</strong> {owner.block_reason}
                      </p>
                    </div>
                  )}
                  {!owner.is_approved && !owner.is_blocked && (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">
                        <strong>Pending:</strong> Approving this owner will automatically publish all their room listings.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setSelectedOwner(owner); setBlockReason(""); setBlockTarget(null); }}
                  className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white"
                >
                  <Eye size={20} className="text-slate-800" />
                </button>
                <button
                  onClick={() => viewOwnerRooms(owner)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 font-bold text-blue-700 hover:bg-blue-100"
                >
                  <BedDouble size={16} /> View Rooms
                </button>
                <button
                  onClick={() => openVerify(owner)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 font-bold text-violet-700 hover:bg-violet-100"
                >
                  <BadgeCheck size={16} /> Verify
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {selectedOwner && (
        <Modal onClose={() => setSelectedOwner(null)}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Hostel Owner Details</h2>
          <p className="mb-4 text-slate-500">
            {selectedOwner.profile?.hostel_name || selectedOwner.username}
          </p>

          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img
              src={selectedOwner.profile?.display_image || FALLBACK}
              alt={selectedOwner.profile?.hostel_name || selectedOwner.username}
              className="h-64 w-full bg-white object-contain"
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Hostel Name" value={selectedOwner.profile?.hostel_name} />
            <Info label="Username" value={selectedOwner.username} />
            <Info label="Email" value={selectedOwner.email} />
            <Info label="Phone Number" value={selectedOwner.profile?.phone_number || "-"} />
            <Info label="Business Reg No" value={selectedOwner.profile?.business_reg_no || "-"} />
            <Info label="Address" value={selectedOwner.profile?.address || "-"} />
          </div>

          {selectedOwner.is_blocked && selectedOwner.block_reason && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-800">
                <strong>Block Reason:</strong> {selectedOwner.block_reason}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {(!selectedOwner.is_approved || selectedOwner.is_blocked) && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm text-emerald-800">
                  <strong>Note:</strong> Approving this owner will automatically publish all their pending room listings.
                </p>
              </div>
            )}
            {(!selectedOwner.is_approved || selectedOwner.is_blocked) && (
              <button
                onClick={() => approveOwner(selectedOwner.id)}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <ShieldCheck size={18} />
                {submitting ? "Processing..." : "Approve Owner & Publish Rooms"}
              </button>
            )}

            {!selectedOwner.is_blocked && (
              <button
                onClick={() => { setBlockTarget(selectedOwner); setBlockReason(""); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700"
              >
                <ShieldOff size={18} />
                Block Owner
              </button>
            )}

            {selectedOwner.is_blocked && (
              <button
                onClick={() => unblockOwner(selectedOwner.id)}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <ShieldCheck size={18} />
                {submitting ? "Processing..." : "Unblock Owner"}
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedOwner(null)}
            className="mt-3 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>

          <button
            onClick={() => { setSelectedOwner(null); viewOwnerRooms(selectedOwner); }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 py-3 font-bold text-blue-700 hover:bg-blue-100"
          >
            <BedDouble size={18} /> View Rooms
          </button>
        </Modal>
      )}

      {/* Rooms modal */}
      {roomsOwner && (
        <Modal onClose={() => { setRoomsOwner(null); setOwnerRooms([]); }} wide>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100">
                <Building size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {roomsOwner.profile?.hostel_name || roomsOwner.username} — Rooms
                </h2>
                <p className="text-xs text-slate-400">{roomsOwner.email}</p>
              </div>
            </div>
            <button onClick={() => { setRoomsOwner(null); setOwnerRooms([]); }} className="rounded-xl p-2 hover:bg-slate-100">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {roomsLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : ownerRooms.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <BedDouble size={40} className="mb-3" />
              <p className="font-semibold">No rooms found for this owner</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ownerRooms.map((room) => (
                <div key={room.id} className="rounded-[22px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
                  <div className="flex gap-4">
                    <div className="h-28 w-36 shrink-0 overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white">
                      <img
                        src={room.images?.[0]?.image || FALLBACK}
                        alt={room.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900">{room.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{room.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                        <RoomInfo label="Price" value={`LKR ${room.price}`} />
                        <RoomInfo label="Gender" value={room.gender_allowed} />
                        <RoomInfo label="Contact" value={room.owner_contact} />
                        <RoomInfo label="Facilities" value={room.facilities?.join(", ") || "None"} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Block reason popup */}
      {blockTarget && (
        <Modal onClose={() => { setBlockTarget(null); setBlockReason(""); }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100">
              <ShieldOff size={22} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Block Owner</h2>
              <p className="text-sm text-slate-500">{blockTarget.profile?.hostel_name || blockTarget.username}</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-slate-600">
            This owner will be blocked immediately. They will not be able to login and their rooms will be hidden from students. The reason you enter will be shown to them when they attempt to login.
          </p>

          <label className="mb-2 block text-sm font-bold text-slate-700">Reason for blocking <span className="text-rose-500">*</span></label>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder="e.g. Violation of terms, fraudulent listing, unresponsive to complaints..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={blockOwner}
              disabled={submitting || !blockReason.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              <ShieldOff size={18} />
              {submitting ? "Blocking..." : "Confirm Block"}
            </button>
            <button
              onClick={() => { setBlockTarget(null); setBlockReason(""); }}
              className="flex-1 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Verify modal */}
      {verifyTarget && (
        <Modal onClose={() => { setVerifyTarget(null); setVerifyForm(null); setVerifyNote(""); }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100">
              <BadgeCheck size={22} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Owner Verification</h2>
              <p className="text-sm text-slate-500">{verifyTarget.profile?.hostel_name || verifyTarget.username}</p>
            </div>
          </div>

          {verifyFormLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-violet-600" />
            </div>
          ) : verifyForm && verifyForm.status === "submitted" ? (
            /* Owner has submitted the form — admin can review and complete */
            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-sm font-bold text-violet-800">Owner has submitted the verification form.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Info label="NIC / Passport No" value={verifyForm.nic_passport_number} />
                <Info label="Address Proof" value={verifyForm.address_proof} />
                <Info label="Business Reg No" value={verifyForm.business_reg_no || "-"} />
                <Info label="Submitted At" value={verifyForm.submitted_at ? new Date(verifyForm.submitted_at).toLocaleString() : "-"} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {verifyForm.nic_doc && (
                  <a href={verifyForm.nic_doc} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 text-sm font-bold text-slate-700 hover:bg-white">
                    View ID Doc
                  </a>
                )}
                {verifyForm.address_doc && (
                  <a href={verifyForm.address_doc} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 text-sm font-bold text-slate-700 hover:bg-white">
                    View Address Doc
                  </a>
                )}
                {verifyForm.business_doc && (
                  <a href={verifyForm.business_doc} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 text-sm font-bold text-slate-700 hover:bg-white">
                    View Business Doc
                  </a>
                )}
              </div>
              <button
                onClick={completeVerification}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <BadgeCheck size={18} />
                {submitting ? "Processing..." : "Mark as Verified — Restore Full Access"}
              </button>
            </div>
          ) : (
            /* No form submitted yet — admin sends verification request */
            <div className="space-y-4">
              {verifyForm && verifyForm.status === "verified" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-bold text-emerald-800">This owner is already verified.</p>
                </div>
              )}
              <p className="text-sm text-slate-600">
                Clicking <strong>Send Verification Request</strong> will notify the owner via a dashboard banner. They will be restricted from adding new rooms or receiving bookings until you mark them as verified after reviewing their submitted documents.
              </p>
              <label className="mb-1 block text-sm font-bold text-slate-700">Note to owner <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                rows={3}
                placeholder="e.g. Please upload a clear copy of your NIC and address proof..."
                className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
              <button
                onClick={sendVerifyRequest}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <BadgeCheck size={18} />
                {submitting ? "Sending..." : "Send Verification Request"}
              </button>
            </div>
          )}

          <button
            onClick={() => { setVerifyTarget(null); setVerifyForm(null); setVerifyNote(""); }}
            className="mt-3 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
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

function StatusBadge({ owner }) {
  if (owner.is_blocked)
    return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-800">BLOCKED</span>;
  if (owner.is_approved)
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">APPROVED</span>;
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">PENDING</span>;
}

function Modal({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[28px] border border-[#dfe7f3] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${wide ? "max-w-3xl" : "max-w-2xl"}`}>
        {children}
        <button onClick={onClose} className="sr-only">close</button>
      </div>
    </div>
  );
}

function RoomInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e4ebf5] bg-white p-2">
      <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
      <div className="truncate text-xs font-semibold text-slate-800">{value || "—"}</div>
    </div>
  );
}
