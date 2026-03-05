import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, MapPin, Home, ShieldCheck } from "lucide-react";
import ownerApi from "../../api/ownerApi";

/** ✅ Move Section OUTSIDE so it doesn't remount on each keypress */
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-lg font-extrabold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">
            Fill carefully for better conversions.
          </p>
        </div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err) {
      console.error("Failed to fetch listing:", err);
    }
  };

  const toggleFacility = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (listingId) => {
    const fd = new FormData();
    photos.forEach((photo) => {
      if (photo instanceof File) fd.append("photos", photo);
    });
    await ownerApi.post(`/owner/listings/${listingId}/photos/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || formData.title.length < 5)
      return setError("Title must be at least 5 characters");
    if (!formData.description || formData.description.length < 20)
      return setError("Description must be at least 20 characters");
    if (!formData.rent || Number(formData.rent) < 1000)
      return setError("Rent must be at least LKR 1,000");
    if (Number(formData.deposit) < 0)
      return setError("Deposit cannot be negative");
    if (!formData.address || formData.address.length < 10)
      return setError("Please provide a complete address");
    if (formData.facilities.length === 0)
      return setError("Please select at least one facility");

    setLoading(true);
    try {
      let listingId = id;
      
      if (id) {
        await ownerApi.put(`/owner/listings/${id}/`, formData);
      } else {
        const { data } = await ownerApi.post("/owner/listings/", formData);
        listingId = data.id;
      }
      
      const newPhotos = photos.filter(p => p instanceof File);
      if (newPhotos.length > 0 && listingId) {
        try {
          await uploadPhotos(listingId);
        } catch (photoErr) {
          console.error('Photo upload failed:', photoErr);
        }
      }
      
      navigate("/owner/listings");
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {id ? "Edit Listing" : "Create New Listing"}
        </h1>
        <p className="text-slate-600">Modern form layout like admin dashboards.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Information" icon={Home}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Ex: Single room near University"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Explain room type, rules, distance, facilities..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Monthly Rent (LKR)
              </label>
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Deposit (LKR)
              </label>
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) =>
                  setFormData({ ...formData, deposit: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Gender Allowed
              </label>
              <select
                value={formData.genderAllowed}
                onChange={(e) =>
                  setFormData({ ...formData, genderAllowed: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
            {facilityOptions.map((facility) => {
              const active = formData.facilities.includes(facility);
              return (
                <button
                  key={facility}
                  type="button"
                  onClick={() => toggleFacility(facility)}
                  className={[
                    "px-4 py-2 rounded-xl font-bold transition",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {facility}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3">Select at least one.</p>
        </Section>

        <Section title="Location" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Longitude
              </label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </Section>

        <Section title="Photos" icon={Upload}>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50">
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 grid place-items-center">
                <Upload size={24} className="text-slate-600" />
              </div>
              <p className="mt-3 font-bold text-slate-800">Click to upload photos</p>
              <p className="text-sm text-slate-500">JPG/PNG recommended.</p>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo instanceof File ? URL.createObjectURL(photo) : photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-28 object-cover rounded-2xl border border-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition"
                    aria-label="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : id ? "Update Listing" : "Create Listing"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/owner/listings")}
            className="px-6 py-3 rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}