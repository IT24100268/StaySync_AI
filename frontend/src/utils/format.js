export function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

export function formatDistance(distance) {
  return `${distance} km away`;
}
