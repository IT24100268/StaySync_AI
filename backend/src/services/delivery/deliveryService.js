const { StatusCodes } = require("http-status-codes");
const { DELIVERY_STATUSES, ORDER_STATUSES } = require("../../constants/appConstants");
const Delivery = require("../../models/Delivery");
const LiveLocation = require("../../models/LiveLocation");
const ApiError = require("../../utils/apiError");
const pick = require("../../utils/pick");
const { calculateDistanceKm } = require("../shared/locationService");
const { requireProfile } = require("../shared/profileService");

const MAX_DELIVERY_LOCATION_DISTANCE_KM = 200;

function getDeliveryBaseQuery(filter = {}) {
  return Delivery.findOne(filter)
    .populate({
      path: "order",
      populate: [
        { path: "restaurant", select: "name address city" },
        {
          path: "student",
          populate: { path: "user", select: "name email phone" },
        },
      ],
    })
    .populate({
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phone" },
    });
}

function serializeDelivery(delivery) {
  if (!delivery?.order) {
    return null;
  }

  return {
    id: delivery._id,
    orderId: delivery.order._id,
    status: delivery.status,
    orderStatus: delivery.order.status,
    restaurantName: delivery.order.restaurant?.name || "",
    pickupAddress: delivery.pickupAddress || delivery.order.restaurant?.address || "",
    customerName: delivery.order.student?.user?.name || "Student",
    customerPhone: delivery.order.student?.user?.phone || "",
    deliveryAddress: delivery.dropAddress || delivery.order.deliveryAddress || "",
    createdAt: delivery.createdAt,
    acceptedAt: delivery.acceptedAt,
    deliveredAt: delivery.deliveredAt,
  };
}

function listDeliveryQuery(filter = {}) {
  return Delivery.find(filter)
    .populate({
      path: "order",
      populate: [
        { path: "restaurant", select: "name address city" },
        {
          path: "student",
          populate: { path: "user", select: "name email phone" },
        },
      ],
    })
    .populate({
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phone" },
    });
}

async function getDeliveryProfile(user) {
  return requireProfile(user);
}

async function updateDeliveryProfile(user, payload) {
  const profile = await requireProfile(user);

  Object.assign(profile, pick(payload, ["vehicleType", "licenseNumber", "serviceAreas", "isAvailable"]));
  await profile.save();
  return profile.populate("user", "-password");
}

async function listAvailableDeliveries() {
  return listDeliveryQuery({
    status: DELIVERY_STATUSES.OPEN,
    deliveryPartner: null,
  }).sort({ createdAt: -1 });
}

async function acceptDelivery(user, deliveryId) {
  const profile = await requireProfile(user);
  const delivery = await Delivery.findOne({
    _id: deliveryId,
    status: DELIVERY_STATUSES.OPEN,
    deliveryPartner: null,
  });

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Delivery job is not available.");
  }

  delivery.deliveryPartner = profile._id;
  delivery.status = DELIVERY_STATUSES.ACCEPTED;
  delivery.acceptedAt = new Date();
  await delivery.save();

  return getDeliveryBaseQuery({ _id: delivery._id });
}

async function updateDeliveryStatus(user, deliveryId, status) {
  const profile = await requireProfile(user);
  const delivery = await getDeliveryBaseQuery({ _id: deliveryId, deliveryPartner: profile._id });

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Delivery record not found.");
  }

  delivery.status = status;

  if (status === DELIVERY_STATUSES.DELIVERED) {
    delivery.deliveredAt = new Date();
  }

  await delivery.save();

  if (delivery.order) {
    if (status === DELIVERY_STATUSES.PICKED_UP || status === DELIVERY_STATUSES.IN_TRANSIT) {
      delivery.order.status = ORDER_STATUSES.OUT_FOR_DELIVERY;
      delivery.order.acceptedAt = delivery.order.acceptedAt || delivery.acceptedAt || new Date();
    }

    if (status === DELIVERY_STATUSES.DELIVERED) {
      delivery.order.status = ORDER_STATUSES.DELIVERED;
      delivery.order.completedAt = new Date();
      delivery.order.failedAt = null;
      delivery.order.failureReason = "";
    }

    await delivery.order.save();
  }

  return delivery;
}

async function updateLiveLocation(user, deliveryId, payload) {
  const profile = await requireProfile(user);
  const delivery = await Delivery.findOne({ _id: deliveryId, deliveryPartner: profile._id }).populate({
    path: "order",
    populate: { path: "restaurant", select: "latitude longitude name address" },
  });

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Delivery record not found.");
  }

  const nextCoordinates = {
    latitude: Number(payload.coordinates?.latitude),
    longitude: Number(payload.coordinates?.longitude),
  };
  const pickupCoordinates = {
    latitude: Number(delivery.order?.restaurant?.latitude),
    longitude: Number(delivery.order?.restaurant?.longitude),
  };
  const dropCoordinates = {
    latitude: Number(delivery.order?.deliveryLocation?.latitude),
    longitude: Number(delivery.order?.deliveryLocation?.longitude),
  };
  const pickupDistanceKm = calculateDistanceKm(nextCoordinates, pickupCoordinates);
  const dropDistanceKm = calculateDistanceKm(nextCoordinates, dropCoordinates);
  const nearestRouteDistanceKm = Math.min(
    Number.isFinite(pickupDistanceKm) ? pickupDistanceKm : Number.POSITIVE_INFINITY,
    Number.isFinite(dropDistanceKm) ? dropDistanceKm : Number.POSITIVE_INFINITY
  );

  if (
    Number.isFinite(nearestRouteDistanceKm) &&
    nearestRouteDistanceKm > MAX_DELIVERY_LOCATION_DISTANCE_KM
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Shared live location appears too far from this delivery route. Please check device location settings and try again."
    );
  }

  return LiveLocation.create({
    delivery: delivery._id,
    ...payload,
  });
}

async function listAssignedDeliveries(user) {
  const profile = await requireProfile(user);

  return listDeliveryQuery({ deliveryPartner: profile._id }).sort({ createdAt: -1 });
}

module.exports = {
  getDeliveryProfile,
  updateDeliveryProfile,
  listAvailableDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  updateLiveLocation,
  listAssignedDeliveries,
};
