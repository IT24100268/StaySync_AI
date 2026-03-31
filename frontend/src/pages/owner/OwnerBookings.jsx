import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Check,
  Clock,
  MessageCircle,
  Paperclip,
  RefreshCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ownerApi from "../../api/ownerApi";
import { btnGhost, cardCls, cardStyle, EmptyState, PageHeader, Skeleton } from "./ownerTheme.jsx";

const CHAT_SEEN_STORAGE_KEY = "owner-booking-chat-seen-v1";

const getStoredSeenMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHAT_SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const map = {
    pending: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    approved: "border-green-200 bg-green-50 text-green-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${map[normalized] || map.pending}`}>
      {normalized.toUpperCase()}
    </span>
  );
}

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-LK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const initials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);
  if (!parts.length) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const countUnreadStudentMessages = (messages, seenMessageId) => {
  const safeSeenId = toNumber(seenMessageId);
  return messages.reduce((count, message) => {
    const messageId = toNumber(message?.id);
    if (message?.sender_role === "student" && messageId > safeSeenId) {
      return count + 1;
    }
    return count;
  }, 0);
};

const lastStudentMessageId = (messages) =>
  messages.reduce((maxId, message) => {
    if (message?.sender_role !== "student") return maxId;
    return Math.max(maxId, toNumber(message?.id));
  }, 0);

export default function OwnerBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [activeChatBookingId, setActiveChatBookingId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatImageFile, setChatImageFile] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState("");
  const [chatError, setChatError] = useState("");

  const [seenMessageIds, setSeenMessageIds] = useState(() => getStoredSeenMap());
  const [unreadCounts, setUnreadCounts] = useState({});
  const seenMessageIdsRef = useRef(seenMessageIds);

  useEffect(() => {
    seenMessageIdsRef.current = seenMessageIds;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_SEEN_STORAGE_KEY, JSON.stringify(seenMessageIds));
    }
  }, [seenMessageIds]);

  useEffect(
    () => () => {
      if (chatImagePreview) {
        URL.revokeObjectURL(chatImagePreview);
      }
    },
    [chatImagePreview]
  );

  const fetchBookings = async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = await ownerApi.get("/owner/enquiries/");
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load owner bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markBookingAsSeen = (bookingId, messages) => {
    const latestStudentId = lastStudentMessageId(messages);

    setSeenMessageIds((current) => {
      const previousSeen = toNumber(current[bookingId]);
      const nextSeen = Math.max(previousSeen, latestStudentId);
      if (nextSeen <= previousSeen) return current;
      return { ...current, [bookingId]: nextSeen };
    });

    setUnreadCounts((current) => ({ ...current, [bookingId]: 0 }));
  };

  const refreshUnreadCounts = async (bookingItems = bookings) => {
    if (!Array.isArray(bookingItems) || bookingItems.length === 0) {
      setUnreadCounts({});
      return;
    }

    try {
      const responses = await Promise.all(
        bookingItems.map(async (booking) => {
          try {
            const { data } = await ownerApi.get(`/bookings/${booking.id}/messages/`);
            return { bookingId: booking.id, messages: Array.isArray(data) ? data : [] };
          } catch {
            return { bookingId: booking.id, messages: [] };
          }
        })
      );

      const nextCounts = {};
      responses.forEach(({ bookingId, messages }) => {
        const safeSeen = seenMessageIdsRef.current[bookingId] || 0;
        nextCounts[bookingId] = countUnreadStudentMessages(messages, safeSeen);
      });

      setUnreadCounts(nextCounts);
    } catch (error) {
      console.error("Failed to refresh unread counts:", error);
    }
  };

  const loadChatMessages = async (bookingId, options = {}) => {
    if (!bookingId) return;

    const { silent = false, markSeen = false } = options;

    if (!silent) {
      setChatLoading(true);
    }
    setChatError("");

    try {
      const { data } = await ownerApi.get(`/bookings/${bookingId}/messages/`);
      const messages = Array.isArray(data) ? data : [];
      setChatMessages(messages);

      if (markSeen) {
        markBookingAsSeen(bookingId, messages);
      } else {
        const safeSeen = seenMessageIdsRef.current[bookingId] || 0;
        const unread = countUnreadStudentMessages(messages, safeSeen);
        setUnreadCounts((current) => ({ ...current, [bookingId]: unread }));
      }
    } catch (error) {
      console.error("Failed to load booking chat:", error);
      setChatMessages([]);
      setChatError("Unable to load chat messages.");
    } finally {
      if (!silent) {
        setChatLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchBookings(true);
  }, []);

  useEffect(() => {
    if (!bookings.length) {
      setUnreadCounts({});
      return;
    }

    void refreshUnreadCounts(bookings);
    const pollId = window.setInterval(() => {
      void refreshUnreadCounts(bookings);
    }, 12000);

    return () => window.clearInterval(pollId);
  }, [bookings]);

  useEffect(() => {
    if (!activeChatBookingId) return;
    const pollId = window.setInterval(() => {
      void loadChatMessages(activeChatBookingId, { silent: true, markSeen: true });
    }, 6000);
    return () => window.clearInterval(pollId);
  }, [activeChatBookingId]);

  const summary = useMemo(() => {
    const pending = bookings.filter((item) => item.status === "pending").length;
    const approved = bookings.filter((item) => item.status === "approved").length;
    const rejected = bookings.filter((item) => item.status === "rejected").length;
    const unreadTotal = Object.values(unreadCounts).reduce((sum, value) => sum + toNumber(value), 0);
    return {
      total: bookings.length,
      pending,
      approved,
      rejected,
      unreadTotal,
    };
  }, [bookings, unreadCounts]);

  const roomIdFilter = useMemo(() => {
    const rawValue = searchParams.get("roomId");
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }, [searchParams]);

  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((item) => {
      const roomMatch = roomIdFilter === null || Number(item.room_id) === roomIdFilter;
      if (!roomMatch) return false;

      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      if (!statusMatch) return false;
      if (!q) return true;

      const haystack = [item.room_title, item.student_name, item.student_email, item.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [bookings, roomIdFilter, statusFilter, search]);

  const activeBooking = useMemo(
    () => bookings.find((item) => item.id === activeChatBookingId) || null,
    [bookings, activeChatBookingId]
  );

  const handleStatusUpdate = async (bookingId, nextStatus) => {
    const key = `${bookingId}-${nextStatus}`;
    setActionLoadingId(key);
    try {
      await ownerApi.patch(`/owner/enquiries/${bookingId}/status/`, { status: nextStatus });
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? { ...booking, status: nextStatus } : booking))
      );
    } catch (error) {
      console.error("Failed to update booking status:", error);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleOpenChat = async (bookingId) => {
    setActiveChatBookingId(bookingId);
    setChatText("");
    if (chatImagePreview) {
      URL.revokeObjectURL(chatImagePreview);
    }
    setChatImageFile(null);
    setChatImagePreview("");
    await loadChatMessages(bookingId, { markSeen: true });
  };

  const handleChatImageChange = (file) => {
    if (!file) return;

    if (!String(file.type || "").startsWith("image/")) {
      setChatError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setChatError("Image size must be 5MB or less.");
      return;
    }

    setChatError("");
    if (chatImagePreview) {
      URL.revokeObjectURL(chatImagePreview);
    }
    setChatImageFile(file);
    setChatImagePreview(URL.createObjectURL(file));
  };

  const clearChatImage = () => {
    if (chatImagePreview) {
      URL.revokeObjectURL(chatImagePreview);
    }
    setChatImageFile(null);
    setChatImagePreview("");
  };

  const handleSendMessage = async () => {
    const bookingId = activeChatBookingId;
    const text = chatText.trim();
    const imageFile = chatImageFile;

    if (!bookingId || (!text && !imageFile)) return;

    setChatSending(true);
    setChatError("");
    try {
      if (imageFile) {
        const payload = new FormData();
        if (text) payload.append("text", text);
        payload.append("image", imageFile);
        await ownerApi.post(`/bookings/${bookingId}/messages/`, payload);
      } else {
        await ownerApi.post(`/bookings/${bookingId}/messages/`, { text });
      }

      setChatText("");
      clearChatImage();
      await loadChatMessages(bookingId, { silent: true, markSeen: true });
    } catch (error) {
      console.error("Failed to send booking chat message:", error);
      setChatError("Failed to send message. Please try again.");
    } finally {
      setChatSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} h="h-24" rounded="rounded-[22px]" />
          ))}
        </div>
        <Skeleton h="h-80" rounded="rounded-[22px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Bookings"
        subtitle="One premium inbox for approvals and student chat."
        action={
          <button
            type="button"
            onClick={() => fetchBookings(false)}
            disabled={refreshing}
            className={btnGhost}
          >
            <RefreshCcw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total", value: summary.total, icon: CalendarDays },
          { label: "Pending", value: summary.pending, icon: Clock },
          { label: "Approved", value: summary.approved, icon: CalendarCheck },
          { label: "Rejected", value: summary.rejected, icon: CalendarX },
          { label: "New Msg", value: summary.unreadTotal, icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={cardCls("p-5")} style={cardStyle()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-[12px] border border-[#eadab1] bg-[#fff8e8]">
                <Icon size={14} className="text-[#b98b1f]" />
              </div>
              <span className="text-[26px] font-extrabold text-[#1e1d1a] tabular-nums">{value}</span>
            </div>
            <p className="text-[12px] text-[#6f6a5f]">{label}</p>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={BookOpen} title="No bookings yet" subtitle="Bookings from students will appear here." />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
          <div className={cardCls("p-4")} style={cardStyle()}>
            <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student, room, email, or message"
                className="w-full rounded-[14px] border border-[#e7dfd1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e1d1a] outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10"
              />

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "approved", label: "Approved" },
                  { key: "rejected", label: "Rejected" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`rounded-[12px] border px-3 py-2 text-xs font-bold transition ${
                      statusFilter === item.key
                        ? "border-[#d7be80] bg-[#fff5dc] text-[#8a6a1f]"
                        : "border-[#ebe4d8] bg-white text-[#6f6a5f] hover:bg-[#faf7f1]"
                    }`}
                    onClick={() => setStatusFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {roomIdFilter !== null ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e7d29d] bg-[#fff8e8] px-3 py-2">
                <p className="text-xs font-bold text-[#8a6a1f]">
                  Showing bookings for room #{roomIdFilter}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="inline-flex items-center rounded-[10px] border border-[#e3ca93] bg-white px-3 py-1.5 text-[11px] font-bold text-[#8a6a1f] transition hover:bg-[#fffaf0]"
                >
                  Clear filter
                </button>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#eee5d7] bg-[#fbf8f2]">
                    {["ID", "Room", "Student", "Status", "Requested", "Actions"].map((head, idx) => (
                      <th
                        key={head}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8578] ${
                          idx === 5 ? "text-right" : "text-left"
                        }`}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking, idx) => {
                    const status = String(booking.status || "pending").toLowerCase();
                    const isPending = status === "pending";
                    const unreadCount = toNumber(unreadCounts[booking.id]);

                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-[#f1eadf] transition-colors hover:bg-[#fffaf2]"
                        style={idx % 2 === 0 ? {} : { background: "#fcfbf8" }}
                      >
                        <td className="px-4 py-4 text-[11px] font-bold text-[#8b8578]">#{booking.id}</td>
                        <td className="px-4 py-4">
                          <p className="text-[13px] font-extrabold text-[#2b2823]">{booking.room_title}</p>
                          <p className="mt-0.5 text-[11px] text-[#7f786b]">Room #{booking.room_id}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[13px] font-bold text-[#2b2823]">{booking.student_name}</p>
                          <p className="mt-0.5 text-[11px] text-[#7f786b]">{booking.student_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-4 text-[12px] font-semibold text-[#5f5a4f]">{formatDate(booking.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(booking.id, "approved")}
                                  disabled={actionLoadingId === `${booking.id}-approved`}
                                  className="inline-flex items-center gap-1 rounded-[10px] border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-700 transition hover:bg-green-100 disabled:opacity-70"
                                >
                                  <Check size={13} />
                                  {actionLoadingId === `${booking.id}-approved` ? "Saving..." : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(booking.id, "rejected")}
                                  disabled={actionLoadingId === `${booking.id}-rejected`}
                                  className="inline-flex items-center gap-1 rounded-[10px] border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-70"
                                >
                                  <X size={13} />
                                  {actionLoadingId === `${booking.id}-rejected` ? "Saving..." : "Reject"}
                                </button>
                              </>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenChat(booking.id)}
                              className={`inline-flex items-center gap-1 rounded-[10px] border px-3 py-1.5 text-[11px] font-bold transition ${
                                activeChatBookingId === booking.id
                                  ? "border-[#d7be80] bg-[#fff5dc] text-[#8a6a1f]"
                                  : "border-[#e5dac7] bg-white text-[#a07830] hover:bg-[#fff8ee]"
                              }`}
                            >
                              <MessageCircle size={13} />
                              {activeChatBookingId === booking.id ? "Opened" : "Chat"}
                              {unreadCount > 0 ? (
                                <span className="ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#d54b45] px-1.5 py-0.5 text-[10px] font-black text-white">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                              ) : null}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className={cardCls("overflow-hidden p-0")} style={cardStyle()}>
            {!activeBooking ? (
              <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#e6ddcd] bg-[#fcfbf8] p-6 text-center">
                <MessageCircle size={24} className="text-[#a07830]" />
                <p className="text-sm font-bold text-[#2b2823]">Select a booking to open chat</p>
                <p className="max-w-xs text-xs text-[#7f786b]">
                  All student communication now lives inside Bookings, with live unread message counters.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[560px] flex-col">
                <div className="border-b border-[#ece3d3] bg-gradient-to-br from-[#fffaf0] via-[#fffdf8] to-[#f8f2e3] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-[#e7d29d] bg-[#fff3cf] text-[11px] font-black text-[#8a6a1f]">
                        {initials(activeBooking.student_name)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b9588]">Booking #{activeBooking.id}</p>
                        <p className="mt-1 text-sm font-extrabold text-[#1e1d1a]">{activeBooking.room_title}</p>
                        <p className="mt-0.5 text-xs text-[#6f6a5f]">{activeBooking.student_name}</p>
                      </div>
                    </div>
                    {toNumber(unreadCounts[activeBooking.id]) > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-[#f0b8b5] bg-[#fff3f2] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#bf2b24]">
                        {toNumber(unreadCounts[activeBooking.id])} New
                      </span>
                    ) : null}
                  </div>

                  {activeBooking.message ? (
                    <p className="mt-3 rounded-[10px] border border-[#ece3d3] bg-white px-3 py-2 text-xs text-[#5f5a4f]">
                      Student note: {activeBooking.message}
                    </p>
                  ) : null}
                </div>

                <div className="h-[380px] flex-1 overflow-y-auto bg-[#f7f4ee] px-4 py-4">
                  {chatLoading ? (
                    <div className="space-y-2">
                      <Skeleton h="h-12" rounded="rounded-[12px]" />
                      <Skeleton h="h-12" rounded="rounded-[12px]" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-center text-xs font-semibold text-[#7f786b]">No messages yet. Start the conversation.</p>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => {
                        const mine = message.sender_role === "owner";

                        return (
                          <div key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                            {!mine ? (
                              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d6deea] bg-white text-[10px] font-black text-[#4f678d]">
                                {initials(message.sender_name)}
                              </span>
                            ) : null}

                            <div
                              className={`max-w-[84%] rounded-[14px] border px-3 py-2 ${
                                mine
                                  ? "border-[#d6be83] bg-[#fff4d7] text-[#5f4a1e]"
                                  : "border-[#dde3ee] bg-white text-[#2b2823]"
                              }`}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                                {mine ? "You" : message.sender_name}
                              </p>
                              {message.image ? (
                                <a href={message.image} target="_blank" rel="noreferrer">
                                  <img
                                    src={message.image}
                                    alt="Chat attachment"
                                    className="mt-2 max-h-[220px] w-full max-w-[220px] rounded-[10px] border border-[#d8d8d8] object-cover"
                                  />
                                </a>
                              ) : null}
                              {message.text ? <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5">{message.text}</p> : null}
                              <p className="mt-1 text-right text-[10px] opacity-60">{formatDateTime(message.created_at)}</p>
                            </div>

                            {mine ? (
                              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#e8dcbf] bg-[#fff6e1] text-[10px] font-black text-[#8a6a1f]">
                                {initials("Owner")}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#ece3d3] bg-white px-4 py-3">
                  {chatError ? <p className="mb-2 text-xs font-semibold text-[#b42318]">{chatError}</p> : null}

                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e4d9c5] bg-white px-3 py-1.5 text-[12px] font-bold text-[#8a6a1f] transition hover:bg-[#fffaf0]">
                      <Paperclip size={14} />
                      Attach Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          handleChatImageChange(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {chatImageFile ? (
                      <button
                        type="button"
                        onClick={clearChatImage}
                        className="rounded-[10px] border border-[#f0b8b5] bg-[#fff3f2] px-3 py-1.5 text-[12px] font-bold text-[#bf2b24] transition hover:bg-[#ffe9e7]"
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>

                  {chatImagePreview ? (
                    <div className="mb-2">
                      <img
                        src={chatImagePreview}
                        alt="Selected attachment preview"
                        className="max-h-[140px] max-w-[180px] rounded-[10px] border border-[#d8d8d8] object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <textarea
                      value={chatText}
                      onChange={(event) => setChatText(event.target.value)}
                      placeholder="Write a clear reply for the student..."
                      className="h-20 w-full resize-none rounded-[12px] border border-[#e7dfd1] bg-[#fffefb] px-3 py-2 text-sm font-semibold text-[#1e1d1a] outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={chatSending || (!chatText.trim() && !chatImageFile)}
                      className="inline-flex h-20 w-14 items-center justify-center rounded-[12px] border border-[#dcc89a] bg-[#fff8e8] text-[#8a6a1f] transition hover:bg-[#fff2cf] disabled:opacity-60"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}
