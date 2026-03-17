import { useEffect, useState } from "react";
import { FileText, Search, RefreshCcw } from "lucide-react";
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Activity Logs</h1>
            <p className="mt-1 text-slate-500">
              Track administrative actions across the platform.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 font-semibold text-slate-700 hover:bg-white"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        <div className="relative mt-5">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, admin, target..."
            className="w-full rounded-2xl border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3 pl-10 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <FileText className="mx-auto mb-3 text-slate-400" size={46} />
          <p className="font-semibold text-slate-700">No activity logs found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search or perform an admin action.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-[#e9eef6] bg-[#f8fbff]">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eef3f8]">
                {filtered.map((log) => (
                  <tr key={log.id} className="transition hover:bg-[#f8fbff]">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{log.admin_username}</div>
                      <div className="text-xs text-slate-500">Administrator</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{log.target_type}</div>
                      <div className="text-xs text-slate-500">ID: {log.target_id}</div>
                    </td>

                    <td className="max-w-[480px] px-6 py-4 text-sm text-slate-700">
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