import { useState, useEffect } from "react";
import { Upload, CheckCircle, XCircle, Clock, ShieldCheck, FileText } from "lucide-react";
import ownerApi from "../../api/ownerApi";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVerification = async () => {
    try {
      const { data } = await ownerApi.get("/owner/me");
      if (data?.verification) setVerification(data.verification);
    } catch (error) {
      console.error("Failed to fetch verification:", error);
    }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return alert("File size must be less than 5MB");

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) return alert("Only JPG, PNG, and PDF files are allowed");

    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const statusBadge = () => {
    switch (verification.status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
            <CheckCircle size={18} />
            Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-100 text-red-700 font-bold">
            <XCircle size={18} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 text-amber-700 font-bold">
            <Clock size={18} />
            Pending Review
          </span>
        );
    }
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
      Object.entries(files).forEach(([key, file]) => file && fd.append(key, file));

      if (Object.keys(files).length > 0) {
        await ownerApi.post("/owner/verification/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await ownerApi.put("/owner/verification", verification);

      alert("Verification submitted successfully!");
      fetchVerification();
    } catch (error) {
      console.error("Failed to submit verification:", error);
      alert("Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  const UploadBox = ({ id, label, field }) => (
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => handleFileChange(field, e.target.files[0])}
        className="hidden"
        id={id}
      />
      <label htmlFor={id} className="flex items-center gap-4 cursor-pointer">
        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 grid place-items-center">
          <Upload size={20} className="text-slate-700" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-slate-900">{label}</p>
          <p className="text-sm text-slate-500 truncate">
            {files[field] ? files[field].name : "Click to upload (JPG/PNG/PDF)"}
          </p>
        </div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Profile Verification</h1>
          <p className="text-slate-600">
            Verify your identity to build trust and get better visibility.
          </p>
        </div>
        {statusBadge()}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-extrabold text-slate-900">Why verify?</p>
            <p className="text-sm text-slate-600">More trust = more enquiries.</p>
          </div>
        </div>

        <ul className="text-sm text-slate-700 space-y-1">
          <li>• Builds trust with potential tenants</li>
          <li>• Helps you rank higher in search</li>
          <li>• Unlocks premium features later</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-extrabold text-slate-700 mb-2">
              NIC / Passport Number *
            </label>
            <input
              type="text"
              value={verification.nicPassport}
              onChange={(e) => setVerification({ ...verification, nicPassport: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              required
            />
          </div>

          <div className="md:col-span-2">
            <UploadBox id="nic-upload" label="Upload NIC/Passport Copy *" field="nicDoc" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-extrabold text-slate-700 mb-2">
              Address Proof (Utility Bill) *
            </label>
            <input
              type="text"
              value={verification.addressProof}
              onChange={(e) => setVerification({ ...verification, addressProof: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Enter your address"
              required
            />
          </div>

          <div className="md:col-span-2">
            <UploadBox id="address-upload" label="Upload Address Proof *" field="addressDoc" />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-slate-400" />
              <label className="block text-sm font-extrabold text-slate-700">
                Business Registration (Optional)
              </label>
            </div>
            <input
              type="text"
              value={verification.businessReg}
              onChange={(e) => setVerification({ ...verification, businessReg: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Registration number"
            />
          </div>

          <div className="md:col-span-2">
            <UploadBox
              id="business-upload"
              label="Upload Business Registration (Optional)"
              field="businessDoc"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || verification.status === "approved"}
          className="w-full px-6 py-3 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit for Verification"}
        </button>
      </form>
    </div>
  );
}