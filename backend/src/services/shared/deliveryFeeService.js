const DELIVERY_FEE_DEFAULTS = {
  baseFee: 100,
  perKmRate: 35,
  peakFee: 40,
  longDistanceFee: 60,
  longDistanceThresholdKm: 5,
  peakStartHour: 18,
  peakEndHour: 21,
};

function roundCurrency(value) {
  return Math.round(Number(value || 0));
}

function normalizeDistance(distanceKm) {
  const parsedDistance = Number(distanceKm);

  if (!Number.isFinite(parsedDistance) || parsedDistance < 0) {
    return 0;
  }

  return Math.round(parsedDistance * 10) / 10;
}

function isPeakTime(date = new Date()) {
  const hour = date.getHours();
  return (
    hour >= DELIVERY_FEE_DEFAULTS.peakStartHour &&
    hour < DELIVERY_FEE_DEFAULTS.peakEndHour
  );
}

function calculateDeliveryFee(distanceKm, currentTime = new Date()) {
  const normalizedDistanceKm = normalizeDistance(distanceKm);
  const peakHour = isPeakTime(currentTime);
  const longDistance =
    normalizedDistanceKm > DELIVERY_FEE_DEFAULTS.longDistanceThresholdKm;
  const distanceFee = roundCurrency(
    normalizedDistanceKm * DELIVERY_FEE_DEFAULTS.perKmRate
  );
  const appliedPeakFee = peakHour ? DELIVERY_FEE_DEFAULTS.peakFee : 0;
  const appliedLongDistanceFee = longDistance
    ? DELIVERY_FEE_DEFAULTS.longDistanceFee
    : 0;
  const totalFee = roundCurrency(
    DELIVERY_FEE_DEFAULTS.baseFee +
      distanceFee +
      appliedPeakFee +
      appliedLongDistanceFee
  );

  return {
    distanceKm: normalizedDistanceKm,
    baseFee: DELIVERY_FEE_DEFAULTS.baseFee,
    perKmRate: DELIVERY_FEE_DEFAULTS.perKmRate,
    distanceFee,
    peakFee: appliedPeakFee,
    longDistanceFee: appliedLongDistanceFee,
    isPeakHour: peakHour,
    isLongDistance: longDistance,
    totalFee,
    calculatedAt: currentTime,
  };
}

module.exports = {
  DELIVERY_FEE_DEFAULTS,
  calculateDeliveryFee,
};
