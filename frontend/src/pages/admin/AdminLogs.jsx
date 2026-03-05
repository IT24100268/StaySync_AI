import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import api from "../../services/api";
import GlassCard from "./components/GlassCard";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(logs);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      logs.filter(
        (l) =>
          String(l.action || "").toLowerCase().includes(q) ||
          String(l.admin_username || "").toLowerCase().includes(q) ||
          String(l.target_type || "").toLowerCase().includes(q) ||
          String(l.target_id || "").toLowerCase().includes(q)
      )
    );
  }, [query, logs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/logs/");
      const list = data.results || data || [];
      setLogs(list);
      setFiltered(list);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Activity Logs
            </h1>
            <p className="text-slate-600 mt-1">
              Track all administrative actions across the platform.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white/90 transition font-semibold text-slate-800"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, admin, target..."
            className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white/60 border border-white/50 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <FileText className="mx-auto mb-3 text-slate-500" size={46} />
          <p className="text-slate-700 font-semibold">No activity logs found</p>
          <p className="text-slate-600 text-sm mt-1">
            Try a different search or perform an admin action.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50">
                <tr className="text-left text-xs font-bold text-slate-600 uppercase">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/40">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-white/40 transition">
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {log.admin_username}
                      </div>
                      <div className="text-xs text-slate-600">Administrator</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {log.target_type}
                      </div>
                      <div className="text-xs text-slate-600">
                        ID: {log.target_id}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700 max-w-[480px]">
                      <div className="truncate">{String(log.details || "-")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}