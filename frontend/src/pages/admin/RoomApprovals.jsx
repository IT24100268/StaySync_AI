import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCcw } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function RoomApprovals() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line
  }, [filter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/rooms/?status=${filter}`);
      setRooms(data.results || data || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
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
      await api.patch(`/admin/rooms/${roomId}/update_status/`, {
        status,
        review_note: reviewNote,
      });
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Room Approvals
            </h1>
            <p className="text-slate-600 mt-1">
              Review room listings for quality and safety before publishing.
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
              onClick={fetchRooms}
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
            placeholder="Search rooms by title, description, contact..."
            className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={44} />
          <p className="text-slate-700 font-semibold">
            No {filter.toLowerCase()} rooms
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => (
            <GlassCard key={room.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {room.title}
                    </h3>
                    <StatusBadge status={room.status} />
                  </div>

                  <p className="text-slate-600 mt-2 line-clamp-2">
                    {room.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <Info label="Price" value={`LKR ${room.price}`} />
                    <Info label="Gender" value={room.gender_allowed} />
                    <Info label="Contact" value={room.owner_contact} />
                    <Info label="Owner" value={room.owner_username || "—"} />
                  </div>

                  {room.review_note && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-100/60 border border-white/40">
                      <p className="text-sm text-amber-900">
                        <strong>Review Note:</strong> {room.review_note}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedRoom(room)}
                  className="p-3 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition"
                  title="View & Review"
                >
                  <Eye size={20} className="text-slate-800" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRoom && (
        <Modal onClose={() => { setSelectedRoom(null); setReviewNote(""); }}>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            Review Room
          </h2>
          <p className="text-slate-600 mb-4">{selectedRoom.title}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <Info label="Price" value={`LKR ${selectedRoom.price}`} />
            <Info label="Contact" value={selectedRoom.owner_contact} />
            <Info label="Gender" value={selectedRoom.gender_allowed} />
            <Info label="Facilities" value={selectedRoom.facilities?.join(", ") || "None"} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Review Note
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Write feedback for owner (optional)"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <ActionButton
              onClick={() => updateStatus(selectedRoom.id, "APPROVED")}
              disabled={submitting}
              variant="green"
              icon={CheckCircle}
              text="Approve"
            />
            <ActionButton
              onClick={() => updateStatus(selectedRoom.id, "NEEDS_CHANGES")}
              disabled={submitting}
              variant="yellow"
              icon={AlertCircle}
              text="Needs Changes"
            />
            <ActionButton
              onClick={() => updateStatus(selectedRoom.id, "REJECTED")}
              disabled={submitting}
              variant="red"
              icon={XCircle}
              text="Reject"
            />
          </div>

          <button
            onClick={() => { setSelectedRoom(null); setReviewNote(""); }}
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