import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Building2, Save } from "lucide-react";
import ownerApi from "../../api/ownerApi.js";
import { cardCls, cardStyle, inputCls, btnGold, PageHeader, Avatar } from "./ownerTheme.jsx";

export default function OwnerProfile() {
  const [form, setForm] = useState({
    username: "", email: "", hostel_name: "", phone_number: "", address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    ownerApi.get("/auth/profile/")
      .then(({ data }) => {
        setForm({
          username: data.username || "",
          email: data.email || "",
          hostel_name: data.profile?.hostel_name || "",
          phone_number: data.profile?.phone_number || "",
          address: data.profile?.address || "",
        });
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load profile." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await ownerApi.put("/auth/profile/", {
        username: form.username,
        email: form.email,
        profile: {
          hostel_name: form.hostel_name,
          phone_number: form.phone_number,
          address: form.address,
        },
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === "object"
        ? Object.values(detail).flat().join(" ")
        : "Failed to save changes.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="p-6" style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      <PageHeader
        icon={User}
        title="My Profile"
        subtitle="Manage your account and hostel information"
      />

      <div className="mx-auto max-w-2xl">
        <div className={`${cardCls("p-6 mb-5 flex items-center gap-5")}`} style={cardStyle()}>
          <Avatar name={form.username || "Owner"} size="lg" />
          <div>
            <p className="text-lg font-extrabold text-[#1e1d1a]">{form.username || "Owner"}</p>
            <p className="text-sm text-[#6f6a5f]">{form.email || "—"}</p>
          </div>
        </div>

        <div className={`${cardCls("p-6")}`} style={cardStyle()}>
          <h2 className="mb-5 text-[15px] font-extrabold text-[#1e1d1a]">Edit Information</h2>

          {message && (
            <div
              className="mb-5 rounded-[12px] px-4 py-3 text-sm font-semibold"
              style={{
                background: message.type === "success" ? "#edf7f0" : "#fdeeee",
                color: message.type === "success" ? "#1f7a3f" : "#b42318",
                border: `1px solid ${message.type === "success" ? "#b6e8c6" : "#f5c0c0"}`,
              }}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-[14px] bg-[#eee7db]" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                  <User size={11} /> Username
                </label>
                <input className={inputCls} value={form.username} onChange={set("username")} placeholder="username" />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                  <Mail size={11} /> Email
                </label>
                <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="email@example.com" />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                  <Building2 size={11} /> Hostel Name
                </label>
                <input className={inputCls} value={form.hostel_name} onChange={set("hostel_name")} placeholder="Your hostel name" />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                  <Phone size={11} /> Phone Number
                </label>
                <input className={inputCls} value={form.phone_number} onChange={set("phone_number")} placeholder="+94 77 000 0000" />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#6f6a5f]">
                  <MapPin size={11} /> Address
                </label>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Your address"
                  style={{ resize: "none" }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={btnGold}
                style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)", width: "100%" }}
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
