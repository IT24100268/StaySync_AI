import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({ listings: 0, views: 0, enquiries: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await ownerApi.get('/owner/analytics/summary');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Listings', value: stats.listings, icon: Home, color: 'blue' },
    { label: 'Total Views', value: stats.views, icon: Eye, color: 'green' },
    { label: 'Enquiries', value: stats.enquiries, icon: MessageSquare, color: 'purple' },
    { label: 'Revenue', value: `LKR ${stats.revenue?.toLocaleString() || 0}`, icon: TrendingUp, color: 'orange' },
  ];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={32} />
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/owner/listings/new" className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold transition">
              + Add New Listing
            </Link>
            <Link to="/owner/enquiries" className="block px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
              View Enquiries
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
          <p className="text-slate-600">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
