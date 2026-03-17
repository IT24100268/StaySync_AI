import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Eye, ToggleLeft, ToggleRight, MapPin, BadgeCheck, Building2 } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, btnGold, EmptyState, Skeleton, PageHeader } from "./ownerTheme.jsx";

function StatusPill({ status, available }) {
  const n = String(status || "").toUpperCase();

  const map = {
    APPROVED: available ? "border-green-200 bg-green-50 text-green-700" : "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]",
    PENDING: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    NEEDS_CHANGES: "border-orange-200 bg-orange-50 text-orange-700",
    SUSPENDED: "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]",
  };

  const labels = {
    APPROVED: available ? "Available" : "Unavailable",
    PENDING: "Pending",
    REJECTED: "Rejected",
    NEEDS_CHANGES: "Needs Changes",
    SUSPENDED: "Suspended",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${map[n] || map.PENDING}`}>
      {labels[n] || (available ? "Available" : "Unavailable")}
    </span>
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
        <Skeleton h="h-72" rounded="rounded-[22px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="My Listings"
        subtitle={`${total} total · ${available} available`}
        action={
          <Link
            to="/owner/listings/new"
            className={btnGold}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 6px 20px rgba(201,168,76,0.22)",
            }}
          >
            <Plus size={15} /> Add Listing
          </Link>
        }
      />

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
        <div className={cardCls("overflow-hidden")} style={cardStyle()}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-[#eee5d7] bg-[#fbf8f2]">
                  {["Listing", "Rent", "Status", "Views", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8578] ${
                        i === 4 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {listings.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="border-b border-[#f1eadf] transition-colors hover:bg-[#fffaf2]"
                    style={idx % 2 === 0 ? {} : { background: "#fcfbf8" }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[12px]"
                          style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
                        >
                          <BadgeCheck size={15} className="text-[#b98b1f]" />
                        </div>
                        <div>
                          <p className="text-[13px] font-extrabold text-[#2b2823]">{l.title}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#7f786b]">
                            <MapPin size={10} /> {l.location || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[13px] font-extrabold text-[#b98b1f] tabular-nums">
                      LKR {Number(l.rent || 0).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill status={l.status} available={l.available} />
                    </td>

                    <td className="px-5 py-4 text-[13px] font-semibold text-[#6f6a5f] tabular-nums">
                      {l.views || 0}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleAvailability(l.id, l.available)}
                          className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#e7dfd1] text-[#6f6a5f] transition hover:border-[#dcc89a] hover:text-[#a07830] hover:bg-[#fff8ee]"
                          title="Toggle availability"
                        >
                          {l.available ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>

                        <Link
                          to={`/owner/listings/${l.id}/edit`}
                          className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#e7dfd1] text-[#6f6a5f] transition hover:border-[#dcc89a] hover:text-[#a07830] hover:bg-[#fff8ee]"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </Link>

                        <button
                          onClick={() => alert("Connect view enquiries for this listing")}
                          className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#e7dfd1] text-[#6f6a5f] transition hover:border-[#dcc89a] hover:text-[#a07830] hover:bg-[#fff8ee]"
                          title="View enquiries"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#f1eadf] px-5 py-3 text-[11px] text-[#8b8578] bg-[#fbf8f2]">
            Showing {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}