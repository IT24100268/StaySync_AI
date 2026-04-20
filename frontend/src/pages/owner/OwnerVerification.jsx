import { useState, useEffect } from "react";
import { BadgeCheck, CheckCircle, Clock, FileText, ShieldCheck, Upload, XCircle, AlertTriangle } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, inputCls, btnGold, btnGhost, PageHeader } from "./ownerTheme.jsx";

export default function OwnerVerification() {
  const [verificationStatus, setVerificationStatus] = useState(null); // full status from API
  const [form, setForm] = useState({ nic_passport_number: "", address_proof: "", business_reg_no: "" });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await ownerApi.get("/owner/verification/");
      setVerificationStatus(data);
      if (data.verification) {
        setForm({
          nic_passport_number: data.verification.nic_passport_number || "",
          address_proof: data.verification.address_proof || "",
          business_reg_no: data.verification.business_reg_no || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File size must be less than 5MB");
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) return alert("Only JPG, PNG, and PDF files are allowed");
    setFiles((p) => ({ ...p, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nic_passport_number.trim()) return alert("Please enter your NIC/Passport number");
    if (!form.address_proof.trim()) return alert("Please enter your address proof");
    if (!files.nic_doc) return alert("Please upload your NIC/Passport document");
    if (!files.address_doc) return alert("Please upload your address proof document");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("nic_passport_number", form.nic_passport_number);
      fd.append("address_proof", form.address_proof);
      fd.append("business_reg_no", form.business_reg_no);
      if (files.nic_doc) fd.append("nic_doc", files.nic_doc);
      if (files.address_doc) fd.append("address_doc", files.address_doc);
      if (files.business_doc) fd.append("business_doc", files.business_doc);

      await ownerApi.post("/owner/verification/submit/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      fetchStatus();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to submit verification form");
    } finally {
      setSubmitting(false);
    }
  };

  const vStatus = verificationStatus?.verification?.status || "none";
  const isUnderVerification = verificationStatus?.is_under_verification;
  const verificationNote = verificationStatus?.verification_note;

  const statusMap = {
    verified: { cls: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: <CheckCircle size={15} />, label: "Verified", note: "Your identity is verified. You have full access." },
    submitted: { cls: "border-blue-200 bg-blue-50 text-blue-700", icon: <Clock size={15} />, label: "Under Review", note: "Your documents are being reviewed by the admin." },
    rejected: { cls: "border-rose-200 bg-rose-50 text-rose-700", icon: <XCircle size={15} />, label: "Rejected", note: "Some documents need correction. Please resubmit." },
  };
  const s = statusMap[vStatus] || { cls: "border-[#eadab1] bg-[#fff8e8] text-[#9a6a00]", icon: <Clock size={15} />, label: "Pending", note: "Fill the form below and submit for admin review." };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#b98b1f]" /></div>;
  }

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

      {/* Verification request banner */}
      {isUnderVerification && vStatus !== "submitted" && vStatus !== "verified" && (
        <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-extrabold text-amber-900">Verification Required</p>
              <p className="mt-1 text-sm text-amber-800">
                The admin has requested identity verification. You cannot add new rooms or receive bookings until you complete this form and the admin approves it.
              </p>
              {verificationNote && (
                <p className="mt-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900">
                  <strong>Admin note:</strong> {verificationNote}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already submitted banner */}
      {(vStatus === "submitted" || submitted) && (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-extrabold text-blue-900">Form Submitted — Awaiting Admin Review</p>
              <p className="mt-1 text-sm text-blue-800">Your verification documents have been submitted. The admin will review and restore your full access once verified.</p>
            </div>
          </div>
        </div>
      )}

      {/* Verified banner */}
      {vStatus === "verified" && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <BadgeCheck size={22} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-extrabold text-emerald-900">Identity Verified</p>
              <p className="mt-1 text-sm text-emerald-800">Your account is fully verified. You have complete access to all features.</p>
            </div>
          </div>
        </div>
      )}

      <section className={`${cardCls("p-6")} grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]`} style={cardStyle()}>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">NIC / Passport Number *</label>
                <input type="text" value={form.nic_passport_number} onChange={(e) => setForm({ ...form, nic_passport_number: e.target.value })} className={inputCls} required />
              </div>

              <UploadCard id="nic-upload" label="Identity Document" hint="Upload your NIC, passport, or driver's license." field="nic_doc" files={files} onChange={handleFileChange} />

              <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">Address Proof *</label>
                <input type="text" value={form.address_proof} onChange={(e) => setForm({ ...form, address_proof: e.target.value })} className={inputCls} placeholder="Enter your address" required />
              </div>

              <UploadCard id="address-upload" label="Address Proof Document" hint="Upload a utility bill or official proof of address." field="address_doc" files={files} onChange={handleFileChange} />

              <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
                <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
                  <FileText size={11} className="text-[#b98b1f]" /> Business Registration
                </label>
                <input type="text" value={form.business_reg_no} onChange={(e) => setForm({ ...form, business_reg_no: e.target.value })} className={inputCls} placeholder="Registration number (optional)" />
              </div>

              <UploadCard id="business-upload" label="Business Registration" hint="Optional but strengthens your credibility." field="business_doc" files={files} onChange={handleFileChange} />
            </div>

            <button
              type="submit"
              disabled={submitting || vStatus === "verified" || vStatus === "submitted"}
              className={`w-full ${btnGold}`}
              style={{ background: "linear-gradient(135deg,#c9a84c,#a07830)", boxShadow: "0 10px 24px rgba(201,168,76,0.24)" }}
            >
              {submitting ? "Submitting..." : vStatus === "submitted" ? "Already Submitted" : vStatus === "verified" ? "Already Verified" : "Submit for Review"}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className={cardCls("p-5")} style={cardStyle()}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9b9588]">Current Status</p>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${s.cls}`}>{s.icon} {s.label}</div>
            <p className="mt-4 text-sm leading-7 text-[#5f5a4f]">{s.note}</p>
          </div>

          <div className={cardCls("p-5")} style={cardStyle()}>
            <h3 className="text-[18px] font-extrabold tracking-tight text-[#1e1d1a]">Before You Submit</h3>
            <div className="mt-4 space-y-3">
              {["Use a clear front-and-back image for the ID card.", "Make sure names, numbers, and dates are readable.", "Keep each uploaded file under 5MB.", "Use matching information across all documents."].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[16px] border border-[#ece3d3] bg-[#fcfbf8] px-4 py-3">
                  <CheckCircle size={16} className="mt-0.5 text-[#b58c2f]" />
                  <p className="text-sm leading-6 text-[#5f5a4f]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function UploadCard({ id, label, hint, field, files, onChange }) {
  return (
    <div className="rounded-[20px] border border-[#ece3d3] bg-[#fcfbf8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-extrabold text-[#1e1d1a]">{label}</p>
          <p className="mt-1 text-[12px] text-[#6f6a5f]">{hint}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: "#fff8e8", border: "1px solid #eadab1" }}>
          <Upload size={16} className="text-[#b98b1f]" />
        </div>
      </div>
      <input type="file" accept="image/*,application/pdf" onChange={(e) => onChange(field, e.target.files[0])} className="hidden" id={id} />
      <label htmlFor={id} className="mt-4 flex cursor-pointer items-center justify-center rounded-[16px] border-2 border-dashed border-[#eadfc7] bg-[#fffaf2] px-4 py-5 text-center transition hover:border-[#dcc89a]">
        <div>
          <p className="text-sm font-bold text-[#2b2823]">{files[field] ? files[field].name : "Click to upload file"}</p>
          <p className="mt-1 text-[11px] text-[#8b8578]">JPG, PNG, PDF up to 5MB</p>
        </div>
      </label>
    </div>
  );
}
