import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AtSign,
  BadgeCheck,
  Bell,
  Building2,
  KeyRound,
  LogOut,
  MapPin,
  Phone,
  Save,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Profile.css";

const ROLE_LABELS = {
  student: "Student",
  hostel_owner: "Hostel Owner",
  restaurant_owner: "Restaurant Owner",
  delivery: "Delivery Partner",
};

const PROFILE_FIELD_CONFIG = {
  student: [
    { name: "phone_number", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+94 77 123 4567" },
    { name: "university", label: "University", type: "text", icon: Building2, placeholder: "University" },
    {
      name: "gender_preference",
      label: "Preferred Room Gender",
      type: "select",
      icon: UserRound,
      options: [
        { value: "any", label: "Any" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
    },
    { name: "budget", label: "Monthly Budget (LKR)", type: "number", icon: Wallet, placeholder: "25000" },
  ],
  hostel_owner: [
    { name: "phone_number", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+94 77 123 4567" },
    { name: "hostel_name", label: "Hostel Name", type: "text", icon: Building2, placeholder: "Hostel name" },
    { name: "business_reg_no", label: "Business Registration Number", type: "text", icon: BadgeCheck, placeholder: "BR-001" },
    { name: "address", label: "Address", type: "textarea", icon: MapPin, placeholder: "Address" },
    { name: "latitude", label: "Latitude", type: "number", icon: MapPin, placeholder: "9.6615", step: "any" },
    { name: "longitude", label: "Longitude", type: "number", icon: MapPin, placeholder: "80.0255", step: "any" },
  ],
  restaurant_owner: [
    { name: "phone_number", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+94 77 123 4567" },
    { name: "restaurant_name", label: "Restaurant Name", type: "text", icon: Building2, placeholder: "Restaurant name" },
    { name: "address", label: "Address", type: "textarea", icon: MapPin, placeholder: "Address" },
    { name: "latitude", label: "Latitude", type: "number", icon: MapPin, placeholder: "9.6615", step: "any" },
    { name: "longitude", label: "Longitude", type: "number", icon: MapPin, placeholder: "80.0255", step: "any" },
  ],
  delivery: [
    { name: "phone_number", label: "Phone Number", type: "tel", icon: Phone, placeholder: "+94 77 123 4567" },
    { name: "vehicle_type", label: "Vehicle Type", type: "text", icon: Building2, placeholder: "Bike" },
    { name: "license_no", label: "License Number", type: "text", icon: BadgeCheck, placeholder: "ABC-1234" },
  ],
};

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  university: "",
  gender_preference: "any",
  budget: "",
  hostel_name: "",
  business_reg_no: "",
  restaurant_name: "",
  address: "",
  latitude: "",
  longitude: "",
  vehicle_type: "",
  license_no: "",
};

const getFullName = (user) => {
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  return fullName || user?.username || "User";
};

const getInitials = (value) => {
  const parts = String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
};

const toFieldString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const buildFormState = (user) => {
  if (!user) return { ...emptyForm };
  const profile = user.profile || {};

  return {
    ...emptyForm,
    username: toFieldString(user.username),
    email: toFieldString(user.email),
    first_name: toFieldString(user.first_name),
    last_name: toFieldString(user.last_name),
    phone_number: toFieldString(profile.phone_number),
    university: toFieldString(profile.university),
    gender_preference: toFieldString(profile.gender_preference || "any"),
    budget: profile.budget === null || profile.budget === undefined || profile.budget === "" ? "" : String(Number(profile.budget)),
    hostel_name: toFieldString(profile.hostel_name),
    business_reg_no: toFieldString(profile.business_reg_no),
    restaurant_name: toFieldString(profile.restaurant_name),
    address: toFieldString(profile.address),
    latitude: toFieldString(profile.latitude),
    longitude: toFieldString(profile.longitude),
    vehicle_type: toFieldString(profile.vehicle_type),
    license_no: toFieldString(profile.license_no),
  };
};

const notificationLabel = (permission) => {
  if (permission === "granted") return "Enabled";
  if (permission === "denied") return "Blocked";
  if (permission === "default") return "Not enabled";
  return "Unsupported";
};

const parseNumericOrNull = (value, label) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return numeric;
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState(() => buildFormState(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [avatarCacheKey, setAvatarCacheKey] = useState(() => Date.now());
  const [saveState, setSaveState] = useState({ type: "", message: "" });
  const [browserPermission, setBrowserPermission] = useState("unsupported");
  const fileInputRef = useRef(null);

  const userType = user?.user_type || "student";
  const profileFields = PROFILE_FIELD_CONFIG[userType] || PROFILE_FIELD_CONFIG.student;

  useEffect(() => {
    setForm(buildFormState(user));
    setIsEditing(false);
  }, [user]);

  useEffect(() => {
    setAvatarCacheKey(Date.now());
  }, [user?.profile?.display_image]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(window.Notification.permission);
      return;
    }
    setBrowserPermission("unsupported");
  }, []);

  useEffect(() => {
    if (!isImagePreviewOpen) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsImagePreviewOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isImagePreviewOpen]);

  const profileCompletion = useMemo(() => {
    const requiredKeys = Array.from(new Set(["username", "email", "phone_number", ...profileFields.map((field) => field.name)]));
    const completeCount = requiredKeys.filter((key) => String(form[key] ?? "").trim() !== "").length;
    return requiredKeys.length ? Math.round((completeCount / requiredKeys.length) * 100) : 0;
  }, [form, profileFields]);

  const userDisplayName = getFullName(user);
  const roleLabel = ROLE_LABELS[userType] || "User";
  const approvalLabel = user?.is_approved ? "Approved" : "Pending Approval";

  const formMessageClass = saveState.type === "success" ? "profile-feedback is-success" : "profile-feedback is-error";

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone_number' && !/^[0-9]*$/.test(value)) return
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isEditing) return;
    setSaveState({ type: "", message: "" });

    try {
      const phoneField = form.phone_number
      if (phoneField && !/^0[0-9]{9}$/.test(phoneField)) {
        setSaveState({ type: 'error', message: 'Enter a valid Sri Lankan phone number (e.g. 0771234567)' })
        return
      }
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setSaveState({ type: 'error', message: 'Enter a valid email address (e.g. name@example.com)' })
        return
      }
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        profile: {},
      };

      profileFields.forEach((field) => {
        if (field.name === "budget") {
          payload.profile.budget = parseNumericOrNull(form.budget, "Budget");
          return;
        }

        if (field.name === "latitude") {
          payload.profile.latitude = parseNumericOrNull(form.latitude, "Latitude");
          return;
        }

        if (field.name === "longitude") {
          payload.profile.longitude = parseNumericOrNull(form.longitude, "Longitude");
          return;
        }

        payload.profile[field.name] = typeof form[field.name] === "string" ? form[field.name].trim() : form[field.name];
      });

      setIsSaving(true);
      const { data } = await api.patch("/auth/profile/", payload);
      updateUser(data);
      setIsEditing(false);
      setSaveState({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      console.error("Failed to update profile:", error);
      const detail = error?.response?.data?.detail || error?.message || "Unable to update profile right now.";
      setSaveState({ type: "error", message: detail });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const permission = await window.Notification.requestPermission();
    setBrowserPermission(permission);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEdit = () => {
    setSaveState({ type: "", message: "" });
    setIsEditing(true);
  };

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleOpenImagePreview = () => {
    if (!profileImageUrl) {
      return;
    }
    setIsImagePreviewOpen(true);
  };

  const handleCloseImagePreview = () => {
    setIsImagePreviewOpen(false);
  };

  const handleAvatarChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type?.startsWith("image/")) {
      setSaveState({ type: "error", message: "Please select a valid image file." });
      return;
    }

    try {
      setSaveState({ type: "", message: "" });
      setIsImageUploading(true);

      const payload = new FormData();
      payload.append("profile.display_image", selectedFile);

      const { data } = await api.patch("/auth/profile/", payload);
      updateUser(data);
      setAvatarCacheKey(Date.now());
      setSaveState({ type: "success", message: "Profile image updated successfully." });
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      const detail = error?.response?.data?.detail || error?.message || "Unable to upload profile image right now.";
      setSaveState({ type: "error", message: detail });
    } finally {
      setIsImageUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-page__shell">
          <div className="profile-loading-card">Loading your profile...</div>
        </div>
      </div>
    );
  }

  const profileImage = user?.profile?.display_image || "";
  const profileImageUrl = profileImage
    ? `${profileImage}${profileImage.includes("?") ? "&" : "?"}v=${avatarCacheKey}`
    : "";

  return (
    <div className="profile-page">
      <div className="profile-page__shell">
        <header className="profile-header">
          <h1>
            <UserRound size={30} /> Profile
          </h1>
          <p>Update your account details, contact info, and preferences in one place.</p>
        </header>

        <main className="profile-main">
            <section className="profile-card profile-summary">
              <div className="profile-summary__identity">
                <div className="profile-avatar-wrap">
                  <button
                    type="button"
                    className={`profile-avatar ${profileImageUrl ? "is-clickable" : ""}`}
                    onClick={handleOpenImagePreview}
                    disabled={!profileImageUrl}
                    aria-label={profileImageUrl ? "View full profile image" : "No profile image"}
                  >
                    {profileImageUrl ? <img src={profileImageUrl} alt={userDisplayName} /> : <span>{getInitials(userDisplayName)}</span>}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="profile-avatar-input"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    className="profile-avatar-change"
                    onClick={handleChooseAvatar}
                    disabled={isImageUploading}
                  >
                    <Upload size={14} />
                    {isImageUploading ? "Uploading..." : "Change Photo"}
                  </button>
                </div>

                <div>
                  <h2>{userDisplayName}</h2>
                  <p>@{user.username}</p>
                  <div className="profile-summary__meta">
                    <span>
                      <AtSign size={14} /> {user.email || "No email"}
                    </span>
                    {form.phone_number ? (
                      <span>
                        <Phone size={14} /> {form.phone_number}
                      </span>
                    ) : null}
                    {form.university ? (
                      <span>
                        <Building2 size={14} /> {form.university}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="profile-summary__status">
                <div className="profile-kpi">
                  <small>Account Role</small>
                  <strong>{roleLabel}</strong>
                </div>
                <div className="profile-kpi">
                  <small>Status</small>
                  <strong>{approvalLabel}</strong>
                </div>
                <div className="profile-kpi">
                  <small>Profile Complete</small>
                  <strong>{profileCompletion}%</strong>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card__head">
                <h3>Profile Details</h3>
                <span>{profileCompletion}% complete</span>
              </div>

              {saveState.message ? <div className={formMessageClass}>{saveState.message}</div> : null}

              <form className="profile-form" onSubmit={handleSave}>
                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>First Name</span>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      disabled={!isEditing || isSaving}
                    />
                  </label>

                  <label className="profile-field">
                    <span>Last Name</span>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      disabled={!isEditing || isSaving}
                    />
                  </label>

                  <label className="profile-field">
                    <span>Username</span>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Username"
                      required
                      disabled={!isEditing || isSaving}
                    />
                  </label>

                  <label className="profile-field">
                    <span>Email</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      required
                      disabled={!isEditing || isSaving}
                    />
                  </label>

                  {profileFields.map((field) => (
                    <label key={field.name} className={`profile-field ${field.type === "textarea" ? "is-wide" : ""}`}>
                      <span>{field.label}</span>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          disabled={!isEditing || isSaving}
                        >
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          rows={4}
                          disabled={!isEditing || isSaving}
                        />
                      ) : null}

                      {field.type !== "select" && field.type !== "textarea" ? (
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          step={field.step}
                          disabled={!isEditing || isSaving}
                        />
                      ) : null}
                    </label>
                  ))}
                </div>

                <div className="profile-actions">
                  <button type="button" className="profile-btn profile-btn--ghost" onClick={handleEdit} disabled={isSaving || isEditing}>
                    Edit Profile
                  </button>
                  <button type="submit" className="profile-btn profile-btn--ghost" disabled={!isEditing || isSaving}>
                    <Save size={15} />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            <section className="profile-split">
              <article className="profile-card profile-mini-card">
                <div className="profile-card__head">
                  <h3>Security</h3>
                </div>
                <p>Use OTP based password reset to keep your account protected.</p>
                <div className="profile-mini-actions">
                  <Link className="profile-btn profile-btn--ghost" to="/forgot-password">
                    <KeyRound size={15} />
                    Change Password
                  </Link>
                  <button type="button" className="profile-btn profile-btn--danger" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </article>

              <article className="profile-card profile-mini-card">
                <div className="profile-card__head">
                  <h3>Notification Preferences</h3>
                </div>
                <p>
                  Browser Alerts: <strong>{notificationLabel(browserPermission)}</strong>
                </p>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  onClick={handleRequestPermission}
                  disabled={browserPermission === "granted" || browserPermission === "unsupported"}
                >
                  <Bell size={15} />
                  {browserPermission === "granted" ? "Notifications Enabled" : "Enable Notifications"}
                </button>
              </article>
            </section>
          </main>

        {isImagePreviewOpen && profileImageUrl ? (
          <div className="profile-image-modal" onClick={handleCloseImagePreview} role="dialog" aria-modal="true">
            <div className="profile-image-modal__content" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="profile-image-modal__close" onClick={handleCloseImagePreview}>
                Close
              </button>
              <img src={profileImageUrl} alt={`${userDisplayName} full profile`} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;
