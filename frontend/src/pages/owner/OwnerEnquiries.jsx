import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const { data } = await ownerApi.get('/owner/enquiries');
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this enquiry?`)) {
      return;
    }
    try {
      await ownerApi.patch(`/owner/enquiries/${id}/status`, { status });
      fetchEnquiries();
      alert(`Enquiry ${action}d successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Enquiries</h1>

      {enquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No enquiries yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{enquiry.listingTitle}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    From: {enquiry.studentName} • {enquiry.contact}
                  </p>
                  <p className="text-sm text-slate-600">
                    Requested: {new Date(enquiry.requestedDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    enquiry.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : enquiry.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {enquiry.status}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-slate-700">{enquiry.message}</p>
              </div>

              {enquiry.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(enquiry.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(enquiry.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition">
                    Respond
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
