const express = require("express");
const authRoutes = require("./auth/authRoutes");
const studentRoutes = require("./student/studentRoutes");
const ownerRoutes = require("./owner/ownerRoutes");
const restaurantRoutes = require("./restaurant/restaurantRoutes");
const deliveryRoutes = require("./delivery/deliveryRoutes");
const adminRoutes = require("./admin/adminRoutes");
const roomRoutes = require("./shared/roomRoutes");
const orderRoutes = require("./shared/orderRoutes");
const bookingRoutes = require("./shared/bookingRoutes");
const reviewRoutes = require("./shared/reviewRoutes");
const reportRoutes = require("./shared/reportRoutes");
const disputeRoutes = require("./shared/disputeRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/owners", ownerRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/admin", adminRoutes);
router.use("/rooms", roomRoutes);
router.use("/orders", orderRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/reports", reportRoutes);
router.use("/disputes", disputeRoutes);

module.exports = router;
