const FALLBACK_ROOM_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

function splitRules(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveCity(address = "") {
  const parts = String(address)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts[parts.length - 1] || address || "Unknown";
}

export function normalizeRoom(room) {
  const ownerName = room.owner?.user?.name || room.ownerName || "Room Owner";
  const ownerPhone = room.owner?.user?.phone || room.ownerPhone || room.ownerContact || "";
  const ownerEmail = room.owner?.user?.email || room.ownerEmail || "";

  return {
    id: room.id || room._id,
    ownerId: room.owner?.user?._id || room.owner?._id || "",
    ownerName,
    ownerPhone,
    ownerEmail,
    title: room.title || "Room Listing",
    description: room.description || "",
    rent: Number(room.rent ?? room.price?.monthlyRent ?? 0),
    price: Number(room.price?.monthlyRent ?? room.rent ?? 0),
    deposit: Number(room.deposit ?? room.price?.securityDeposit ?? 0),
    roomType: room.roomType || "Shared",
    facilities: Array.isArray(room.facilities)
      ? room.facilities
      : Array.isArray(room.amenities)
        ? room.amenities
        : [],
    genderAllowed: room.genderAllowed || "Any",
    maxCapacity: Number(room.maxCapacity ?? room.capacity ?? 1),
    rules: Array.isArray(room.rules) ? room.rules : splitRules(room.rules),
    rulesText: Array.isArray(room.rules) ? room.rules.join(", ") : room.rules || "",
    address: room.address || room.location?.address || "",
    location: room.locationLabel || room.location?.address || room.address || "",
    city: room.city || deriveCity(room.location?.address || room.address || ""),
    lat: String(room.lat ?? room.location?.coordinates?.latitude ?? ""),
    lng: String(room.lng ?? room.location?.coordinates?.longitude ?? ""),
    images:
      Array.isArray(room.images) && room.images.length > 0
        ? room.images
        : [FALLBACK_ROOM_IMAGE],
    status: room.status || (room.isAvailable === false ? "unavailable" : "available"),
    isAvailable: room.isAvailable !== false,
    approvalStatus: room.approvalStatus || "approved",
    viewsCount: Number(room.viewsCount || 0),
    enquiriesCount: Number(room.enquiriesCount || 0),
    distance: Number(room.distance || 0),
    ownerContact:
      room.ownerContact ||
      [ownerName, ownerPhone, ownerEmail].filter(Boolean).join("\n") ||
      "",
    createdAt: room.createdAt || "",
    updatedAt: room.updatedAt || "",
  };
}

export function buildRoomPayload(form) {
  return {
    title: form.title,
    description: form.description,
    city: form.city || deriveCity(form.address),
    location: {
      address: form.address,
    },
    price: {
      monthlyRent: Number(form.rent),
      securityDeposit: Number(form.deposit || 0),
    },
    roomType: form.roomType,
    amenities: Array.isArray(form.facilities) ? form.facilities : [],
    capacity: Number(form.maxCapacity || 1),
    genderAllowed: form.genderAllowed || "Any",
    rules: splitRules(form.rules),
    images: Array.isArray(form.images) ? form.images : [],
    isAvailable: form.status !== "unavailable",
  };
}
