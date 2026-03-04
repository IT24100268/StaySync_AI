import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data } = await ownerApi.get('/owner/listings');
      setListings(data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = !currentStatus ? 'available' : 'unavailable';
    if (!window.confirm(`Mark this listing as ${newStatus}?`)) {
      return;
    }
    try {
      await ownerApi.patch(`/owner/listings/${id}/availability`, {
        available: !currentStatus,
      });
      fetchListings();
      alert(`Listing marked as ${newStatus}!`);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
        <Link
          to="/owner/listings/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-slate-600 mb-4">No listings yet</p>
          <Link
            to="/owner/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Views</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{listing.title}</p>
                    <p className="text-sm text-slate-600">{listing.location}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-semibold">
                    LKR {listing.rent?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        listing.available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {listing.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{listing.views || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAvailability(listing.id, listing.available)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Toggle Availability"
                      >
                        {listing.available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <Link
                        to={`/owner/listings/${listing.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </Link>
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="View Enquiries"
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
      )}
    </div>
  );
}
