import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquare, TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, EmptyState, Skeleton, PageHeader } from "./ownerTheme.jsx";

function KPI({ title, value, icon: Icon, hint, gold = false }) {
  return (
    <div className={cardCls("p-5 transition-all hover:-translate-y-0.5")} style={cardStyle(gold)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7f786b]">{title}</p>
          <p className={`mt-2.5 text-[28px] font-extrabold leading-none ${gold ? "text-[#b98b1f]" : "text-[#1e1d1a]"}`}>
            {value}
          </p>
          {hint && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-[#7f786b]">
              <ArrowUpRight size={11} className="text-[#b98b1f]" /> {hint}
            </div>
          )}
        </div>

        <div
          className="grid h-11 w-11 place-items-center rounded-[14px]"
          style={{
            background: gold ? "#fff8e8" : "#faf7f1",
            border: "1px solid #eadab1",
          }}
        >
          <Icon size={17} className={gold ? "text-[#b98b1f]" : "text-[#7f786b]"} />
        </div>
      </div>
    </div>
  );
}

export default function OwnerAnalytics() {
  const [summary, setSummary] = useState({ totalViews: 0, totalEnquiries: 0 });
  const [listingStats, setListingStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        ownerApi.get("/owner/analytics/summary"),
        ownerApi.get("/owner/analytics/listings"),
      ]);

      setSummary({
        totalViews: sRes.data.totalViews ?? sRes.data.views ?? 0,
        totalEnquiries: sRes.data.totalEnquiries ?? sRes.data.enquiries ?? 0,
      });

      setListingStats(Array.isArray(lRes.data) ? lRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const maxViews = useMemo(
    () => Math.max(...listingStats.map((l) => Number(l.views || 0)), 1),
    [listingStats]
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton h="h-28" rounded="rounded-[22px]" />
          <Skeleton h="h-28" rounded="rounded-[22px]" />
        </div>
        <Skeleton h="h-80" rounded="rounded-[22px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Track listing visibility, student interest, and conversion trends."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <KPI title="Total Views" value={summary.totalViews} icon={Eye} hint="Overall listing visibility" />
        <KPI title="Total Enquiries" value={summary.totalEnquiries} icon={MessageSquare} hint="Interest from students" gold />
      </div>

      <div className={cardCls("p-6")} style={cardStyle()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#1e1d1a]">Listings Performance</h2>
            <p className="mt-0.5 text-[11px] text-[#7f786b]">Conversion = enquiries ÷ views × 100</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#7f786b]">
            <TrendingUp size={13} className="text-[#b98b1f]" /> Live data
          </div>
        </div>

        {listingStats.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No data available"
            subtitle="Add listings and start getting views and enquiries."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-[#eee5d7] bg-[#fbf8f2]">
                  {["Listing", "Views", "Enquiries", "Conversion", "Trend"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8578] ${
                        i === 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listingStats.map((l, idx) => {
                  const views = Number(l.views || 0);
                  const enquiries = Number(l.enquiries || 0);
                  const conv = views > 0 ? ((enquiries / views) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={l.id}
                      className="border-b border-[#f1eadf] transition-colors hover:bg-[#fffaf2]"
                      style={idx % 2 === 0 ? {} : { background: "#fcfbf8" }}
                    >
                      <td className="px-5 py-4 text-[13px] font-extrabold text-[#2b2823]">{l.title}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#6f6a5f] tabular-nums">{views}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#6f6a5f] tabular-nums">{enquiries}</td>
                      <td className="px-5 py-4 text-right text-[13px] font-extrabold text-[#b98b1f] tabular-nums">
                        {conv}%
                      </td>
                      <td className="px-5 py-4 w-36">
                        <div className="h-1.5 w-full rounded-full bg-[#efe6d5]">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${(views / maxViews) * 100}%`,
                              background: "linear-gradient(90deg,#c9a84c,#a07830)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}