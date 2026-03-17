// ownerTheme.jsx
import React from "react";

/* ─────────────────────────────────────────────────────────
   STAYSYNC AI OWNER THEME
   Reference style:
   - light background
   - black navbar
   - white cards
   - gold accents
   - subtle premium shadows
───────────────────────────────────────────────────────── */

export const O = {
  pageBg: "#f5f3ef",
  pageBgSoft: "#faf8f4",
  cardBg: "#ffffff",
  cardBgSoft: "#fcfbf8",
  navbarBg: "#0f0f12",
  navbarBorder: "rgba(212,175,55,0.14)",

  gold: "#c9a84c",
  goldDark: "#a07830",
  goldSoft: "#efe3bf",

  textPrimary: "#1e1d1a",
  textSecondary: "#6f6a5f",
  textMuted: "#9b9588",

  border: "#e9e2d4",
  borderStrong: "#d8c8a0",

  successBg: "#edf7f0",
  successText: "#1f7a3f",
  warningBg: "#fff7e6",
  warningText: "#9a6a00",
  dangerBg: "#fdeeee",
  dangerText: "#b42318",

  shadow: "0 10px 30px rgba(16,16,16,0.06)",
  shadowHover: "0 16px 40px rgba(16,16,16,0.10)",
  goldGlow: "0 0 0 1px rgba(201,168,76,0.18), 0 8px 20px rgba(201,168,76,0.18)",
};

export const cardStyle = (gold = false) => ({
  background: gold
    ? "linear-gradient(180deg,#fffdf7 0%, #ffffff 100%)"
    : O.cardBg,
  border: `1px solid ${gold ? O.borderStrong : O.border}`,
  boxShadow: gold ? O.goldGlow : O.shadow,
});

export const cardCls = (extra = "") =>
  `rounded-[24px] border ${extra}`;

export const inputCls =
  "w-full rounded-[14px] border border-[#e7dfd1] bg-white px-4 py-3 text-sm text-[#1e1d1a] outline-none transition placeholder:text-[#a39b8f] focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10";

export const selectCls =
  "rounded-[14px] border border-[#e7dfd1] bg-white px-3 py-2 text-sm font-semibold text-[#1e1d1a] outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10";

export const btnGold =
  "inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#dcc89a] bg-white px-5 py-2.5 text-sm font-bold text-[#8a6a1f] transition hover:bg-[#fffaf0]";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#ebe4d8] bg-white px-5 py-2.5 text-sm font-bold text-[#5f5a4f] transition hover:bg-[#f9f6f0] hover:text-[#1e1d1a]";

export const btnIcon =
  "grid h-9 w-9 place-items-center rounded-[12px] border border-[#ebe4d8] bg-white text-[#6f6a5f] transition hover:border-[#c9a84c]/40 hover:text-[#a07830] hover:bg-[#fffaf0]";

export const SectionHeader = ({ title, link, linkLabel = "View All" }) => (
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-[15px] font-extrabold tracking-tight text-[#1e1d1a]">{title}</h3>
    {link && (
      <a href={link} className="text-[12px] font-bold text-[#a07830] transition hover:text-[#c9a84c]">
        {linkLabel}
      </a>
    )}
  </div>
);

export const PageHeader = ({ icon: Icon, title, subtitle, action }) => (
  <section
    className={`${cardCls("p-6 mb-6")} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
    style={cardStyle()}
  >
    <div className="flex items-center gap-4">
      <div
        className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[16px]"
        style={{
          background: "#fff8e8",
          border: "1px solid #e5d4ab",
        }}
      >
        <Icon size={20} className="text-[#b98b1f]" />
      </div>
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#1e1d1a]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#6f6a5f]">{subtitle}</p>}
      </div>
    </div>
    {action}
  </section>
);

export const Avatar = ({ name = "U", size = "md" }) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const parts = String(name).trim().split(" ").filter(Boolean);
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : String(name).slice(0, 2);

  return (
    <div
      className={`grid flex-shrink-0 place-items-center rounded-full font-extrabold text-white ${sizes[size]}`}
      style={{
        background: "linear-gradient(135deg,#c9a84c,#a07830)",
        boxShadow: "0 4px 14px rgba(201,168,76,0.28)",
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div
    className={`${cardCls("p-16 text-center")} flex flex-col items-center`}
    style={cardStyle()}
  >
    <div
      className="mb-5 grid h-18 w-18 place-items-center rounded-[20px] p-4"
      style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
    >
      <Icon size={32} className="text-[#b98b1f]" />
    </div>
    <p className="text-lg font-extrabold text-[#1e1d1a]">{title}</p>
    {subtitle && <p className="mt-2 max-w-xs text-sm text-[#6f6a5f]">{subtitle}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const Skeleton = ({
  h = "h-8",
  w = "w-full",
  rounded = "rounded-[14px]",
}) => (
  <div className={`${h} ${w} ${rounded} animate-pulse bg-[#eee7db]`} />
);