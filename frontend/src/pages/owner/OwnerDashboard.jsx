import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Eye,
  MailQuestion,
  MapPin,
  MessageSquare,
  Plus,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import ownerApi from "../../api/ownerApi";
import { useAuth } from "../../context/AuthContext";
import { Avatar, cardCls, cardStyle, Skeleton } from "./ownerTheme.jsx";

const commonDashboardImage =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80";
const JAFFNA_UNIVERSITY_CENTER = { lat: 9.6848, lng: 80.0220 };

function money(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatWhen(dateValue) {
  if (!dateValue) return "Recently";
  const diffMinutes = Math.max(1, Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function statusChip(status) {
  const value = String(status || "").toLowerCase();
  const map = {
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return map[value] || "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]";
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function StatCard({ label, value, note, icon: Icon, accent = false }) {
  return (
    <div
      className={cardCls("p-5 transition-all duration-300 hover:-translate-y-0.5")}
      style={cardStyle(accent)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#6f6a5f]">{label}</p>
          <p className={`mt-2 text-[42px] font-black leading-none tracking-tight ${accent ? "text-[#b58c2f]" : "text-[#1e1d1a]"}`}>
            {value}
          </p>
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#8d8678]">
            <ArrowUpRight size={12} className={accent ? "text-[#b58c2f]" : "text-[#8d8678]"} />
            {note}
          </p>
        </div>
        <div
          className="grid h-12 w-12 place-items-center rounded-[16px]"
          style={{
            background: accent ? "#fff7df" : "#f7f4ee",
            border: `1px solid ${accent ? "#e7d29d" : "#ebe4d8"}`,
          }}
        >
          <Icon size={20} className={accent ? "text-[#b58c2f]" : "text-[#6f6a5f]"} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, className = "", children, dark = false }) {
  return (
    <section
      className={`${cardCls(`p-5 ${className}`)} `}
      style={
        dark
          ? {
              background: "linear-gradient(180deg,#1a1a1f 0%, #17171b 100%)",
              border: "1px solid rgba(212,175,55,0.12)",
              boxShadow: "0 18px 44px rgba(14,14,18,0.18)",
            }
          : cardStyle()
      }
    >
      <div className="mb-4">
        <h3 className={`text-[18px] font-extrabold tracking-tight ${dark ? "text-white" : "text-[#1e1d1a]"}`}>{title}</h3>
        {subtitle ? <p className={`mt-1 text-sm ${dark ? "text-white/55" : "text-[#6f6a5f]"}`}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ listings: 0, views: 0, enquiries: 0, revenue: 0 });
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [summaryRes, listingsRes, enquiriesRes] = await Promise.all([
          ownerApi.get("/owner/analytics/summary/"),
          ownerApi.get("/owner/listings/"),
          ownerApi.get("/owner/enquiries/"),
        ]);

        setSummary(summaryRes.data || {});
        setListings(listingsRes.data?.results || listingsRes.data || []);
        setEnquiries(enquiriesRes.data || []);

        try {
          const vRes = await ownerApi.get("/owner/verification/");
          setVerificationStatus(vRes.data);
        } catch { /* not a hostel owner or no profile yet */ }
      } catch (error) {
        console.error("Failed to load owner dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const ownerName = user?.first_name || user?.username || "Owner";
  const dashboardImage = user?.profile?.display_image || commonDashboardImage;
  const hostelContact = user?.profile?.phone_number || "Phone not updated";
  const hostelLocation = user?.profile?.address || "Location not updated";
  const hostelLatitude = Number.parseFloat(user?.profile?.latitude);
  const hostelLongitude = Number.parseFloat(user?.profile?.longitude);
  const hasHostelLocation = Number.isFinite(hostelLatitude) && Number.isFinite(hostelLongitude);
  const hostelMapCenter = hasHostelLocation
    ? { lat: hostelLatitude, lng: hostelLongitude }
    : JAFFNA_UNIVERSITY_CENTER;
  const hostelMapUrl = `https://maps.google.com/maps?q=${hostelMapCenter.lat},${hostelMapCenter.lng}&z=${
    hasHostelLocation ? 16 : 13
  }&output=embed`;

  const derived = useMemo(() => {
    const approvedBookings = enquiries.filter((item) => normalizeStatus(item.status) === "approved");
    const pendingBookings = enquiries.filter((item) => normalizeStatus(item.status) === "pending");
    const rejectedBookings = enquiries.filter((item) => normalizeStatus(item.status) === "rejected");
    const activeListings = listings.filter((item) => item.available || normalizeStatus(item.status) === "approved");
    const topListing = listings[0] || null;

    const estimatedRevenue = approvedBookings.reduce((sum, booking) => {
      const room = listings.find((item) => item.id === booking.room_id);
      return sum + Number(room?.rent || room?.price || 0);
    }, 0);

    const averageRent =
      listings.length > 0
        ? listings.reduce((sum, room) => sum + Number(room.rent || room.price || 0), 0) / listings.length
        : 0;

    return {
      approvedBookings,
      pendingBookings,
      rejectedBookings,
      activeListings,
      estimatedRevenue,
      averageRent,
      topListing,
      featuredListings: listings.slice(0, 2),
      latestApproved: approvedBookings.slice(0, 2),
    };
  }, [enquiries, listings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton h="h-28" rounded="rounded-[24px]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} h="h-36" rounded="rounded-[24px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
          <Skeleton h="h-[320px]" rounded="rounded-[24px]" />
          <Skeleton h="h-[320px]" rounded="rounded-[24px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className={cardCls("p-6 md:p-7")}
        style={{
          background: "linear-gradient(135deg,#ffffff 0%, #fcfaf6 100%)",
          border: "1px solid #ece3d3",
          boxShadow: "0 16px 38px rgba(32,24,12,0.06)",
        }}
      >
        <p className="text-sm font-medium text-[#7f786b]">Here&apos;s what&apos;s happening with your hostel today.</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1e1d1a]">
          Welcome back, <span className="text-[#b58c2f]">{ownerName}!</span>
        </h1>
      </section>

      {/* Verification notification banner */}
      {verificationStatus?.is_under_verification && verificationStatus?.verification?.status !== "verified" && (
        <Link
          to="/owner/verification"
          className="block rounded-[24px] border border-amber-300 bg-amber-50 p-5 transition hover:bg-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-extrabold text-amber-900">Action Required: Identity Verification</p>
              <p className="mt-1 text-sm text-amber-800">
                {verificationStatus?.verification?.status === "submitted"
                  ? "Your verification form has been submitted and is under admin review. You will regain full access once approved."
                  : "The admin has requested identity verification. You cannot add new rooms or receive bookings until verified. Click here to complete the form."}
              </p>
              {verificationStatus?.verification_note && (
                <p className="mt-2 text-xs font-semibold text-amber-700">Admin note: {verificationStatus.verification_note}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-700">
              {verificationStatus?.verification?.status === "submitted" ? "Under Review" : "Complete Now →"}
            </span>
          </div>
        </Link>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Listings"
          value={summary.listings || listings.length}
          note={`${derived.activeListings.length} currently active`}
          icon={BedDouble}
        />
        <StatCard
          label="Total Views"
          value={Number(summary.views || 0).toLocaleString()}
          note="Across all published listings"
          icon={Eye}
        />
        <StatCard
          label="Total Enquiries"
          value={summary.enquiries || enquiries.length}
          note={`${derived.pendingBookings.length} waiting for review`}
          icon={MessageSquare}
        />
        <StatCard
          label="Estimated Revenue"
          value={money(derived.estimatedRevenue || summary.revenue || 0)}
          note={`${derived.approvedBookings.length} approved bookings contributing`}
          icon={TrendingUp}
          accent
        />
      </section>

      <Panel
        title="Hostel Snapshot"
        subtitle="Your shared hostel image and the latest room listings in one clean view."
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.95fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-[#ece3d3] bg-[#f8f5ef]">
              <img
                src={dashboardImage}
                alt="Hostel dashboard overview"
                className="h-[360px] w-full bg-[#f1eadf] object-contain"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b9588]">Active Listings</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#1e1d1a]">{derived.activeListings.length}</p>
              </div>
              <div className="rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b9588]">Pending Requests</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#1e1d1a]">{derived.pendingBookings.length}</p>
              </div>
              <div className="rounded-[18px] border border-[#e7d29d] bg-[#fff8e8] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6a00]">Estimated Revenue</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#1e1d1a]">
                  {money(derived.estimatedRevenue || summary.revenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-extrabold tracking-tight text-[#1e1d1a]">Hostel Details</h4>
              <span className="rounded-full border border-[#ece3d3] bg-[#fcfbf8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8d8678]">
                Shared Profile
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Hostel Contact</p>
                    <p className="mt-1 text-sm font-extrabold text-[#1e1d1a]">{hostelContact}</p>
                  </div>
                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Hostel Location</p>
                    <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-[#1e1d1a]">
                      <MapPin size={12} className="mt-0.5 shrink-0 text-[#b58c2f]" />
                      <span className="line-clamp-2">{hostelLocation}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8]">
                <div className="border-b border-[#ece3d3] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Hostel Map</p>
                  <p className="mt-1 text-xs font-semibold text-[#6f6a5f]">
                    {hasHostelLocation ? "Shared hostel profile location" : "Default view near University of Jaffna"}
                  </p>
                </div>
                <iframe
                  title="Hostel location preview"
                  src={hostelMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[240px] w-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-6">
          <Panel
            title="Featured Rooms"
            subtitle="Two room listings from your hostel with images and quick details."
          >
            {derived.featuredListings.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {derived.featuredListings.map((listing) => {
                  const listingImage = listing.images?.[0]?.url || commonDashboardImage;
                  return (
                    <article
                      key={listing.id}
                      className="overflow-hidden rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8]"
                    >
                      <div className="border-b border-[#ece3d3] bg-[#f8f5ef]">
                        <img
                          src={listingImage}
                          alt={listing.title}
                          className="h-[220px] w-full bg-[#f1eadf] object-contain"
                        />
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[20px] font-black tracking-tight text-[#1e1d1a]">
                              {listing.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-[#6f6a5f]">
                              {listing.description || "No description yet."}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                              String(listing.status || "").toUpperCase() === "APPROVED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {String(listing.status || "pending").replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] bg-white px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Monthly Rent</p>
                            <p className="mt-1 text-sm font-extrabold text-[#1e1d1a]">
                              {money(listing.rent || listing.price)}
                            </p>
                          </div>
                          <div className="rounded-[16px] bg-white px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Location</p>
                            <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-[#1e1d1a]">
                              <MapPin size={12} className="mt-0.5 shrink-0 text-[#b58c2f]" />
                              <span className="line-clamp-2">{listing.address || listing.location || "Location not set"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#e7dfd1] bg-[#fbf8f2] px-6 py-14 text-center">
                <p className="text-sm font-semibold text-[#6f6a5f]">Create your first listing to show room details here.</p>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent Bookings"
            subtitle="Latest booking requests with student profile details."
          >
            {enquiries.length ? (
              <div className="space-y-4">
                {enquiries.slice(0, 4).map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {item.student_display_image ? (
                          <img
                            src={item.student_display_image}
                            alt={item.student_name || "Student profile"}
                            className="h-12 w-12 rounded-full border border-[#ece3d3] object-cover"
                          />
                        ) : (
                          <Avatar name={item.student_name || "Student"} size="md" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-lg font-extrabold text-[#1e1d1a]">
                            {item.student_name || "Student"}
                          </p>
                          <p className="truncate text-sm font-semibold text-[#6f6a5f]">
                            {item.student_email || "Email not provided"}
                          </p>
                          <p className="truncate text-xs text-[#9b9588]">
                            {item.student_university || "University not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-3">
                        <span className="rounded-full border border-[#ece3d3] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8d8678]">
                          {formatWhen(item.created_at)}
                        </span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusChip(item.status)}`}>
                          {String(item.status || "pending").replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[14px] border border-[#ece3d3] bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b9588]">Booking ID</p>
                        <p className="mt-1 text-sm font-extrabold text-[#1e1d1a]">BK-{item.id}</p>
                      </div>
                      <div className="rounded-[14px] border border-[#ece3d3] bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b9588]">Room</p>
                        <p className="mt-1 truncate text-sm font-extrabold text-[#1e1d1a]">{item.room_title}</p>
                      </div>
                      <div className="rounded-[14px] border border-[#ece3d3] bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b9588]">Student Phone</p>
                        <p className="mt-1 text-sm font-extrabold text-[#1e1d1a]">{item.student_phone || "Not shared"}</p>
                      </div>
                    </div>

                    {item.message ? (
                      <p className="mt-3 rounded-[12px] border border-[#ece3d3] bg-white px-3 py-2 text-xs text-[#5f5a4f]">
                        Student message: {item.message}
                      </p>
                    ) : null}

                    <div className="mt-3 flex justify-end">
                      <Link
                        to="/owner/bookings"
                        className="inline-flex items-center justify-center rounded-[12px] border border-[#e7dfd1] bg-white px-4 py-2 text-xs font-semibold text-[#5f5a4f] transition hover:bg-[#faf7f1]"
                      >
                        Open Booking
                      </Link>
                    </div>
                  </article>
                ))}
                <div className="pt-1 text-center">
                  <Link
                    to="/owner/bookings"
                    className="inline-flex items-center justify-center rounded-[14px] border border-[#e7dfd1] bg-white px-6 py-2.5 text-sm font-semibold text-[#5f5a4f] transition hover:bg-[#faf7f1]"
                  >
                    Open Full Bookings Inbox
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#e7dfd1] bg-[#fbf8f2] px-6 py-10 text-center">
                <p className="text-sm font-semibold text-[#6f6a5f]">No bookings yet. Student profiles will appear here with each new booking.</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Quick Highlights"
            subtitle="Useful summary details from your latest room activity."
          >
            <div className="grid gap-3">
              <div className="rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Average Room Rent</p>
                <p className="mt-2 text-xl font-black tracking-tight text-[#1e1d1a]">{money(derived.averageRent)}</p>
              </div>
              <div className="rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Hostel Location</p>
                <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#1e1d1a]">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#b58c2f]" />
                  <span className="line-clamp-2">{hostelLocation}</span>
                </p>
              </div>
              <div className="rounded-[18px] border border-[#e7d29d] bg-[#fff8e8] px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a6a00]">Estimated Revenue</p>
                <p className="mt-2 text-xl font-black tracking-tight text-[#1e1d1a]">
                  {money(derived.estimatedRevenue || summary.revenue || 0)}
                </p>
              </div>
              <div
                className="rounded-[20px] px-4 py-4 text-white"
                style={{
                  background: "linear-gradient(180deg,#1a1a1f 0%, #17171b 100%)",
                  border: "1px solid rgba(212,175,55,0.12)",
                  boxShadow: "0 18px 44px rgba(14,14,18,0.18)",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Revenue Pulse</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#f0d682]">
                  {money(derived.estimatedRevenue || summary.revenue || 0)}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Approved</p>
                    <p className="mt-1 text-lg font-black text-white">{derived.approvedBookings.length}</p>
                  </div>
                  <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Hostel Contact</p>
                    <p className="mt-1 truncate text-sm font-black text-white">
                      {hostelContact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Booking Overview"
            subtitle="Quick booking actions and status totals."
          >
            <div className="grid gap-3">
              {[
                {
                  label: "Approved Rooms",
                  value: derived.activeListings.length,
                  icon: CheckCircle2,
                  tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
                },
                {
                  label: "Approved Bookings",
                  value: derived.approvedBookings.length,
                  icon: CheckCircle2,
                  tone: "border-emerald-200 bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Pending",
                  value: derived.pendingBookings.length,
                  icon: CalendarClock,
                  tone: "border-amber-200 bg-amber-50 text-amber-700",
                },
                {
                  label: "Rejected",
                  value: derived.rejectedBookings.length,
                  icon: MailQuestion,
                  tone: "border-rose-200 bg-rose-50 text-rose-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4"
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#2b2823]">
                    <div className={`grid h-10 w-10 place-items-center rounded-[14px] ${item.tone}`}>
                      <item.icon size={16} />
                    </div>
                    {item.label}
                  </div>
                  <span className="text-3xl font-black tracking-tight text-[#1e1d1a]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/owner/listings/new"
                className="inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#a07830)",
                  boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
                }}
              >
                <Plus size={14} />
                New Listing
              </Link>
              <Link
                to="/owner/bookings"
                className="inline-flex items-center justify-center rounded-[16px] border border-[#e7dfd1] bg-white px-6 py-3 text-sm font-semibold text-[#5f5a4f] transition hover:bg-[#faf7f1]"
              >
                View Bookings
              </Link>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
