function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function calculateDistanceKm(start, end) {
  const latitude1 = Number(start?.latitude);
  const longitude1 = Number(start?.longitude);
  const latitude2 = Number(end?.latitude);
  const longitude2 = Number(end?.longitude);

  if (
    !Number.isFinite(latitude1) ||
    !Number.isFinite(longitude1) ||
    !Number.isFinite(latitude2) ||
    !Number.isFinite(longitude2)
  ) {
    return 0;
  }

  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

module.exports = {
  calculateDistanceKm,
};
