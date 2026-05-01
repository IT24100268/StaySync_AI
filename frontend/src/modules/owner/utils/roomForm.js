export function createEmptyRoomForm(ownerId = "owner-1") {
  return {
    id: "",
    ownerId,
    title: "",
    description: "",
    rent: "",
    deposit: "",
    roomType: "",
    facilities: [],
    genderAllowed: "",
    maxCapacity: "",
    rules: "",
    address: "",
    images: [],
    status: "available",
    viewsCount: 0,
    enquiriesCount: 0,
  };
}
