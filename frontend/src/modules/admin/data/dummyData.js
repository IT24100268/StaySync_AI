import { APPROVAL_TYPES } from "../utils/constants";

export const adminProfile = {
  id: "admin-1",
  name: "Platform Admin",
  email: "admin@staysync.ai",
  role: "admin",
  status: "Active",
};

export const users = [
  {
    id: "user-1",
    name: "Aarav Sharma",
    email: "student@staysync.ai",
    role: "student",
    status: "Active",
    isBlocked: false,
    createdAt: "2026-03-01",
  },
  {
    id: "user-2",
    name: "Riya Mehta",
    email: "owner@staysync.ai",
    role: "owner",
    status: "Verified",
    isBlocked: false,
    createdAt: "2026-02-19",
  },
  {
    id: "user-3",
    name: "Campus Spice Kitchen",
    email: "restaurant@staysync.ai",
    role: "restaurant",
    status: "Pending Approval",
    isBlocked: false,
    createdAt: "2026-03-06",
  },
  {
    id: "user-4",
    name: "Rahul Nair",
    email: "delivery@staysync.ai",
    role: "delivery",
    status: "Pending Approval",
    isBlocked: false,
    createdAt: "2026-03-10",
  },
  {
    id: "user-5",
    name: "Nila George",
    email: "nila@student.ai",
    role: "student",
    status: "Active",
    isBlocked: true,
    createdAt: "2026-03-12",
  },
];

export const roomApprovals = [
  {
    id: "room-approval-1",
    type: APPROVAL_TYPES.ROOM,
    ownerId: "owner-1",
    ownerName: "Riya Mehta",
    roomTitle: "Maple Heights Shared Room",
    location: "Scarborough",
    rent: 14500,
    status: "Pending",
    submittedAt: "2026-03-18",
    notes: "Waiting for facility verification and address review.",
  },
  {
    id: "room-approval-2",
    type: APPROVAL_TYPES.ROOM,
    ownerId: "owner-2",
    ownerName: "Harish Patel",
    roomTitle: "Downtown Studio Loft",
    location: "Downtown Toronto",
    rent: 22000,
    status: "Approved",
    submittedAt: "2026-03-10",
    notes: "Approved after pricing and safety review.",
  },
];

export const restaurantApprovals = [
  {
    id: "restaurant-approval-1",
    type: APPROVAL_TYPES.RESTAURANT,
    restaurantId: "restaurant-1",
    restaurantName: "Campus Spice Kitchen",
    ownerName: "restaurant@staysync.ai",
    address: "80 Bloor St W, Toronto",
    status: "Pending",
    submittedAt: "2026-03-17",
    notes: "Business identity and operations.",
    email: "restaurant@staysync.ai",
    phone: "+1 416-555-0300",
    cuisine: "Indian",
    openingHours: "undefined",
    deliveryAvailable: "No",
  },
  {
    id: "restaurant-approval-2",
    type: APPROVAL_TYPES.RESTAURANT,
    restaurantId: "rest-2",
    restaurantName: "Urban Salad Lab",
    ownerName: "Melissa Brown",
    address: "15 College St, Toronto",
    status: "Rejected",
    submittedAt: "2026-03-08",
    notes: "Rejected due to incomplete tax registration.",
  },
];

export const deliveryApprovals = [
  {
    id: "delivery-approval-1",
    type: APPROVAL_TYPES.DELIVERY,
    partnerId: "delivery-1",
    partnerName: "Rahul Nair",
    vehicleType: "Bike",
    phone: "+1 416-555-0400",
    status: "Pending",
    submittedAt: "2026-03-16",
    notes: "ID uploaded, waiting for license validation.",
  },
  {
    id: "delivery-approval-2",
    type: APPROVAL_TYPES.DELIVERY,
    partnerId: "delivery-2",
    partnerName: "Sana Ahmed",
    vehicleType: "Scooter",
    phone: "+1 416-555-0432",
    status: "Approved",
    submittedAt: "2026-03-09",
    notes: "Background check completed successfully.",
  },
];

export const reports = [
  {
    id: "report-1",
    type: "Complaint",
    title: "Repeated late delivery complaint",
    description: "Multiple students flagged one delivery route for repeated late handoff.",
    status: "Open",
    createdAt: "2026-03-20",
  },
  {
    id: "report-2",
    type: "Flagged Listing",
    title: "Room photos mismatch",
    description: "Student reported that listing photos do not match the actual room condition.",
    status: "In Review",
    createdAt: "2026-03-18",
  },
  {
    id: "report-3",
    type: "Suspicious Activity",
    title: "Rapid failed login attempts",
    description: "System detected repeated admin login attempts from a new device fingerprint.",
    status: "Resolved",
    createdAt: "2026-03-14",
  },
];

export const adminActionLogs = [
  {
    id: "log-1",
    type: "Admin Action",
    title: "Restaurant approval reviewed",
    description: "Restaurant approval request for Urban Salad Lab was rejected after document review.",
    status: "Resolved",
    createdAt: "2026-03-20",
  },
  {
    id: "log-2",
    type: "Admin Action",
    title: "Student account blocked",
    description: "Blocked Nila George after repeated abusive support messages.",
    status: "Resolved",
    createdAt: "2026-03-19",
  },
];

export const orderMonitor = [
  {
    id: "monitor-1",
    orderId: "order-1001",
    customerName: "Aarav Sharma",
    restaurantName: "Campus Spice Kitchen",
    deliveryPartnerName: "Rahul Nair",
    status: "Ongoing",
    disputeStatus: "None",
    createdAt: "2026-03-21 12:35",
  },
  {
    id: "monitor-2",
    orderId: "order-1002",
    customerName: "Nila George",
    restaurantName: "Urban Salad Lab",
    deliveryPartnerName: "Sana Ahmed",
    status: "Failed",
    disputeStatus: "Open",
    createdAt: "2026-03-21 11:10",
  },
  {
    id: "monitor-3",
    orderId: "order-1003",
    customerName: "Priya Menon",
    restaurantName: "Campus Bites",
    deliveryPartnerName: "Aman Verma",
    status: "Ongoing",
    disputeStatus: "Under Review",
    createdAt: "2026-03-21 10:15",
  },
];
