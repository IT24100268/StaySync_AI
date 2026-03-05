export default function GlassCard({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-3xl bg-white/55 backdrop-blur-xl border border-white/40",
        "shadow-[0_10px_30px_rgba(15,23,42,0.10)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}