export const REPORT_TYPES = [
  "Room Issue",
  "Fake Listing",
  "Price Issue",
  "Food / Delivery Issue",
  "Other",
];

export const ROOM_REPORT_TYPES = ["Room Issue", "Fake Listing", "Price Issue", "Other"];

export const FOOD_REPORT_TYPES = ["Food / Delivery Issue"];

export const OTHER_REPORT_TYPES = ["Other"];

export const REPORT_STATUSES = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

export function getReportStatusLabel(status) {
  return REPORT_STATUSES[status] || "Open";
}

export function getReportStatusTone(status) {
  switch (status) {
    case "resolved":
      return "success";
    case "in_review":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
}
