import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Home, UtensilsCrossed, Truck, AlertCircle, ShoppingBag, Shield,
  RefreshCcw, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock,
  UserPlus, Zap, Activity, Brain, DollarSign, MapPin, Server, Database,
  CreditCard, Package
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../../services/api";

export default function AdminHome2() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/summary/");
      setStats(data);
      
      // Mock chart data - replace with real API
      setChartData([
        { month: 'Jan', users: 120, rooms: 45, orders: 230 },
        { month: 'Feb', users: 180, rooms: 62, orders: 310 },
        { month: 'Mar', users: 250, rooms: 85, orders: 420 },
        { month: 'Apr', users: 320, rooms: 110, orders: 580 },
        { month: 'May', users: 410, rooms: 145, orders: 720 },
        { month: 'Jun', users: 520, rooms: 180, orders: 890 },
      ]);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats?.total_users || 0}
          trend={12}
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Blocked Users"
          value={stats?.blocked_users || 0}
          trend={-5}
          color="red"
        />
        <StatCard
          icon={Home}
          label="Pending Rooms"
          value={stats?.pending_rooms || 0}
          trend={8}
          color="orange"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Pending Restaurants"
          value={stats?.pending_restaurants || 0}
          trend={3}
          color="green"
        />
        <StatCard
          icon={Truck}
          label="Pending Partners"
          value={stats?.pending_partners || 0}
          trend={-2}
          color="purple"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders Today"
          value={stats?.total_orders_today || 0}
          trend={15}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Platform Growth</h2>
              <p className="text-sm text-slate-500 mt-1">New users, rooms, and orders over time</p>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-slate-100 transition">
              <RefreshCcw size={18} className="text-slate-600" />
            </button>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="rooms" stroke="#10b981" fillOpacity={1} fill="url(#colorRooms)" />
                <Area type="monotone" dataKey="orders" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Platform Health</h2>
          <div className="space-y-3">
            <HealthItem label="API Status" status="operational" icon={Server} />
            <HealthItem label="Database" status="operational" icon={Database} />
            <HealthItem label="Payment Service" status="operational" icon={CreditCard} />
            <HealthItem label="Delivery System" status="degraded" icon={Package} />
          </div>
        </div>
      </div>

      {/* Approval Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ApprovalCard
          title="Room Approvals"
          count={stats?.pending_rooms || 0}
          link="/admin/rooms"
          icon={Home}
          color="blue"
        />
        <ApprovalCard
          title="Restaurant Approvals"
          count={stats?.pending_restaurants || 0}
          link="/admin/restaurants"
          icon={UtensilsCrossed}
          color="green"
        />
        <ApprovalCard
          title="Partner Approvals"
          count={stats?.pending_partners || 0}
          link="/admin/partners"
          icon={Truck}
          color="purple"
        />
        <ApprovalCard
          title="Reports Queue"
          count={stats?.pending_reports || 0}
          link="/admin/reports"
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-blue-50">
              <Brain size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InsightCard
              icon={AlertCircle}
              title="Suspicious Activity"
              description="3 suspicious listings detected"
              color="red"
            />
            <InsightCard
              icon={TrendingUp}
              title="Demand Prediction"
              description="High room demand in Colombo"
              color="green"
            />
            <InsightCard
              icon={DollarSign}
              title="Pricing Insights"
              description="Avg rent: LKR 12,000"
              color="blue"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-blue-50">
              <Zap size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionBtn icon={UserPlus} label="Add User" link="/admin/users" color="blue" />
            <QuickActionBtn icon={CheckCircle} label="Approve Rooms" link="/admin/rooms" color="green" />
            <QuickActionBtn icon={UtensilsCrossed} label="Restaurants" link="/admin/restaurants" color="orange" />
            <QuickActionBtn icon={AlertCircle} label="Reports" link="/admin/reports" color="red" />
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-blue-50">
            <Activity size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          <TimelineItem
            icon={CheckCircle}
            title="Room listing approved"
            time="2 minutes ago"
            color="green"
          />
          <TimelineItem
            icon={XCircle}
            title="Restaurant rejected"
            time="15 minutes ago"
            color="red"
          />
          <TimelineItem
            icon={UserPlus}
            title="New delivery partner applied"
            time="1 hour ago"
            color="blue"
          />
          <TimelineItem
            icon={AlertCircle}
            title="User reported a listing"
            time="2 hours ago"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-l-red-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-l-orange-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-l-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-l-purple-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500' },
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${colors[color].border} p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors[color].bg}`}>
          <Icon size={20} className={colors[color].text} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function HealthItem({ label, status, icon: Icon }) {
  const statusColors = {
    operational: 'bg-green-100 text-green-700 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    down: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-600" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}

function ApprovalCard({ title, count, link, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    green: 'from-green-500 to-green-600 shadow-green-500/20',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
    red: 'from-red-500 to-red-600 shadow-red-500/20',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg text-white grid place-items-center mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mb-4">{count}</p>
      <Link to={link} className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
        Review →
      </Link>
    </div>
  );
}

function InsightCard({ icon: Icon, title, description, color }) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} grid place-items-center mb-3`}>
        <Icon size={20} />
      </div>
      <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}

function QuickActionBtn({ icon: Icon, label, link, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <Link to={link} className={`flex flex-col items-center gap-2 p-3 rounded-lg ${colors[color]} transition`}>
      <Icon size={20} />
      <span className="text-xs font-semibold text-center">{label}</span>
    </Link>
  );
}

function TimelineItem({ icon: Icon, title, time, color }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`w-8 h-8 rounded-full ${colors[color]} grid place-items-center flex-shrink-0`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
}
