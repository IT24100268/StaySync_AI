import { TrendingUp } from "lucide-react";

const ICON_STYLES = {
  blue: "bg-blue-100 text-blue-700",
  red: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-emerald-100 text-emerald-700",
  purple: "bg-violet-100 text-violet-700",
  yellow: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  pink: "bg-pink-100 text-pink-700",
};

export default function StatCard({ icon: Icon, label, value, color = "blue" }) {
  return (
    <div className="rounded-[26px] border border-[#e3eaf5] bg-white p-5 shadow-[0_10px_24px_rgba(148,163,184,0.10)]">
      <div className="flex items-center justify-between">
        <div
          className={[
            "grid h-11 w-11 place-items-center rounded-2xl",
            ICON_STYLES[color] || ICON_STYLES.blue,
          ].join(" ")}
        >
          <Icon size={20} />
        </div>
        <TrendingUp size={17} className="text-slate-400" />
      </div>

      <div className="mt-4">
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}