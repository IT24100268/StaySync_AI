import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import ownerApi from "../../api/ownerApi";

// ✅ Tailwind-safe color map (no dynamic classes)
const CARD_STYLES = {
  blue: {
    wrap: "bg-gradient-to-br from-blue-600 to-blue-700",
    icon: "bg-white/15",
  },
  green: {
    wrap: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    icon: "bg-white/15",
  },
  purple: {
    wrap: "bg-gradient-to-br from-violet-600 to-violet-700",
    icon: "bg-white/15",
  },
  orange: {
    wrap: "bg-gradient-to-br from-orange-600 to-orange-700",
    icon: "bg-white/15",
  },
};

function formatLKR(v) {
  const n = Number(v || 0);
  return `LKR ${n.toLocaleString()}`;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    listings: 0,
    views: 0,
    enquiries: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Optional: later you can replace these with API endpoints
  const recentReservations = useMemo(() => {
    return [
      {
        id: 1,
        name: "Student enquiry",
        sub: "Room near campus • 2 nights",
        status: "Pending",
      },
      {
        id: 2,
        name: "Booking request",
        sub: "Female hostel • 1 month",
        status: "Upcoming",
      },
      {
        id: 3,
        name: "Check-in",
        sub: "Single room • Today",
        status: "Checked in",
      },
    ];
  }, []);

  const activity = useMemo(() => {
    return [
      { id: 1, text: "New enquiry received for Room #202", time: "2h ago" },
      { id: 2, text: "Listing viewed 18 times today", time: "5h ago" },
      { id: 3, text: "Verification document uploaded", time: "Yesterday" },
    ];
  }, []);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await ownerApi.get("/owner/analytics/summary");
      // supports both shapes:
      // { listings, views, enquiries, revenue }
      // OR { totalViews, totalEnquiries } etc.
      setStats({
        listings: data.listings ?? data.totalListings ?? 0,
        views: data.views ?? data.totalViews ?? 0,
        enquiries: data.enquiries ?? data.totalEnquiries ?? 0,
        revenue: data.revenue ?? data.totalRevenue ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total Listings",
        value: stats.listings,
        icon: Home,
        color: "blue",
      },
      {
        label: "Total Views",
        value: stats.views,
        icon: Eye,
        color: "green",
      },
      {
        label: "Enquiries",
        value: stats.enquiries,
        icon: MessageSquare,
        color: "purple",
      },
      {
        label: "Revenue",
        value: formatLKR(stats.revenue),
        icon: TrendingUp,
        color: "orange",
      },
    ],
    [stats]
  );

  // Simple “chart” bars (visual only)
  const chartBars = useMemo(() => {
    // you can replace with real analytics later
    return [35, 45, 38, 52, 66, 58, 72, 61, 79, 70, 86, 92];
  }, []);

  if (loading) {
    return (
      <div className="py-12">
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title + action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome back 👋
          </h1>
          <p className="text-slate-600">
            Here’s what’s happening with your listings today.
          </p>
        </div>

        <Link
          to="/owner/listings/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
        >
          <Plus size={18} />
          Add Listing
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const C = CARD_STYLES[stat.color] || CARD_STYLES.blue;
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${C.wrap} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/85 text-sm font-semibold">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-extrabold mt-2">{stat.value}</p>
                </div>

                <div
                  className={`h-11 w-11 rounded-2xl ${C.icon} grid place-items-center`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-white/85">
                <ArrowUpRight size={16} />
                <span>Updated just now</span>
              </div>

              {/* subtle decoration */}
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-white/10" />
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Occupancy overview */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Occupancy Overview
              </h2>
              <p className="text-sm text-slate-600">
                Visual trend (demo). Connect real data later.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
              <CalendarDays size={16} className="text-slate-500" />
              This month
            </div>
          </div>

          {/* Fake chart */}
          <div className="h-56 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-end gap-2">
            {chartBars.map((v, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 transition"
                style={{ height: `${v}%` }}
                title={`Day ${idx + 1}: ${v}%`}
              />
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Link
              to="/owner/listings/new"
              className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
            >
              <p className="font-extrabold text-slate-900">+ Create a listing</p>
              <p className="text-sm text-slate-600">
                Add photos, rent, facilities, location
              </p>
            </Link>

            <Link
              to="/owner/enquiries"
              className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
            >
              <p className="font-extrabold text-slate-900">Review enquiries</p>
              <p className="text-sm text-slate-600">
                Approve / reject and respond faster
              </p>
            </Link>
          </div>
        </div>

        {/* Recent reservations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Requests
            </h2>
            <Link
              to="/owner/enquiries"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentReservations.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{r.name}</p>
                    <p className="text-sm text-slate-600 truncate">{r.sub}</p>
                  </div>

                  <span
                    className={[
                      "px-3 py-1 rounded-full text-xs font-bold",
                      r.status === "Checked in"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "Upcoming"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm text-slate-700">
              Tip: Connect this panel to your backend endpoint like
              <span className="font-mono"> /owner/bookings/recent</span>
            </p>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">Activity Feed</h2>
          <Link
            to="/owner/analytics"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Analytics
          </Link>
        </div>

        <div className="divide-y">
          {activity.map((a) => (
            <div key={a.id} className="py-4 flex items-center justify-between">
              <p className="font-semibold text-slate-800">{a.text}</p>
              <span className="text-sm text-slate-500">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}