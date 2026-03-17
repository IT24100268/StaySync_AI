import { useState } from "react";
import { Settings, User, Bell, Shield, CreditCard, HelpCircle, ChevronRight } from "lucide-react";
import { cardCls, cardStyle, PageHeader } from "./ownerTheme.jsx";

const SECTIONS = [
  {
    title: "Account",
    icon: User,
    items: [
      { label: "Profile Information", sub: "Update your name, email and contact details" },
      { label: "Change Password", sub: "Keep your account secure with a strong password" },
      { label: "Two-Factor Auth", sub: "Add an extra layer of security to your account" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Email Notifications", sub: "Receive booking and enquiry alerts via email" },
      { label: "SMS Alerts", sub: "Get instant SMS for new bookings" },
      { label: "Push Notifications", sub: "Browser push alerts for real-time updates" },
    ],
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    items: [
      { label: "Verification Status", sub: "Manage your identity verification documents" },
      { label: "Active Sessions", sub: "View and manage devices logged into your account" },
      { label: "Data & Privacy", sub: "Control how your data is used on StaySync AI" },
    ],
  },
  {
    title: "Billing",
    icon: CreditCard,
    items: [
      { label: "Payment Methods", sub: "Manage your linked bank accounts and cards" },
      { label: "Payout Schedule", sub: "Configure when and how you receive earnings" },
      { label: "Billing History", sub: "View past invoices and transaction records" },
    ],
  },
  {
    title: "Support",
    icon: HelpCircle,
    items: [
      { label: "Help Center", sub: "Browse FAQs and guides for hostel owners" },
      { label: "Contact Support", sub: "Reach our team for account or listing issues" },
    ],
  },
];

export default function OwnerSettings() {
  const [active, setActive] = useState("Account");
  const current = SECTIONS.find((s) => s.title === active);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage your account preferences and configurations."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <div className={cardCls("p-2 h-fit")} style={cardStyle()}>
          {SECTIONS.map(({ title, icon: Icon }) => (
            <button
              key={title}
              onClick={() => setActive(title)}
              className={`flex w-full items-center gap-3 rounded-[12px] px-4 py-2.5 text-[13px] font-bold transition-all ${
                active === title
                  ? "border border-[#dcc89a] bg-[#fff8e8] text-[#b98b1f]"
                  : "text-[#6f6a5f] hover:bg-[#faf7f1] hover:text-[#1e1d1a]"
              }`}
            >
              <Icon size={14} />
              {title}
            </button>
          ))}
        </div>

        <div className={cardCls("p-6")} style={cardStyle()}>
          <div className="mb-5 flex items-center gap-3">
            {current && <current.icon size={17} className="text-[#b98b1f]" />}
            <h2 className="text-[17px] font-extrabold text-[#1e1d1a]">{active}</h2>
          </div>

          <div className="space-y-2.5">
            {current?.items.map((item) => (
              <div
                key={item.label}
                className="flex cursor-pointer items-center justify-between rounded-[16px] border border-[#eee5d7] bg-[#fcfaf6] px-5 py-4 transition-all hover:border-[#dcc89a] hover:bg-[#fffaf2]"
              >
                <div>
                  <p className="text-[13px] font-bold text-[#2b2823]">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-[#6f6a5f]">{item.sub}</p>
                </div>
                <ChevronRight size={15} className="flex-shrink-0 text-[#9b9588]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}