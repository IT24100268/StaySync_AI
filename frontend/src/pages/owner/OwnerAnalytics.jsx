import { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, EmptyState, PageHeader, Skeleton } from "./ownerTheme.jsx";

function money(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function StatCard({ title, value, subtitle, icon: Icon, accent = false }) {
  return (
    <div
      className={cardCls("p-5")}
      style={{
        ...cardStyle(accent),
        boxShadow: accent ? "0 10px 26px rgba(201,168,76,0.14)" : cardStyle().boxShadow,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b8578]">{title}</p>
          <p className={`mt-3 text-[34px] font-black leading-none tracking-tight ${accent ? "text-[#b58c2f]" : "text-[#1e1d1a]"}`}>
            {value}
          </p>
          <p className="mt-3 text-sm text-[#6f6a5f]">{subtitle}</p>
        </div>

        <div
          className="grid h-12 w-12 place-items-center rounded-[16px]"
          style={{
            background: accent ? "#fff8e8" : "#faf7f1",
            border: "1px solid #eadab1",
          }}
        >
          <Icon size={18} className={accent ? "text-[#b58c2f]" : "text-[#7f786b]"} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, note, accent = false }) {
  return (
    <div
      className="rounded-[20px] border px-4 py-4"
      style={{
        background: accent ? "#fff8e8" : "#fcfbf8",
        borderColor: accent ? "#e7d29d" : "#ece3d3",
      }}
    >
      <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${accent ? "text-[#9a6a00]" : "text-[#9b9588]"}`}>{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[#1e1d1a]">{value}</p>
      <p className="mt-2 text-sm text-[#6f6a5f]">{note}</p>
    </div>
  );
}

export default function OwnerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, enquiriesRes] = await Promise.all([
          ownerApi.get("/owner/listings/"),
          ownerApi.get("/owner/enquiries/"),
        ]);

        setListings(listingsRes.data?.results || listingsRes.data || []);
        setEnquiries(enquiriesRes.data || []);
      } catch (error) {
        console.error("Failed to load owner analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const analytics = useMemo(() => {
    const totalViews = listings.reduce((sum, listing) => sum + Number(listing.views || 0), 0);
    const totalEnquiries = enquiries.length;
    const approvedEnquiries = enquiries.filter((item) => item.status === "approved").length;
    const averageRent =
      listings.length > 0
        ? listings.reduce((sum, listing) => sum + Number(listing.rent || listing.price || 0), 0) / listings.length
        : 0;
    const estimatedRevenue = enquiries
      .filter((item) => item.status === "approved")
      .reduce((sum, enquiry) => {
        const room = listings.find((listing) => listing.id === enquiry.room_id);
        return sum + Number(room?.rent || room?.price || 0);
      }, 0);

    const listingStats = listings.map((listing) => {
      const listingEnquiries = enquiries.filter((item) => item.room_id === listing.id);
      const views = Number(listing.views || 0);
      const enquiryCount = listingEnquiries.length;
      const conversion = views > 0 ? ((enquiryCount / views) * 100).toFixed(1) : "0.0";

      return {
        id: listing.id,
        title: listing.title,
        location: listing.location || "Location not set",
        views,
        enquiries: enquiryCount,
        conversion: Number(conversion),
        rent: Number(listing.rent || listing.price || 0),
        status: listing.status,
      };
    });

    const chartData = listingStats.slice(0, 6).map((item) => ({
      name: item.title?.length > 10 ? `${item.title.slice(0, 10)}...` : item.title,
      enquiries: item.enquiries,
      views: item.views > 0 ? item.views : 0,
      rentK: Math.max(1, Math.round(item.rent / 1000)),
    }));

    const topPerformer =
      [...listingStats].sort((a, b) => b.enquiries - a.enquiries || b.views - a.views)[0] || null;

    return {
      totalViews,
      totalEnquiries,
      approvedEnquiries,
      averageRent,
      estimatedRevenue,
      listingStats,
      chartData,
      topPerformer,
    };
  }, [listings, enquiries]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} h="h-32" rounded="rounded-[22px]" />
          ))}
        </div>
        <Skeleton h="h-[420px]" rounded="rounded-[26px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Track listing visibility, student interest, and room performance with a cleaner overview."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Listings"
          value={listings.length}
          subtitle="Listings currently in your portfolio."
          icon={Sparkles}
        />
        <StatCard
          title="Total Views"
          value={analytics.totalViews}
          subtitle="Combined visibility across all rooms."
          icon={Eye}
        />
        <StatCard
          title="Total Enquiries"
          value={analytics.totalEnquiries}
          subtitle="Student conversations across your listings."
          icon={MessageSquare}
        />
        <StatCard
          title="Estimated Revenue"
          value={money(analytics.estimatedRevenue)}
          subtitle="Based on approved bookings from current rooms."
          icon={TrendingUp}
          accent
        />
      </section>

      {listings.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          subtitle="Create listings first and your analytics will start building here."
        />
      ) : (
        <>
          <section
            className={`${cardCls("p-6")} grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]`}
            style={cardStyle()}
          >
            <div>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-extrabold tracking-tight text-[#1e1d1a]">Listing Momentum</h2>
                  <p className="mt-1 text-sm text-[#6f6a5f]">
                    Live enquiry demand per listing, with rent shown as a backup signal when views are low.
                  </p>
                </div>
                <div className="rounded-[14px] border border-[#e7d29d] bg-[#fff8e8] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a00]">
                  Live Overview
                </div>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.chartData} barGap={10}>
                    <CartesianGrid vertical={false} stroke="#ece3d3" strokeDasharray="4 4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#7f786b", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#9b9588", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "rentK") return [`LKR ${Number(value) * 1000}`, "Rent"];
                        return [value, name === "enquiries" ? "Enquiries" : "Views"];
                      }}
                      contentStyle={{
                        borderRadius: 18,
                        border: "1px solid #ece3d3",
                        background: "#fffdf9",
                        boxShadow: "0 18px 35px rgba(16,16,16,0.08)",
                      }}
                    />
                    <Bar dataKey="enquiries" name="enquiries" radius={[8, 8, 0, 0]} fill="#c9a84c" />
                    <Bar dataKey="views" name="views" radius={[8, 8, 0, 0]} fill="#4a4640" />
                    <Bar dataKey="rentK" name="rentK" radius={[8, 8, 0, 0]} fill="#efe3bf" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <InsightCard
                title="Top Performer"
                value={analytics.topPerformer?.title || "No listing yet"}
                note={
                  analytics.topPerformer
                    ? `${analytics.topPerformer.enquiries} enquiries • ${analytics.topPerformer.views} views`
                    : "Your strongest listing will appear here."
                }
                accent
              />
              <InsightCard
                title="Average Room Rent"
                value={money(analytics.averageRent)}
                note="Average monthly rent across your current listings."
              />
              <InsightCard
                title="Approved Conversions"
                value={analytics.approvedEnquiries}
                note="Bookings already approved from your enquiry pipeline."
              />
            </div>
          </section>

          <section
            className={`${cardCls("p-6")} space-y-5`}
            style={cardStyle()}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-extrabold tracking-tight text-[#1e1d1a]">Listing Insights</h2>
                <p className="mt-1 text-sm text-[#6f6a5f]">
                  Focus on the rooms that are attracting the most interest.
                </p>
              </div>
              <div className="rounded-[14px] border border-[#ece3d3] bg-[#fcfbf8] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#8b8578]">
                {analytics.listingStats.length} tracked
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analytics.listingStats.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-[22px] border border-[#ece3d3] bg-[#fcfbf8] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[22px] font-black tracking-tight text-[#1e1d1a]">{listing.title}</p>
                      <p className="mt-1 truncate text-sm text-[#6f6a5f]">{listing.location}</p>
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

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InsightCard title="Views" value={listing.views} note="Current visibility" />
                    <InsightCard title="Enquiries" value={listing.enquiries} note="Student interest" accent />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsightCard title="Conversion" value={`${listing.conversion}%`} note="Enquiries from views" />
                    <InsightCard title="Rent" value={money(listing.rent)} note="Monthly rate" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
