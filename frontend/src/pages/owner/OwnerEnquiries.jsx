import { useEffect, useState } from "react";
import { Check, X, MessageSquareMore } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, EmptyState, Skeleton, PageHeader } from "./ownerTheme.jsx";

function StatusBadge({ status }) {
  const map = {
    pending: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    approved: "border-green-200 bg-green-50 text-green-700",
    confirmed: "border-cyan-200 bg-cyan-50 text-cyan-700",
    checked_in: "border-green-200 bg-green-50 text-green-700",
    checked_out: "border-[#ece5d8] bg-[#f8f6f1] text-[#7f786b]",
    rejected: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${map[status] || map.pending}`}>
      {String(status || "pending").replace("_", " ").toUpperCase()}
    </span>
  );
}

export default function OwnerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const { data } = await ownerApi.get("/owner/enquiries/");
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await ownerApi.patch(`/owner/enquiries/${id}/status/`, { status });
      fetchEnquiries();
    } catch (e) {
      console.error(e);
    }
  };

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
        icon={MessageSquareMore}
        title="Enquiries & Bookings"
        subtitle="Manage student requests and respond faster."
      />

      {enquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquareMore}
          title="No enquiries yet"
          subtitle="When students book or enquire about your listings, they'll appear here."
        />
      ) : (
        <div className={cardCls("overflow-hidden")} style={cardStyle()}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#eee5d7] bg-[#fbf8f2]">
                  {["ID", "Room", "Student", "Message", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8578] ${
                        i === 5 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {enquiries.map((e, idx) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#f1eadf] transition-colors hover:bg-[#fffaf2]"
                    style={idx % 2 === 0 ? {} : { background: "#fcfbf8" }}
                  >
                    <td className="px-5 py-4 text-[11px] font-bold text-[#8b8578]">#{e.id}</td>
                    <td className="px-5 py-4 text-[13px] font-extrabold text-[#2b2823]">{e.room_title}</td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-[#2b2823]">{e.student_name}</p>
                      <p className="mt-0.5 text-[11px] text-[#7f786b]">{e.student_email}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="truncate text-[12px] text-[#6f6a5f]">{e.message || "No message"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {e.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(e.id, "approved")}
                              className="grid h-8 w-8 place-items-center rounded-[10px] border border-green-200 bg-green-50 text-green-700 transition hover:bg-green-100"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(e.id, "rejected")}
                              className="grid h-8 w-8 place-items-center rounded-[10px] border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}