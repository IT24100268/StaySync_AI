import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, MapPin, Home, ShieldCheck, ImagePlus } from "lucide-react";
import ownerApi from "../../api/ownerApi";
import { cardCls, cardStyle, inputCls, btnGold, btnGhost, PageHeader } from "./ownerTheme.jsx";

function Section({ title, icon: Icon, children }) {
  return (
    <div className={cardCls("p-6")} style={cardStyle()}>
      <div className="mb-5 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-[12px]"
          style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
        >
          <Icon size={15} className="text-[#b98b1f]" />
        </div>
        <p className="text-[15px] font-extrabold text-[#1e1d1a]">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function OwnerListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rent: "",
    deposit: "",
    facilities: [],
    genderAllowed: "any",
    latitude: "",
    longitude: "",
    address: "",
  });

  const facilityOptions = useMemo(
    () => ["WiFi", "AC", "Parking", "Kitchen", "Laundry", "Security", "Water 24/7"],
    []
  );

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await ownerApi.get(`/owner/listings/${id}/`);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        rent: data.rent ?? "",
        deposit: data.deposit ?? "",
        facilities: data.facilities || [],
        genderAllowed: data.genderAllowed || "any",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        address: data.address || "",
      });
      setPhotos(data.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFacility = (f) =>
    setFormData((p) => ({
      ...p,
      facilities: p.facilities.includes(f)
        ? p.facilities.filter((x) => x !== f)
        : [...p.facilities, f],
    }));

  const handlePhotoChange = (e) => setPhotos((p) => [...p, ...Array.from(e.target.files || [])]);
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const uploadPhotos = async (lid) => {
    const fd = new FormData();
    photos.forEach((p) => {
      if (p instanceof File) fd.append("photos", p);
    });
    await ownerApi.post(`/owner/listings/${lid}/photos/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || formData.title.length < 5) return setError("Title must be at least 5 characters");
    if (!formData.description || formData.description.length < 20) return setError("Description must be at least 20 characters");
    if (!formData.rent || Number(formData.rent) < 1000) return setError("Rent must be at least LKR 1,000");
    if (Number(formData.deposit) < 0) return setError("Deposit cannot be negative");
    if (!formData.address || formData.address.length < 10) return setError("Please provide a complete address");
    if (formData.facilities.length === 0) return setError("Please select at least one facility");

    setLoading(true);

    try {
      let lid = id;

      if (id) {
        await ownerApi.put(`/owner/listings/${id}/`, formData);
      } else {
        const { data } = await ownerApi.post("/owner/listings/", formData);
        lid = data.id;
      }

      if (photos.filter((p) => p instanceof File).length > 0 && lid) {
        try {
          await uploadPhotos(lid);
        } catch (e) {
          console.error("Photo upload failed:", e);
        }
      }

      navigate("/owner/listings");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  const label = (text, required = false) => (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
      {text}
      {required && <span className="ml-1 text-[#b98b1f]">*</span>}
    </label>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        icon={Home}
        title={id ? "Edit Listing" : "Create New Listing"}
        subtitle="Fill in the details carefully for better conversion and trust."
      />

      {error && (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Basic Information" icon={Home}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              {label("Title", true)}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputCls}
                placeholder="Ex: Premium single room near university"
                required
              />
            </div>

            <div className="md:col-span-2">
              {label("Description", true)}
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputCls} resize-none`}
                placeholder="Explain room type, rules, distance to campus, facilities…"
                required
              />
            </div>

            <div>
              {label("Monthly Rent (LKR)", true)}
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              {label("Deposit (LKR)", true)}
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              {label("Gender Allowed")}
              <select
                value={formData.genderAllowed}
                onChange={(e) => setFormData({ ...formData, genderAllowed: e.target.value })}
                className={inputCls}
              >
                <option value="any">Any</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Facilities" icon={ShieldCheck}>
          <div className="flex flex-wrap gap-2">
            {facilityOptions.map((f) => {
              const active = formData.facilities.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`rounded-[12px] border px-4 py-2 text-[12px] font-bold transition-all ${
                    active
                      ? "border-[#dcc89a] bg-[#fff8e8] text-[#b98b1f]"
                      : "border-[#ebe4d8] bg-white text-[#6f6a5f] hover:bg-[#faf7f1]"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[#8b8578]">Select at least one facility.</p>
        </Section>

        <Section title="Location" icon={MapPin}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              {label("Address", true)}
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputCls}
                required
              />
            </div>

            <div>
              {label("Latitude")}
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              {label("Longitude")}
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        <Section title="Photos" icon={ImagePlus}>
          <div className="rounded-[16px] border-2 border-dashed border-[#eadfc7] bg-[#fffaf2] p-8 transition hover:border-[#dcc89a]">
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label htmlFor="photo-upload" className="flex cursor-pointer flex-col items-center text-center">
              <div
                className="grid h-14 w-14 place-items-center rounded-[16px]"
                style={{ background: "#fff8e8", border: "1px solid #eadab1" }}
              >
                <Upload size={20} className="text-[#b98b1f]" />
              </div>
              <p className="mt-3 text-[13px] font-bold text-[#2b2823]">Click to upload photos</p>
              <p className="text-[11px] text-[#8b8578]">JPG / PNG recommended</p>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img
                    src={p instanceof File ? URL.createObjectURL(p) : p.url}
                    alt={`Photo ${i + 1}`}
                    className="h-28 w-full rounded-[14px] border border-[#eadfc7] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/80 text-white transition hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 ${btnGold}`}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 6px 20px rgba(201,168,76,0.22)",
            }}
          >
            {loading ? "Saving…" : id ? "Update Listing" : "Create Listing"}
          </button>

          <button type="button" onClick={() => navigate("/owner/listings")} className={btnGhost}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}