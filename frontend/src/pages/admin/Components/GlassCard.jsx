export default function GlassCard({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-[28px] border border-[#dfe7f3] bg-white",
        "shadow-[0_12px_30px_rgba(148,163,184,0.12)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}