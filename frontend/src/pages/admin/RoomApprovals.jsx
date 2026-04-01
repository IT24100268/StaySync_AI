import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw, Search } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

const ROOM_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";

function getRoomOwnerImage(room) {
  return room.owner_display_image || ROOM_IMAGE_FALLBACK;
}

function getRoomListingImage(room) {
  return room.images?.[0]?.image || ROOM_IMAGE_FALLBACK;
}

function roomBelongsToUser(room, user) {
  const ownerContact = String(room?.owner_contact || "").trim().toLowerCase();
  const ownerUsername = String(room?.owner_username || "").trim().toLowerCase();
  const username = String(user?.username || "").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  const phone = String(user?.profile?.phone_number || "").trim().toLowerCase();

  return (
    (ownerUsername && username === ownerUsername) ||
    (ownerContact && (email === ownerContact || phone === ownerContact)) ||
    (ownerContact && email.startsWith(ownerContact)) ||
    (ownerContact && phone.startsWith(ownerContact))
  );
}

function getOwnerRooms(user, rooms) {
  return rooms.filter((room) => roomBelongsToUser(room, user));
}

function getPrimaryOwnerRoom(user, rooms) {
  const ownerRooms = getOwnerRooms(user, rooms);
  if (ownerRooms.length === 0) {
    return null;
  }

  const statusRank = {
    APPROVED: 0,
    PENDING: 1,
    NEEDS_CHANGES: 2,
    REJECTED: 3,
    SUSPENDED: 4,
  };

  return [...ownerRooms].sort((a, b) => {
    const rankDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    return (b.id || 0) - (a.id || 0);
  })[0];
}

function getRoomOwnerDetails(room, pendingHostelUsers) {
  if (room?.owner_profile) {
    return room.owner_profile;
  }

  const ownerContact = String(room?.owner_contact || "").trim().toLowerCase();
  const ownerUsername = String(room?.owner_username || "").trim().toLowerCase();

  const matchedOwner = pendingHostelUsers.find((user) => {
    const username = String(user.username || "").trim().toLowerCase();
    const email = String(user.email || "").trim().toLowerCase();
    const phone = String(user.profile?.phone_number || "").trim().toLowerCase();

    return (
      (ownerUsername && username === ownerUsername) ||
      (ownerContact && (email === ownerContact || phone === ownerContact)) ||
      (ownerContact && email.startsWith(ownerContact)) ||
      (ownerContact && phone.startsWith(ownerContact))
    );
  });

  if (!matchedOwner) {
    return null;
  }

  return {
    hostel_name: matchedOwner.profile?.hostel_name,
    username: matchedOwner.username,
    email: matchedOwner.email,
    phone_number: matchedOwner.profile?.phone_number,
    business_reg_no: matchedOwner.profile?.business_reg_no,
    address: matchedOwner.profile?.address,
    display_image: matchedOwner.profile?.display_image,
  };
}

export default function RoomApprovals() {
  const [rooms, setRooms] = useState([]);
  const [pendingHostelUsers, setPendingHostelUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedHostelOwner, setSelectedHostelOwner] = useState(null);
  const [selectedOwnerRoom, setSelectedOwnerRoom] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOwnerRoomDetails = selectedOwnerRoom ? getRoomOwnerDetails(selectedOwnerRoom, pendingHostelUsers) : null;

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line
  }, [filter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsResponse, pendingUsersResponse] = await Promise.all([
        api.get(`/admin/rooms/?status=${filter}`),
        api.get(`/admin/users/?is_approved=false&user_type=hostel_owner`),
      ]);

      const roomsData = roomsResponse.data;
      const usersData = pendingUsersResponse.data;

      setRooms(roomsData.results || roomsData || []);
      setPendingHostelUsers(usersData.results || usersData || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveHostelUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve/`);
      fetchRooms();
    } catch (error) {
      console.error("Failed to approve hostel owner:", error);
      alert("Failed to approve hostel owner account");
    }
  };

  const filteredRooms = useMemo(() => {
    if (!query.trim()) return rooms;
    const q = query.toLowerCase();
    return rooms.filter(
      (r) =>
        String(r.title || "").toLowerCase().includes(q) ||
        String(r.description || "").toLowerCase().includes(q) ||
        String(r.owner_contact || "").toLowerCase().includes(q)
    );
  }, [rooms, query]);

  const updateStatus = async (roomId, status) => {
    setSubmitting(true);
    try {
      const { data } = await api.patch(`/admin/rooms/${roomId}/update_status/`, {
        status,
        review_note: reviewNote,
      });
      setRooms((previous) =>
        previous
          .map((room) => (room.id === roomId ? data : room))
          .filter((room) => room.status === filter)
      );
      setSelectedRoom(null);
      setReviewNote("");
      fetchRooms();
    } catch (error) {
      alert("Failed to update room status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Room Approvals</h1>
            <p className="mt-1 text-slate-500">
              Review room listings for quality, trust, and safety before publishing.
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
              onClick={fetchRooms}
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
            placeholder="Search rooms by title, description, contact..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </GlassCard>

      {pendingHostelUsers.length > 0 && (
        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Pending Hostel Owner Accounts</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
              {pendingHostelUsers.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingHostelUsers.map((u) => (
              <div
                key={u.id}
                className="rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedHostelOwner(u)}
                    className="flex flex-1 items-start gap-4 text-left"
                  >
                    <div className="overflow-hidden rounded-[20px] border border-[#d9e5f3] bg-white">
                      <img
                        src={u.profile?.display_image || ROOM_IMAGE_FALLBACK}
                        alt={u.profile?.hostel_name || u.username}
                        className="h-24 w-24 bg-white object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">
                        {u.profile?.hostel_name || u.username}
                      </p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {u.profile?.phone_number || "No phone"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {u.profile?.address || "No address"}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => approveHostelUser(u.id)}
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
      ) : filteredRooms.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="font-semibold text-slate-700">No {filter.toLowerCase()} rooms</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => (
                <GlassCard key={room.id} className="p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] xl:w-[280px]">
                      <div className="border-b border-[#e4ebf5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Listing Image
                      </div>
                      <img
                        src={getRoomListingImage(room)}
                        alt={room.title}
                        className="h-52 w-full bg-white object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-extrabold text-slate-900">{room.title}</h3>
                        <StatusBadge status={room.status} />
                      </div>

                      <p className="mt-2 line-clamp-2 text-slate-600">{room.description}</p>

                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                        <Info label="Price" value={`LKR ${room.price}`} />
                        <Info label="Gender" value={room.gender_allowed} />
                        <Info label="Contact" value={room.owner_contact} />
                        <button
                          type="button"
                          onClick={() => setSelectedOwnerRoom(room)}
                          className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 text-left transition hover:bg-white"
                        >
                          <div className="text-xs font-bold uppercase text-slate-500">Owner</div>
                          <div className="mt-1 font-semibold text-slate-900">{room.owner_username || "-"}</div>
                        </button>
                      </div>

                      {room.review_note && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm text-amber-900">
                            <strong>Review Note:</strong> {room.review_note}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] p-3 hover:bg-white"
                      title="View & Review"
                    >
                      <Eye size={20} className="text-slate-800" />
                    </button>
                  </div>
                </GlassCard>
              ))}
        </div>
      )}

      {selectedRoom && (
        <Modal onClose={() => { setSelectedRoom(null); setReviewNote(""); }}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Review Room</h2>
          <p className="mb-4 text-slate-500">{selectedRoom.title}</p>

          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <div className="border-b border-[#e4ebf5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Listing Image
            </div>
            <img
              src={getRoomListingImage(selectedRoom)}
              alt={selectedRoom.title}
              className="h-64 w-full bg-white object-contain"
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Price" value={`LKR ${selectedRoom.price}`} />
            <Info label="Contact" value={selectedRoom.owner_contact} />
            <Info label="Gender" value={selectedRoom.gender_allowed} />
            <Info
              label="Facilities"
              value={selectedRoom.facilities?.join(", ") || "None"}
            />
          </div>

          <div className="mb-4 rounded-2xl border border-[#e4ebf5] bg-white p-3">
            <div className="text-xs font-bold uppercase text-slate-500">Description</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{selectedRoom.description || "-"}</div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">Review Note</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Write feedback for owner (optional)"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <ActionButton onClick={() => updateStatus(selectedRoom.id, "APPROVED")} disabled={submitting} variant="green" icon={CheckCircle} text="Approve" />
            <ActionButton onClick={() => updateStatus(selectedRoom.id, "NEEDS_CHANGES")} disabled={submitting} variant="yellow" icon={AlertCircle} text="Needs Changes" />
            <ActionButton onClick={() => updateStatus(selectedRoom.id, "REJECTED")} disabled={submitting} variant="red" icon={XCircle} text="Reject" />
          </div>

          <button
            onClick={() => { setSelectedRoom(null); setReviewNote(""); }}
            className="mt-4 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>
        </Modal>
      )}

      {selectedHostelOwner && (
        <Modal onClose={() => setSelectedHostelOwner(null)}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Pending Hostel Owner</h2>
          <p className="mb-4 text-slate-500">{selectedHostelOwner.profile?.hostel_name || selectedHostelOwner.username}</p>

          <div className="mb-4 overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
            <img
              src={selectedHostelOwner.profile?.display_image || ROOM_IMAGE_FALLBACK}
              alt={selectedHostelOwner.profile?.hostel_name || selectedHostelOwner.username}
              className="h-64 w-full bg-white object-contain"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Info label="Hostel Name" value={selectedHostelOwner.profile?.hostel_name} />
            <Info label="Username" value={selectedHostelOwner.username} />
            <Info label="Email" value={selectedHostelOwner.email} />
            <Info label="Phone Number" value={selectedHostelOwner.profile?.phone_number || "-"} />
            <Info label="Business Reg No" value={selectedHostelOwner.profile?.business_reg_no || "-"} />
            <Info label="Address" value={selectedHostelOwner.profile?.address || "-"} />
          </div>

          <button
            onClick={() => setSelectedHostelOwner(null)}
            className="mt-4 w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] py-3 font-semibold text-slate-700 hover:bg-white"
          >
            Close
          </button>
        </Modal>
      )}

      {selectedOwnerRoom && (
        <Modal onClose={() => setSelectedOwnerRoom(null)}>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Hostel Owner Details</h2>
          <p className="mb-4 text-slate-500">{selectedOwnerRoom.owner_username || selectedOwnerRoom.title}</p>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
              <div className="border-b border-[#e4ebf5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Hostel Owner Image
              </div>
              <img
                src={getRoomOwnerImage(selectedOwnerRoom)}
                alt={selectedOwnerRoom.owner_username || selectedOwnerRoom.title}
                className="h-56 w-full bg-white object-contain"
              />
            </div>
            <div className="overflow-hidden rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff]">
              <div className="border-b border-[#e4ebf5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Listing Image
              </div>
              <img
                src={getRoomListingImage(selectedOwnerRoom)}
                alt={selectedOwnerRoom.title}
                className="h-56 w-full bg-white object-contain"
              />
            </div>
          </div>

          {selectedOwnerRoomDetails && (
            <div className="mb-4 rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
              <h3 className="mb-3 text-lg font-extrabold text-slate-900">Hostel Owner Details</h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Info label="Hostel Name" value={selectedOwnerRoomDetails.hostel_name} />
                <Info label="Username" value={selectedOwnerRoomDetails.username} />
                <Info label="Email" value={selectedOwnerRoomDetails.email} />
                <Info label="Phone Number" value={selectedOwnerRoomDetails.phone_number} />
                <Info label="Business Reg No" value={selectedOwnerRoomDetails.business_reg_no || "-"} />
                <Info label="Address" value={selectedOwnerRoomDetails.address} />
              </div>
            </div>
          )}

          <div className="mb-4 rounded-[24px] border border-[#e4ebf5] bg-[#f8fbff] p-4">
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">Listing Room Details</h3>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label="Room Title" value={selectedOwnerRoom.title} />
              <Info label="Status" value={selectedOwnerRoom.status} />
              <Info label="Price" value={`LKR ${selectedOwnerRoom.price}`} />
              <Info label="Gender" value={selectedOwnerRoom.gender_allowed} />
              <Info label="Contact" value={selectedOwnerRoom.owner_contact} />
              <Info label="Facilities" value={selectedOwnerRoom.facilities?.join(", ") || "None"} />
            </div>
            <div className="mt-3 rounded-2xl border border-[#e4ebf5] bg-white p-3">
              <div className="text-xs font-bold uppercase text-slate-500">Description</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOwnerRoom.description || "-"}</div>
            </div>
          </div>

          <button
            onClick={() => setSelectedOwnerRoom(null)}
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
      <div className="mt-1 truncate font-semibold text-slate-900">{value || "-"}</div>
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
