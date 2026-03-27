import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  MailQuestion,
  MessageSquareMore,
  Plus,
  X,
} from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { btnGold, btnGhost, cardCls, cardStyle, EmptyState, PageHeader, Skeleton } from "./ownerTheme.jsx";

const ENQUIRY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80";

function statusTone(status) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    pending: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    confirmed: "border-cyan-200 bg-cyan-50 text-cyan-700",
    checked_in: "border-emerald-200 bg-emerald-50 text-emerald-700",
    checked_out: "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return map[normalized] || map.pending;
}

function statusLabel(status) {
  return String(status || "pending").replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function SummaryPanel({ title, items, dark = false, buttonLabel = "View All", buttonTo = "/owner/bookings" }) {
  return (
    <section
      className={`${cardCls("p-5")} space-y-4`}
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
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-[18px] font-extrabold tracking-tight ${dark ? "text-white" : "text-[#1e1d1a]"}`}>{title}</h3>
        <span
          className={`rounded-[14px] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${
            dark ? "bg-[#b58c2f] text-white" : "border border-[#e7d29d] bg-[#fff8e8] text-[#9a6a00]"
          }`}
        >
          Most Recent
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-[18px] border px-4 py-4 ${
              dark ? "border-white/10 bg-white/5" : "border-[#ece3d3] bg-[#fcfbf8]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 place-items-center rounded-[14px] ${
                  dark ? "bg-white/10 text-[#f0d682]" : "bg-[#fff8e8] text-[#b58c2f]"
                }`}
              >
                <item.icon size={16} />
              </div>
              <span className={`text-sm font-semibold ${dark ? "text-white" : "text-[#2b2823]"}`}>{item.label}</span>
            </div>
            <span className={`text-3xl font-black tracking-tight ${dark ? "text-white" : "text-[#1e1d1a]"}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <Link
        to={buttonTo}
        className={`inline-flex w-full items-center justify-center rounded-[16px] px-5 py-3 text-sm font-semibold transition ${
          dark
            ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            : "border border-[#e7dfd1] bg-white text-[#5f5a4f] hover:bg-[#faf7f1]"
        }`}
      >
        {buttonLabel}
      </Link>
    </section>
  );
}

function EnquiryCard({ enquiry, image, onStatusUpdate }) {
  const canRespond = enquiry.status === "pending";

  return (
    <article
      className={`${cardCls("overflow-hidden")} transition-all duration-300 hover:-translate-y-1`}
      style={{
        ...cardStyle(),
        boxShadow: "0 18px 38px rgba(32,24,12,0.08)",
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[160px_minmax(0,1fr)]">
        <div className="border-b border-[#ece3d3] bg-[#f8f5ef] lg:border-b-0 lg:border-r">
          <img
            src={image}
            alt={enquiry.room_title}
            className="h-[180px] w-full bg-[#f1eadf] object-cover"
          />
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[30px] font-black tracking-tight text-[#1e1d1a]">
                  {enquiry.student_name}
                </h3>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone(enquiry.status)}`}>
                  {statusLabel(enquiry.status)}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#6f6a5f]">{enquiry.room_title}</p>
              <p className="mt-1 text-sm text-[#8b8578]">{enquiry.student_email}</p>
            </div>

            <div className="rounded-[18px] border border-[#e7d29d] bg-[#fff8e8] px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a6a00]">Received</p>
              <p className="mt-2 text-sm font-black text-[#1e1d1a]">{enquiry.created_at_label}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Student</p>
              <p className="mt-2 truncate text-sm font-extrabold text-[#1e1d1a]">{enquiry.student_name}</p>
            </div>
            <div className="rounded-[16px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Status</p>
              <p className="mt-2 text-sm font-extrabold text-[#1e1d1a]">{statusLabel(enquiry.status)}</p>
            </div>
            <div className="rounded-[16px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Booking ID</p>
              <p className="mt-2 text-sm font-extrabold text-[#1e1d1a]">#{enquiry.id}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Message</p>
            <p className="mt-2 text-[15px] leading-7 text-[#5f5a4f]">
              {enquiry.message || "No message was included with this enquiry."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {canRespond ? (
              <>
                <button
                  onClick={() => onStatusUpdate(enquiry.id, "approved")}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Check size={15} />
                  Approve
                </button>
                <button
                  onClick={() => onStatusUpdate(enquiry.id, "rejected")}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  <X size={15} />
                  Reject
                </button>
              </>
            ) : (
              <span className={`inline-flex items-center rounded-[14px] border px-4 py-2.5 text-sm font-bold ${statusTone(enquiry.status)}`}>
                {statusLabel(enquiry.status)}
              </span>
            )}

            <button
              onClick={() => alert("Detailed enquiry view can be connected here.")}
              className={`${btnGhost} px-4 py-2.5`}
            >
              <Eye size={15} />
              Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function OwnerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enquiriesRes, listingsRes] = await Promise.all([
        ownerApi.get("/owner/enquiries/"),
        ownerApi.get("/owner/listings/"),
      ]);

      const enquiryData = Array.isArray(enquiriesRes.data) ? enquiriesRes.data : [];
      const listingData = Array.isArray(listingsRes.data?.results || listingsRes.data)
        ? listingsRes.data?.results || listingsRes.data
        : [];

      setEnquiries(enquiryData);
      setListings(listingData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await ownerApi.patch(`/owner/enquiries/${id}/status/`, { status });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const enrichedEnquiries = useMemo(() => {
    return enquiries.map((enquiry) => {
      const matchedListing = listings.find((listing) => listing.id === enquiry.room_id);
      return {
        ...enquiry,
        created_at_label: enquiry.created_at
          ? new Date(enquiry.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recently",
        image: matchedListing?.images?.[0]?.url || ENQUIRY_IMAGE_FALLBACK,
      };
    });
  }, [enquiries, listings]);

  const summary = useMemo(() => {
    const pending = enrichedEnquiries.filter((item) => item.status === "pending").length;
    const approved = enrichedEnquiries.filter((item) => item.status === "approved").length;
    const rejected = enrichedEnquiries.filter((item) => item.status === "rejected").length;
    return {
      total: enrichedEnquiries.length,
      pending,
      approved,
      rejected,
    };
  }, [enrichedEnquiries]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <Skeleton h="h-[420px]" rounded="rounded-[26px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquareMore}
        title="Enquiries"
        subtitle="Review and manage guest enquiries for your hostel."
        action={
          <Link
            to="/owner/listings/new"
            className={btnGold}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
            }}
          >
            <Plus size={15} /> Add Enquiry
          </Link>
        }
      />

      {enrichedEnquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquareMore}
          title="No enquiries yet"
          subtitle="When students book or enquire about your listings, they will appear here."
        />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-5">
            {enrichedEnquiries.map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                image={enquiry.image}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>

          <div className="space-y-5">
            <SummaryPanel
              title="Bookings"
              items={[
                { label: "All Enquiries", value: summary.total, icon: MessageSquareMore },
                { label: "Pending", value: summary.pending, icon: CalendarClock },
                { label: "Approved", value: summary.approved, icon: CheckCircle2 },
              ]}
              buttonLabel="View All"
              buttonTo="/owner/bookings"
            />

            <SummaryPanel
              title="Response Queue"
              items={[
                { label: "Pending Review", value: summary.pending, icon: MailQuestion },
                { label: "Rejected", value: summary.rejected, icon: X },
                { label: "Approved", value: summary.approved, icon: Check },
              ]}
              dark
              buttonLabel="Open Queue"
              buttonTo="/owner/enquiries"
            />
          </div>
        </section>
      )}
    </div>
  );
}
