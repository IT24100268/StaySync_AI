import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquare, TrendingUp, ArrowUpRight } from "lucide-react";
import ownerApi from "../../api/ownerApi";

const KPI = ({ title, value, icon: Icon, hint }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-2">{value}</p>
        {hint ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <ArrowUpRight size={16} />
            {hint}
          </div>
        ) : null}
      </div>

      <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white grid place-items-center">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function OwnerAnalytics() {
  const [summary, setSummary] = useState({ totalViews: 0, totalEnquiries: 0 });
  const [listingStats, setListingStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, listingsRes] = await Promise.all([
        ownerApi.get("/owner/analytics/summary"),
        ownerApi.get("/owner/analytics/listings"),
      ]);

      // supports your existing shapes
      setSummary({
        totalViews: summaryRes.data.totalViews ?? summaryRes.data.views ?? 0,
        totalEnquiries:
          summaryRes.data.totalEnquiries ?? summaryRes.data.enquiries ?? 0,
      });

      setListingStats(Array.isArray(listingsRes.data) ? listingsRes.data : []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxViews = useMemo(() => {
    return Math.max(...listingStats.map((l) => Number(l.views || 0)), 1);
  }, [listingStats]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="h-7 w-40 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl animate-pulse mt-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="text-slate-600">
          Track views and enquiry conversion per listing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPI
          title="Total Views"
          value={summary.totalViews}
          icon={Eye}
          hint="Overall listing visibility"
        />
        <KPI
          title="Total Enquiries"
          value={summary.totalEnquiries}
          icon={MessageSquare}
          hint="Interest from students"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Listings Performance
            </h2>
            <p className="text-sm text-slate-600">
              Conversion = enquiries / views
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp size={18} />
            Updated
          </div>
        </div>

        {listingStats.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-10 text-center">
            <p className="font-semibold text-slate-700">No data available</p>
            <p className="text-sm text-slate-500 mt-1">
              Add listings and start getting views/enquiries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200">
                <tr className="text-left text-xs font-bold uppercase text-slate-500">
                  <th className="py-3 pr-4">Listing</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4 text-center">Enquiries</th>
                  <th className="py-3 px-4 text-right">Conversion</th>
                  <th className="py-3 pl-4">Views Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingStats.map((listing) => {
                  const views = Number(listing.views || 0);
                  const enquiries = Number(listing.enquiries || 0);
                  const conv =
                    views > 0 ? ((enquiries / views) * 100).toFixed(1) : "0.0";

                  return (
                    <tr key={listing.id} className="hover:bg-slate-50">
                      <td className="py-4 pr-4">
                        <p className="font-bold text-slate-900">
                          {listing.title}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-center font-semibold text-slate-800">
                        {views}
                      </td>

                      <td className="py-4 px-4 text-center font-semibold text-slate-800">
                        {enquiries}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-slate-900">
                        {conv}%
                      </td>

                      <td className="py-4 pl-4">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-slate-900 transition-all"
                            style={{ width: `${(views / maxViews) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="text-xs text-slate-500 mt-4">
              Tip: highest views bar is 100%.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}