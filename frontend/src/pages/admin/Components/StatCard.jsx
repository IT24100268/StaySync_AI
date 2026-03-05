import { TrendingUp } from "lucide-react";

const gradients = {
  blue: "from-blue-600 to-indigo-600",
  red: "from-rose-600 to-red-600",
  orange: "from-orange-500 to-amber-500",
  green: "from-emerald-600 to-green-600",
  purple: "from-violet-600 to-purple-600",
  yellow: "from-amber-500 to-yellow-500",
  indigo: "from-indigo-600 to-blue-600",
  pink: "from-pink-600 to-rose-600",
};

export default function StatCard({ icon: Icon, label, value, color = "blue" }) {
  return (
    <div
      className={[
        "rounded-3xl p-6 text-white shadow-[0_18px_40px_rgba(2,6,23,0.18)]",
        "bg-gradient-to-br",
        gradients[color] || gradients.blue,
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
          <Icon size={22} />
        </div>
        <TrendingUp size={18} className="opacity-80" />
      </div>

      <div className="text-3xl font-extrabold leading-8">{value}</div>
      <div className="text-sm opacity-90 mt-1 font-semibold">{label}</div>
    </div>
  );
}