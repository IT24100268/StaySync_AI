import { useEffect, useState } from 'react';
import { Eye, MessageSquare, TrendingUp } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerAnalytics() {
  const [summary, setSummary] = useState({ totalViews: 0, totalEnquiries: 0 });
  const [listingStats, setListingStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, listingsRes] = await Promise.all([
        ownerApi.get('/owner/analytics/summary'),
        ownerApi.get('/owner/analytics/listings'),
      ]);
      setSummary(summaryRes.data);
      setListingStats(listingsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const maxViews = Math.max(...listingStats.map((l) => l.views), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Eye size={32} />
            <TrendingUp size={20} className="opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{summary.totalViews}</p>
          <p className="text-sm opacity-90">Total Views</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare size={32} />
            <TrendingUp size={20} className="opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{summary.totalEnquiries}</p>
          <p className="text-sm opacity-90">Total Enquiries</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Views & Enquiries by Listing</h2>

        {listingStats.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-6">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Listing</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Views</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Enquiries</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listingStats.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{listing.title}</p>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-900">{listing.views}</td>
                    <td className="px-4 py-4 text-center text-slate-900">{listing.enquiries}</td>
                    <td className="px-4 py-4 text-right text-slate-900">
                      {listing.views > 0
                        ? `${((listing.enquiries / listing.views) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Views Chart</h3>
              <div className="space-y-3">
                {listingStats.map((listing) => (
                  <div key={listing.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{listing.title}</span>
                      <span className="text-sm font-semibold text-slate-900">{listing.views}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(listing.views / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
