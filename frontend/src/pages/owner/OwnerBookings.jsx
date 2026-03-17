import { useEffect, useState } from "react";
import { BookOpen, CalendarCheck, CalendarX, Clock, CalendarDays, ChevronRight } from "lucide-react";
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

const SUMMARY = [
  { label: "Upcoming", value: 22, icon: CalendarDays },
  { label: "Check-in Today", value: 3, icon: CalendarCheck },
  { label: "Check-out Today", value: 5, icon: CalendarX },
  { label: "Pending", value: 8, icon: Clock },
];

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await ownerApi.get("/owner/enquiries/");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} h="h-24" rounded="rounded-[22px]" />
          ))}
        </div>
        <Skeleton h="h-72" rounded="rounded-[22px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Bookings"
        subtitle="Track all guest bookings and check-in status."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUMMARY.map(({ label, value, icon: Icon }) => (
          <div key={label} className={cardCls("p-5 transition-all hover:-translate-y-0.5")} style={cardStyle()}>
            <div className="mb-3 flex items-center justify-between">
              <div
                className="grid h-9 w-9 place-items-center rounded-[12px]"
                style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
              >
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
        <div className={cardCls("overflow-hidden")} style={cardStyle()}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#eee5d7] bg-[#fbf8f2]">
                  {["ID", "Room", "Student", "Status", ""].map((h, i) => (
                    <th
                      key={i}
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
                {bookings.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#f1eadf] transition-colors hover:bg-[#fffaf2]"
                    style={idx % 2 === 0 ? {} : { background: "#fcfbf8" }}
                  >
                    <td className="px-5 py-4 text-[11px] font-bold text-[#8b8578]">#{b.id}</td>
                    <td className="px-5 py-4 text-[13px] font-extrabold text-[#2b2823]">{b.room_title}</td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-[#2b2823]">{b.student_name}</p>
                      <p className="mt-0.5 text-[11px] text-[#7f786b]">{b.student_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="ml-auto grid h-8 w-8 place-items-center rounded-[10px] border border-[#e5dac7] text-[#a07830] transition hover:bg-[#fff8ee]">
                        <ChevronRight size={14} />
                      </button>
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