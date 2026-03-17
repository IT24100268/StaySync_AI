import { useState, useEffect } from "react";
import { Upload, CheckCircle, XCircle, Clock, ShieldCheck, FileText, BadgeCheck } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, inputCls, btnGold, PageHeader } from "./ownerTheme.jsx";

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
      const { data } = await ownerApi.get("/owner/me");
      if (data?.verification) setVerification(data.verification);
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
      cls: "border-green-200 bg-green-50 text-green-700",
      icon: <CheckCircle size={15} />,
      label: "Verified",
    },
    rejected: {
      cls: "border-red-200 bg-red-50 text-red-700",
      icon: <XCircle size={15} />,
      label: "Rejected",
    },
  };

  const s = statusMap[verification.status] || {
    cls: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]",
    icon: <Clock size={15} />,
    label: "Pending Review",
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

  const UploadBox = ({ id, label, field }) => (
    <div className="rounded-[16px] border-2 border-dashed border-[#eadfc7] bg-[#fffaf2] p-5 transition hover:border-[#dcc89a]">
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => handleFileChange(field, e.target.files[0])}
        className="hidden"
        id={id}
      />
      <label htmlFor={id} className="flex cursor-pointer items-center gap-4">
        <div
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[12px]"
          style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
        >
          <Upload size={16} className="text-[#b98b1f]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#2b2823]">{label}</p>
          <p className="mt-0.5 text-[11px] text-[#6f6a5f]">
            {files[field] ? files[field].name : "Click to upload · JPG / PNG / PDF"}
          </p>
        </div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        icon={BadgeCheck}
        title="Profile Verification"
        subtitle="Verify your identity to build trust and improve listing credibility."
        action={
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold ${s.cls}`}>
            {s.icon} {s.label}
          </span>
        }
      />

      <div className={cardCls("p-5")} style={cardStyle()}>
        <div className="mb-3 flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-[12px]"
            style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
          >
            <ShieldCheck size={15} className="text-[#b98b1f]" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-[#2b2823]">Why verify?</p>
            <p className="text-[11px] text-[#6f6a5f]">More trust usually means more enquiries.</p>
          </div>
        </div>

        <ul className="space-y-1.5 text-[12px] text-[#6f6a5f]">
          {[
            "Builds trust with students and parents",
            "Helps improve property credibility",
            "Supports better visibility for your listings",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[#b98b1f] flex-shrink-0" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className={cardCls("p-6 space-y-5")} style={cardStyle()}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
            <UploadBox id="nic-upload" label="Upload NIC / Passport Copy *" field="nicDoc" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
              Address Proof (Utility Bill) *
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

          <div className="md:col-span-2">
            <UploadBox id="address-upload" label="Upload Address Proof *" field="addressDoc" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
              <FileText size={11} className="text-[#b98b1f]" /> Business Registration (Optional)
            </label>
            <input
              type="text"
              value={verification.businessReg}
              onChange={(e) => setVerification({ ...verification, businessReg: e.target.value })}
              className={inputCls}
              placeholder="Registration number"
            />
          </div>

          <div className="md:col-span-2">
            <UploadBox id="business-upload" label="Upload Business Registration (Optional)" field="businessDoc" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || verification.status === "approved"}
          className={`w-full ${btnGold}`}
          style={{
            background: "linear-gradient(135deg,#c9a84c,#a07830)",
            boxShadow: "0 6px 20px rgba(201,168,76,0.22)",
          }}
        >
          {loading ? "Submitting…" : "Submit for Verification"}
        </button>
      </form>
    </div>
  );
}