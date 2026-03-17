import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { Building2, Mail, Lock } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-[#e7dfd1] bg-white px-4 py-3 text-sm text-[#1e1d1a] outline-none transition placeholder:text-[#a39b8f] focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10";

export default function OwnerLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useOwnerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData);
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(180deg,#f7f4ee 0%, #f3efe8 55%, #f8f5ef 100%)",
      }}
    >
      <div className="relative w-full max-w-md">
        <div
          className="rounded-[28px] border p-8"
          style={{
            background: "#ffffff",
            borderColor: "#eadfcb",
            boxShadow: "0 24px 80px rgba(0,0,0,0.10)",
          }}
        >
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg,#fff8e8,#f9f1d8)",
                border: "1px solid #eadab1",
              }}
            >
              <Building2 size={24} className="text-[#b98b1f]" />
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold tracking-wide text-[#1e1d1a]">
                StaySync <span className="text-[#b98b1f]">AI</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b8578]">Owner Portal</p>
            </div>
          </div>

          <h2 className="mb-1 text-2xl font-extrabold text-[#1e1d1a]">Welcome back</h2>
          <p className="mb-6 text-sm text-[#6f6a5f]">Sign in to access your hostel dashboard</p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                <Mail size={12} className="text-[#b98b1f]" /> Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                <Lock size={12} className="text-[#b98b1f]" /> Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#c9a84c,#a07830)",
                boxShadow: "0 8px 24px rgba(201,168,76,0.3)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6f6a5f]">
            Don&apos;t have an account?{" "}
            <Link to="/owner/register" className="font-bold text-[#a07830] hover:text-[#c9a84c]">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}