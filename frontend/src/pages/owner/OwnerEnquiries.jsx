import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import ownerApi from "../../api/ownerApi";

const StatusBadge = ({ status }) => {
  const colors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    checked_in: "bg-emerald-100 text-emerald-700",
    checked_out: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || colors.pending}`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
};

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
    } catch (error) {
      console.error("Failed to fetch enquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await ownerApi.patch(`/owner/enquiries/${bookingId}/status/`, { status: newStatus });
      fetchEnquiries();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Enquiries & Bookings</h1>
        <p className="text-slate-600">
          Manage booking requests from students for your listings.
        </p>
      </div>

      {enquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="font-bold text-slate-800 mb-2">No enquiries yet</p>
          <p className="text-sm text-slate-500">
            When students book your rooms, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-bold uppercase text-slate-500">
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Message</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      #{enquiry.id}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{enquiry.room_title}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{enquiry.student_name}</p>
                      <p className="text-sm text-slate-600">{enquiry.student_email}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {enquiry.message || 'No message'}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={enquiry.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {enquiry.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(enquiry.id, 'approved')}
                              className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                              title="Approve"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(enquiry.id, 'rejected')}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700"
                              title="Reject"
                            >
                              <X size={20} />
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
