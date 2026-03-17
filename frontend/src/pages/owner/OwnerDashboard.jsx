import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home, Eye, MessageSquare, TrendingUp, ArrowUpRight,
  CalendarDays, CalendarCheck, CalendarX, Clock,
  ChevronRight, Star, MapPin, BedDouble, Users,
  Bell, Wrench, UserCheck, Plus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { cardCls, cardStyle, btnGold, btnOutline, btnGhost, Avatar } from "./ownerTheme.jsx";

/* ───────── DATA (UNCHANGED) ───────── */
const STATS = [
  { label: "Total Listings", value: "5", delta: "+1 from last week", icon: Home },
  { label: "Total Views", value: "820", delta: "+120 this week", icon: Eye },
  { label: "Total Enquiries", value: "12", delta: "+4 this week", icon: MessageSquare },
  { label: "Monthly Earnings", value: "LKR 56,300", delta: "+15% this month", icon: TrendingUp, gold: true },
];

const OCCUPANCY = [
  { day: "Mon", single: 60, shared: 40 },
  { day: "Tue", single: 55, shared: 50 },
  { day: "Wed", single: 70, shared: 45 },
  { day: "Thu", single: 65, shared: 60 },
  { day: "Fri", single: 80, shared: 70 },
  { day: "Sat", single: 90, shared: 75 },
  { day: "Sun", single: 85, shared: 65 },
];

const ENQUIRIES = [
  { id: 1, name: "John Silva", room: "Shared Dorm", detail: "3 nights · Mon", status: "Reply", color: "#c9a84c" },
  { id: 2, name: "Michael Perera", room: "Single Room", detail: "5 nights · Wed", status: "Pending", color: "#6b7280" },
];

const BOOKINGS = [
  { label: "Upcoming Bookings", value: 22, icon: CalendarDays },
  { label: "Check-in Today", value: 3, icon: CalendarCheck },
];

/* ───────── STAT CARD (UPDATED) ───────── */
function StatCard({ label, value, delta, icon: Icon, gold }) {
  return (
    <div className={cardCls("p-5 hover:shadow-md transition")} style={cardStyle()}>
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-semibold text-[#6f6a5f]">{label}</p>
          <p className={`text-2xl font-bold mt-2 ${gold ? "text-[#c9a84c]" : "text-[#1e1d1a]"}`}>
            {value}
          </p>
          <p className="text-xs text-[#9b9588] mt-1 flex items-center gap-1">
            <ArrowUpRight size={12} /> {delta}
          </p>
        </div>

        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#fff8e8]">
          <Icon size={18} className="text-[#c9a84c]" />
        </div>
      </div>
    </div>
  );
}

/* ───────── MAIN ───────── */
export default function OwnerDashboard() {
  const [month, setMonth] = useState("April");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-[#6f6a5f]">Here’s your hostel overview</p>
          <h1 className="text-3xl font-bold text-[#1e1d1a]">
            Welcome back, <span className="text-[#c9a84c]">Liam</span>
          </h1>
        </div>

        <button
          className={btnGold}
          style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)" }}
        >
          <Plus size={14} /> New Listing
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">

        {/* LEFT */}
        <div className="space-y-6">

          {/* ROOM CARD */}
          <div className={cardCls("overflow-hidden")} style={cardStyle()}>
            <img
              src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5"
              className="h-52 w-full object-cover"
            />

            <div className="p-5">
              <h3 className="text-lg font-bold text-[#1e1d1a]">
                Premium Shared Dorm
              </h3>
              <p className="text-sm text-[#6f6a5f] flex items-center gap-1">
                <MapPin size={12} /> Colombo
              </p>

              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-[#f5f5f5] px-3 py-1 rounded">
                  <BedDouble size={12} /> 6 Beds
                </span>
                <span className="text-xs bg-[#f5f5f5] px-3 py-1 rounded">
                  <Users size={12} /> 4 Occupied
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button className={btnOutline}>View</button>
                <button className={btnGhost}>Edit</button>
              </div>
            </div>
          </div>

          {/* CHART */}
          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="font-bold mb-4 text-[#1e1d1a]">Room Occupancy</h3>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={OCCUPANCY}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="single" fill="#c9a84c" />
                <Bar dataKey="shared" fill="#e5e5e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ENQUIRIES */}
          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="font-bold mb-4 text-[#1e1d1a]">Recent Enquiries</h3>

            {ENQUIRIES.map((e) => (
              <div key={e.id} className="flex justify-between py-3 border-b">
                <div className="flex gap-3">
                  <Avatar name={e.name} />
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.room}</p>
                  </div>
                </div>

                <button
                  className="text-xs font-semibold"
                  style={{ color: e.color }}
                >
                  {e.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* BOOKINGS */}
          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="font-bold mb-4 text-[#1e1d1a]">Bookings</h3>

            {BOOKINGS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex justify-between py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon size={14} className="text-[#c9a84c]" />
                    {b.label}
                  </span>
                  <span className="font-bold">{b.value}</span>
                </div>
              );
            })}
          </div>

          {/* EARNINGS */}
          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="font-bold text-[#1e1d1a] mb-2">Earnings</h3>
            <p className="text-2xl font-bold text-[#c9a84c]">LKR 56,300</p>

            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={[
                { m: "Jan", v: 42000 },
                { m: "Feb", v: 48000 },
                { m: "Mar", v: 51000 },
                { m: "Apr", v: 56300 },
              ]}>
                <Area type="monotone" dataKey="v" stroke="#c9a84c" fill="#c9a84c33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}