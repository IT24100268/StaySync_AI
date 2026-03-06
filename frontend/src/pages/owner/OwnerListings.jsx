import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Eye, ToggleLeft, ToggleRight, MapPin, BadgeCheck } from "lucide-react";
import ownerApi from "../../api/ownerApi";

function StatusPill({ status, available }) {
  const normalized = String(status || "").toUpperCase();
  const stylesByStatus = {
    APPROVED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    NEEDS_CHANGES: "bg-orange-100 text-orange-700",
    SUSPENDED: "bg-slate-200 text-slate-700",
  };
  const labelByStatus = {
    APPROVED: available ? "Available" : "Unavailable",
    PENDING: "Pending Approval",
    REJECTED: "Rejected",
    NEEDS_CHANGES: "Needs Changes",
    SUSPENDED: "Unavailable",
  };

  return (
    <span
      className={[
        "px-3 py-1 rounded-full text-xs font-bold",
        stylesByStatus[normalized] || "bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      {labelByStatus[normalized] || (available ? "Available" : "Unavailable")}
    </span>
  );
}

export default function OwnerListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchListings = async () => {
    try {
      const { data } = await ownerApi.get("/owner/listings/");
      console.log("API Response:", data);
      // Handle paginated response
      const roomsList = data.results || data;
      setListings(Array.isArray(roomsList) ? roomsList : []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id, currentAvailable) => {
    const newStatusText = !currentAvailable ? "available" : "unavailable";
    if (!window.confirm(`Mark this listing as ${newStatusText}?`)) return;

    try {
      await ownerApi.patch(`/owner/listings/${id}/availability/`, {
        available: !currentAvailable,
      });
      await fetchListings();
      alert(`Listing marked as ${newStatusText}!`);
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      alert(error.response?.data?.error || "Failed to update availability. Please try again.");
    }
  };

  const total = listings.length;
  const availableCount = useMemo(
    () => listings.filter((l) => l.available).length,
    [listings]
  );

  if (loading) {
    return (
      <div className="py-10">
        <div className="h-7 w-40 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Listings</h1>
          <p className="text-slate-600">
            Total: <span className="font-bold text-slate-900">{total}</span> • Available:{" "}
            <span className="font-bold text-slate-900">{availableCount}</span>
          </p>
        </div>

        <Link
          to="/owner/listings/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
        >
          <Plus size={18} />
          Add Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="font-bold text-slate-800 mb-2">No listings yet</p>
          <p className="text-sm text-slate-500 mb-5">
            Create your first hostel/room listing to start receiving enquiries.
          </p>
          <Link
            to="/owner/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
          >
            <Plus size={18} />
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-bold uppercase text-slate-500">
                  <th className="px-6 py-3">Listing</th>
                  <th className="px-6 py-3">Rent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center">
                          <BadgeCheck size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">
                            {listing.title}
                          </p>
                          <p className="text-sm text-slate-600 flex items-center gap-1 truncate">
                            <MapPin size={14} className="text-slate-400" />
                            {listing.location || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      LKR {Number(listing.rent || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill status={listing.status} available={listing.available} />
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {listing.views || 0}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAvailability(listing.id, listing.available)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
                          title="Toggle availability"
                        >
                          {listing.available ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                        </button>

                        <Link
                          to={`/owner/listings/${listing.id}/edit`}
                          className="p-2 rounded-xl hover:bg-blue-50 text-blue-700"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </Link>

                        <button
                          onClick={() => alert("Connect view enquiries for this listing")}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
                          title="View enquiries"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600">
            Tip: add a column for “Enquiries” if your API provides it.
          </div>
        </div>
      )}
    </div>
  );
}
