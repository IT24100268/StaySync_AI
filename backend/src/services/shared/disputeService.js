const { StatusCodes } = require("http-status-codes");
const { DISPUTE_STATUSES, ORDER_STATUSES } = require("../../constants/appConstants");
const Delivery = require("../../models/Delivery");
const Dispute = require("../../models/Dispute");
const Order = require("../../models/Order");
const ApiError = require("../../utils/apiError");
const { requireProfile } = require("./profileService");

async function createDispute(user, payload) {
  const studentProfile = await requireProfile(user);
  const order = await Order.findOne({
    _id: payload.orderId,
    student: studentProfile._id,
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not found.");
  }

  const delivery = await Delivery.findOne({ order: order._id });
  const dispute = await Dispute.create({
    order: order._id,
    student: studentProfile._id,
    restaurant: order.restaurant,
    deliveryPartner: delivery?.deliveryPartner || null,
    issueType: String(payload.issueType || "general").trim() || "general",
    description: payload.description,
    status: DISPUTE_STATUSES.OPEN,
  });

  order.disputeStatus = DISPUTE_STATUSES.OPEN;

  if (payload.markOrderFailed) {
    order.status = ORDER_STATUSES.CANCELLED;
    order.failedAt = new Date();
    order.failureReason = "Dispute raised by student.";
  }

  await order.save();

  return dispute.populate([
    {
      path: "student",
      populate: { path: "user", select: "name email phone" },
    },
    { path: "restaurant", select: "name address city" },
    {
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phone" },
    },
  ]);
}

module.exports = {
  createDispute,
};
