import { useState } from "react";
import { MapPin, Loader, CheckCircle, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { cardCls, cardStyle, inputCls, btnGold, PageHeader } from "./ownerTheme.jsx";

export default function AddPropertyForm() {
  const [formData, setFormData] = useState({
    title: "",
    address_line_1: "",
    address_line_2: "",
    area: "",
    city: "",
    landmark: "",
    postal_code: "",
    contact_number: "",
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    detected_address: "",
  });

  const [detecting, setDetecting] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFindLocation = async () => {
    if (!formData.address_line_1 || !formData.city) {
      setMessage("Please fill in Address Line 1 and City");
      setLocationStatus("error");
      return;
    }

    setDetecting(true);
    setLocationStatus(null);
    setMessage("");

    try {
      const res = await api.post("/rooms/detect-location/", {
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        area: formData.area,
        city: formData.city,
        landmark: formData.landmark,
        postal_code: formData.postal_code,
      });

      if (res.data.success) {
        setLocation({
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          detected_address: res.data.detected_address,
        });
        setLocationStatus("success");
        setMessage(res.data.message);
      } else {
        setLocationStatus("error");
        setMessage(res.data.message);
      }
    } catch {
      setLocationStatus("error");
      setMessage("Failed to detect location. Please try again.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location.latitude || !location.longitude) {
      setMessage("Please detect location before saving");
      setLocationStatus("error");
      return;
    }

    setSaving(true);

    try {
      await api.post("/owner/properties/", {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
        detected_address: location.detected_address,
      });

      alert("Property added successfully!");
      setFormData({
        title: "",
        address_line_1: "",
        address_line_2: "",
        area: "",
        city: "",
        landmark: "",
        postal_code: "",
        contact_number: "",
      });
      setLocation({ latitude: null, longitude: null, detected_address: "" });
      setLocationStatus(null);
      setMessage("");
    } catch {
      alert("Failed to save property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const lbl = (text) => (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f6a5f]">
      {text}
    </label>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        icon={MapPin}
        title="Add New Property"
        subtitle="Fill in the property details and detect the location."
      />

      <div className={cardCls("p-6")} style={cardStyle()}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            {lbl("Property Title *")}
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Comfortable Room Near University"
              className={inputCls}
            />
          </div>

          <div className="rounded-[18px] border border-[#eadfc7] bg-[#fffaf2] p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-[#2b2823]">
              <MapPin size={14} className="text-[#b98b1f]" />
              Property Address
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                {lbl("Address Line 1 *")}
                <input
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleChange}
                  required
                  placeholder="House/Building number and street"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                {lbl("Address Line 2")}
                <input
                  type="text"
                  name="address_line_2"
                  value={formData.address_line_2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  className={inputCls}
                />
              </div>

              <div>
                {lbl("Area / Village *")}
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Nugegoda"
                  className={inputCls}
                />
              </div>

              <div>
                {lbl("City *")}
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Colombo"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                {lbl("Nearby Landmark *")}
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Near Colombo University"
                  className={inputCls}
                />
                <p className="mt-1.5 text-[11px] text-[#8b8578]">
                  This helps us find your exact location
                </p>
              </div>

              <div>
                {lbl("Postal Code")}
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="e.g., 10250"
                  className={inputCls}
                />
              </div>

              <div>
                {lbl("Contact Number *")}
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 0771234567"
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleFindLocation}
              disabled={detecting}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#dcc89a] bg-white py-3 text-[13px] font-extrabold text-[#8a6a1f] transition hover:bg-[#fff8ee] disabled:opacity-50"
            >
              {detecting ? (
                <>
                  <Loader size={15} className="animate-spin" /> Detecting Location…
                </>
              ) : (
                <>
                  <MapPin size={15} /> Find Location
                </>
              )}
            </button>
          </div>

          {message && (
            <div
              className={`flex items-start gap-3 rounded-[14px] border p-4 ${
                locationStatus === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {locationStatus === "success" ? (
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
              )}

              <div>
                <p
                  className={`text-[13px] font-bold ${
                    locationStatus === "success" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {message}
                </p>
                {location.detected_address && (
                  <p className="mt-1 text-[11px] text-[#6f6a5f]">
                    Detected: {location.detected_address}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !location.latitude}
            className={`w-full ${btnGold}`}
            style={{
              background: "linear-gradient(135deg,#c9a84c,#a07830)",
              boxShadow: "0 6px 20px rgba(201,168,76,0.22)",
            }}
          >
            {saving ? "Saving…" : "Save Property"}
          </button>
        </form>
      </div>
    </div>
  );
}