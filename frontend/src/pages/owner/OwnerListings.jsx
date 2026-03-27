import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BedDouble,
  Building2,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { btnGold, btnGhost, cardCls, cardStyle, EmptyState, PageHeader, Skeleton } from "./ownerTheme.jsx";

const LISTING_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80";

function statusTone(status, available) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "APPROVED" && available) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "PENDING") {
    return "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]";
  }
  if (normalized === "REJECTED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized === "NEEDS_CHANGES") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]";
}

function statusLabel(status, available) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return available ? "Active" : "Inactive";
  if (normalized === "NEEDS_CHANGES") return "Needs Changes";
  return normalized.replace(/_/g, " ");
}

function ListingCard({ listing, onToggleAvailability }) {
  const image = listing.images?.[0]?.url || LISTING_IMAGE_FALLBACK;
  const facilities = listing.facilities?.slice(0, 3) || [];
  const isAvailable = Boolean(listing.available);
  const availabilityTone = isAvailable
    ? {
        wrap: "border-emerald-200 bg-[linear-gradient(135deg,#effcf4,#dcfce7)] text-emerald-700 shadow-[0_12px_24px_rgba(16,185,129,0.12)]",
        icon: "bg-white text-emerald-600",
        note: "Visible to students",
      }
    : {
        wrap: "border-[#e8decd] bg-[linear-gradient(135deg,#ffffff,#f7f1e7)] text-[#6b604e] shadow-[0_12px_24px_rgba(62,47,23,0.08)]",
        icon: "bg-[#fff8e8] text-[#b58c2f]",
        note: "Hidden from students",
      };

  return (
    <article
      className={`${cardCls("overflow-hidden")} transition-all duration-300 hover:-translate-y-1`}
      style={{
        ...cardStyle(),
        boxShadow: "0 18px 38px rgba(32,24,12,0.08)",
      }}
    >
      <div className="grid gap-0 xl:grid-cols-[210px_minmax(0,1fr)]">
        <div className="relative border-b border-[#ece3d3] bg-[#f8f5ef] xl:border-b-0 xl:border-r">
          <img
            src={image}
            alt={listing.title}
            className="h-[220px] w-full bg-[#f1eadf] object-cover"
          />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
            <Sparkles size={12} />
            Listing
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[28px] font-black tracking-tight text-[#1e1d1a]">
                  {listing.title}
                </h3>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(
                    listing.status,
                    isAvailable
                  )}`}
                >
                  {statusLabel(listing.status, isAvailable)}
                </span>
              </div>

              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6f6a5f]">
                <MapPin size={14} className="text-[#b58c2f]" />
                {listing.location || "Location not set"}
              </p>

              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[#6f6a5f]">
                {listing.description || "Add a short room description to help students understand the space better."}
              </p>
            </div>

            <div className="rounded-[20px] border border-[#e7d29d] bg-[#fff8e8] px-5 py-4 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a6a00]">Monthly Rent</p>
              <p className="mt-2 text-[32px] font-black leading-none tracking-tight text-[#1e1d1a]">
                LKR {Number(listing.rent || listing.price || 0).toLocaleString()}
              </p>
              <p className="mt-2 text-xs font-semibold text-[#8b6c26]">
                {listing.gender_allowed ? `${String(listing.gender_allowed).replace(/^./, (c) => c.toUpperCase())} friendly` : "Open to all"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-wrap gap-2">
              {facilities.length ? (
                facilities.map((facility) => (
                  <span
                    key={facility}
                    className="inline-flex rounded-full border border-[#ece3d3] bg-[#fcfbf8] px-3 py-2 text-xs font-bold text-[#5f5a4f]"
                  >
                    {facility}
                  </span>
                ))
              ) : (
                <span className="inline-flex rounded-full border border-[#ece3d3] bg-[#fcfbf8] px-3 py-2 text-xs font-bold text-[#8b8578]">
                  No facilities added
                </span>
              )}
            </div>

            <div className="rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-3 text-sm font-semibold text-[#6f6a5f]">
              {listing.views || 0} views
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#efe7db] pt-4">
            <button
              onClick={() => onToggleAvailability(listing.id, isAvailable)}
              className={`group inline-flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${availabilityTone.wrap}`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-[14px] transition ${availabilityTone.icon}`}>
                {isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </span>
              <span className="text-left leading-tight">
                <span className="block text-sm font-black">{isAvailable ? "Active" : "Inactive"}</span>
                <span className="block text-[11px] font-semibold opacity-80">{availabilityTone.note}</span>
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/owner/listings/${listing.id}/edit`}
                className="inline-flex items-center gap-2 rounded-[16px] border border-[#e4d9c5] bg-[linear-gradient(135deg,#ffffff,#f9f4ea)] px-4 py-3 text-sm font-black text-[#5f523d] shadow-[0_10px_22px_rgba(49,37,17,0.06)] transition hover:-translate-y-0.5 hover:border-[#d7be8c] hover:text-[#8a6a1f]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-[#fff8e8] text-[#b58c2f]">
                  <Pencil size={15} />
                </span>
                Edit
              </Link>

              <button
                onClick={() => alert("Connect view enquiries for this listing")}
                className="inline-flex items-center gap-2 rounded-[16px] border border-[#e4d9c5] bg-white px-4 py-3 text-sm font-black text-[#5f5a4f] shadow-[0_10px_22px_rgba(49,37,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#d7be8c] hover:bg-[#faf6ef] hover:text-[#1e1d1a]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-[#f7f2e8] text-[#8a7b62]">
                  <Eye size={15} />
                </span>
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function OwnerListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data } = await ownerApi.get("/owner/listings/");
      setListings(Array.isArray(data.results || data) ? data.results || data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id, cur) => {
    if (!window.confirm(`Mark as ${!cur ? "available" : "unavailable"}?`)) return;

    try {
      await ownerApi.patch(`/owner/listings/${id}/availability/`, { available: !cur });
      fetchListings();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to update.");
    }
  };

  const total = listings.length;
  const available = useMemo(() => listings.filter((l) => l.available).length, [listings]);

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
        icon={Building2}
        title="Listings"
        subtitle="Manage your room and hostel listings with a cleaner premium overview."
        action={
          <Link
            to="/owner/listings/new"
            className={btnGold}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
            }}
          >
            <Plus size={15} /> Add New Room
          </Link>
        }
      />

      <section
        className={`${cardCls("p-5")} flex flex-wrap items-center gap-3`}
        style={cardStyle()}
      >
        <div className="inline-flex items-center gap-3 rounded-[18px] border border-[#e7d29d] bg-[#fff8e8] px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-white text-[#b98b1f]">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a6a00]">Total Listings</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1d1a]">{total}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-3 rounded-[18px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-white text-[#b98b1f]">
            <BedDouble size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Currently Active</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1d1a]">{available}</p>
          </div>
        </div>
      </section>

      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No listings yet"
          subtitle="Create your first hostel or room listing to start receiving enquiries."
          action={
            <Link
              to="/owner/listings/new"
              className={btnGold}
              style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)" }}
            >
              <Plus size={15} /> Create Listing
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onToggleAvailability={toggleAvailability}
            />
          ))}
        </div>
      )}
    </div>
  );
}
