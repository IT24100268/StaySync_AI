import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  FileText,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, inputCls, btnGold, btnGhost, PageHeader } from "./ownerTheme.jsx";

export default function OwnerVerification() {
  const [verification, setVerification] = useState({
    nicPassport: "",
    addressProof: "",
    businessReg: "",
    status: "pending",
  });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    try {
      const { data } = await ownerApi.get("/auth/profile/");
      if (data?.verification) {
        setVerification(data.verification);
        return;
      }

      const profile = data?.profile || {};
      setVerification((current) => ({
        ...current,
        businessReg: profile.business_reg_no || current.businessReg || "",
        addressProof: profile.address || current.addressProof || "",
        status: data?.is_approved ? "approved" : "pending",
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File size must be less than 5MB");
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) return alert("Only JPG, PNG, and PDF files are allowed");
    setFiles((p) => ({ ...p, [field]: file }));
  };

  const statusMap = {
    approved: {
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <CheckCircle size={15} />,
      label: "Verified",
      note: "Your owner identity is approved and trusted.",
    },
    rejected: {
      cls: "border-rose-200 bg-rose-50 text-rose-700",
      icon: <XCircle size={15} />,
      label: "Rejected",
      note: "Some documents need correction before approval.",
    },
  };

  const s = statusMap[verification.status] || {
    cls: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    icon: <Clock size={15} />,
    label: "Pending Review",
    note: "Your documents are waiting for admin review.",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!verification.nicPassport || verification.nicPassport.length < 5) {
      setLoading(false);
      return alert("Please enter a valid NIC/Passport number");
    }
    if (!verification.addressProof || verification.addressProof.length < 10) {
      setLoading(false);
      return alert("Please enter a valid address");
    }
    if (!files.nicDoc) {
      setLoading(false);
      return alert("Please upload NIC/Passport document");
    }
    if (!files.addressDoc) {
      setLoading(false);
      return alert("Please upload address proof document");
    }

    try {
      const fd = new FormData();
      Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));

      if (Object.keys(files).length > 0) {
        await ownerApi.post("/owner/verification/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await ownerApi.put("/owner/verification", verification);
      alert("Verification submitted successfully!");
      fetchVerification();
    } catch (e) {
      console.error(e);
      alert("Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  const UploadCard = ({ id, label, hint, field }) => (
    <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-extrabold text-[#1e1d1a]">{label}</p>
          <p className="mt-1 text-[12px] text-[#6f6a5f]">{hint}</p>
        </div>
        <div
          className="grid h-10 w-10 place-items-center rounded-[12px]"
          style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
        >
          <Upload size={16} className="text-[#b98b1f]" />
        </div>
      </div>

      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => handleFileChange(field, e.target.files[0])}
        className="hidden"
        id={id}
      />

      <label
        htmlFor={id}
        className="mt-4 flex cursor-pointer items-center justify-center rounded-[16px] border-2 border-dashed border-[#eadfc7] bg-[#fffaf2] px-4 py-5 text-center transition hover:border-[#dcc89a]"
      >
        <div>
          <p className="text-sm font-bold text-[#2b2823]">
            {files[field] ? files[field].name : "Click to upload file"}
          </p>
          <p className="mt-1 text-[11px] text-[#8b8578]">JPG, PNG, PDF up to 5MB</p>
        </div>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BadgeCheck}
        title="Validation"
        subtitle="Verify your identity to unlock full trust and access for your hostel owner account."
        action={
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold ${s.cls}`}>
            {s.icon} {s.label}
          </span>
        }
      />

      <section
        className={`${cardCls("p-6")} grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]`}
        style={cardStyle()}
      >
        <div className="space-y-6">
          <div
            className="rounded-[24px] border p-5"
            style={{
              background: "linear-gradient(135deg,#fffaf0 0%, #ffffff 100%)",
              borderColor: "#e7d29d",
              boxShadow: "0 10px 26px rgba(201,168,76,0.12)",
            }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div
                className="grid h-20 w-20 place-items-center rounded-[24px] flex-shrink-0"
                style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
              >
                <ShieldCheck size={34} className="text-[#b98b1f]" />
              </div>
              <div>
                <h2 className="text-[28px] font-black tracking-tight text-[#1e1d1a]">Identity & Trust Verification</h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#5f5a4f]">
                  Upload clear identification and address documents so students and parents can trust your profile with confidence.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["National ID Card", "Passport", "Driver’s License", "Utility Bill"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-[#ece3d3] bg-white px-3 py-2 text-xs font-bold text-[#5f5a4f]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
                  NIC / Passport Number *
                </label>
                <input
                  type="text"
                  value={verification.nicPassport}
                  onChange={(e) => setVerification({ ...verification, nicPassport: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>

              <UploadCard
                id="nic-upload"
                label="Identity Document"
                hint="Upload your NIC, passport, or driver’s license copy."
                field="nicDoc"
              />

              <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
                  Address Proof *
                </label>
                <input
                  type="text"
                  value={verification.addressProof}
                  onChange={(e) => setVerification({ ...verification, addressProof: e.target.value })}
                  className={inputCls}
                  placeholder="Enter your address"
                  required
                />
              </div>

              <UploadCard
                id="address-upload"
                label="Address Proof"
                hint="Upload a utility bill or official proof of address."
                field="addressDoc"
              />

              <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
                  <FileText size={11} className="text-[#b98b1f]" /> Business Registration
                </label>
                <input
                  type="text"
                  value={verification.businessReg}
                  onChange={(e) => setVerification({ ...verification, businessReg: e.target.value })}
                  className={inputCls}
                  placeholder="Registration number (optional)"
                />
              </div>

              <UploadCard
                id="business-upload"
                label="Business Registration"
                hint="Optional but useful to strengthen your owner credibility."
                field="businessDoc"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading || verification.status === "approved"}
                className={`flex-1 ${btnGold}`}
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#a07830)",
                  boxShadow: "0 10px 24px rgba(201,168,76,0.24)",
                }}
              >
                {loading ? "Submitting..." : "Submit for Review"}
              </button>

              <button
                type="button"
                className={btnGhost}
                onClick={() => alert("Support contact can be connected here.")}
              >
                Contact Support
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className={cardCls("p-5")} style={cardStyle()}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Current Status</p>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${s.cls}`}>
              {s.icon} {s.label}
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5f5a4f]">{s.note}</p>
          </div>

          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="text-[18px] font-extrabold tracking-tight text-[#1e1d1a]">Before You Submit</h3>
            <div className="mt-4 space-y-3">
              {[
                "Use a clear front-and-back image for the ID card or a full passport page.",
                "Make sure names, numbers, and dates are readable.",
                "Keep each uploaded file under 5MB.",
                "Use matching information across all uploaded documents.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[16px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-3">
                  <CheckCircle size={16} className="mt-0.5 text-[#b58c2f]" />
                  <p className="text-sm leading-6 text-[#5f5a4f]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[24px] p-5 text-white"
            style={{
              background: "linear-gradient(180deg,#1a1a1f 0%, #17171b 100%)",
              border: "1px solid rgba(212,175,55,0.12)",
              boxShadow: "0 18px 44px rgba(14,14,18,0.18)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Why It Matters</p>
            <h3 className="mt-3 text-[22px] font-black tracking-tight text-white">Stronger trust, better conversions</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Verified owners are easier for students and parents to trust, which can help enquiries and booking confidence grow faster.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
