import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, CheckCircle, Search, AlertCircle } from "lucide-react";
import api from "../../services/api";

// Simple helper to format time
function timeAgo(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReportsQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports/");
      // The API usually returns paginated { results: [...] } or an array
      setReports(data.results || data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = useMemo(() => reports.filter(r => r.status === 'PENDING' || r.status === 'INVESTIGATING').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED').length, [reports]);

  const filteredReports = useMemo(() => {
    let filtered = reports.filter(r => {
      if (tab === 'PENDING') return r.status === 'PENDING' || r.status === 'INVESTIGATING';
      return r.status === 'RESOLVED' || r.status === 'DISMISSED';
    });

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.target_type && r.target_type.toLowerCase().includes(q)) ||
        (r.reporter?.username && r.reporter.username.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [reports, tab, searchQuery]);

  const updateReportStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}/`, { status });
      // Instant optimistic UI update
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Error updating report status.");
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1D2E] tracking-tight">Reports Queue</h1>
          <p className="mt-1 text-[15px] font-semibold text-slate-500">
            Review and manage user-reported issues across the platform.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm font-semibold text-[#1A1D2E] outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          />
        </div>
      </div>

      {/* Top Banner Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 rounded-2xl border border-rose-100/50 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex justify-center items-center shadow-md shadow-rose-500/20">
            <span className="font-bold">!</span>
          </div>
          <span className="font-extrabold text-rose-700 text-lg">{pendingCount} <span className="text-rose-600/70 font-bold text-sm">Pending Reports</span></span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100/50 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex justify-center items-center shadow-md shadow-emerald-500/20">
            <CheckCircle size={18} strokeWidth={3} />
          </div>
          <span className="font-extrabold text-emerald-700 text-lg">{resolvedCount} <span className="text-emerald-600/70 font-bold text-sm">Resolved Reports</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl w-max border border-slate-200">
        <button 
          onClick={() => setTab('PENDING')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            tab === 'PENDING' 
            ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]" 
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          }`}
        >
          Pending Reports
        </button>
        <button 
          onClick={() => setTab('RESOLVED')} 
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            tab === 'RESOLVED' 
            ? "bg-indigo-100 text-indigo-700 shadow-sm scale-[1.02] border border-indigo-200" 
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          }`}
        >
          Resolved Reports
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-1/4">User</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-1/6">Category</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-1/4">Issue</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-1/6">Reported</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-1/6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto shadow-indigo-500/50 shadow-lg"></div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                        <ShieldAlert size={32} strokeWidth={1.5} />
                      </div>
                      <p className="font-bold text-slate-600 text-lg">No {tab.toLowerCase()} reports</p>
                      <p className="text-sm font-medium text-slate-400 mt-1">You're all caught up!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={report.reporter?.profile_picture || `https://ui-avatars.com/api/?name=${report.reporter?.username || 'U'}&background=F8F9FC&color=1A1D2E`} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm"
                        />
                        <div>
                          <p className="font-black text-[#1A1D2E] text-[15px]">{report.reporter?.username || 'Anonymous'}</p>
                          <p className="text-xs font-bold text-slate-400">{report.reporter?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#3E405B]">{report.target_type || 'Platform'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#1A1D2E] truncate max-w-xs">{report.reason || report.description}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-500">{timeAgo(report.created_at)}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {tab === 'PENDING' ? (
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-[10px] text-[13px] font-black tracking-wide transition-all shadow-sm hover:shadow-rose-500/30 hover:-translate-y-0.5"
                          >
                            Resolve
                          </button>
                          <button 
                            onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-[10px] text-[13px] font-black tracking-wide transition-all"
                          >
                            Ignore
                          </button>
                        </div>
                      ) : (
                        <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${
                          report.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {report.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}