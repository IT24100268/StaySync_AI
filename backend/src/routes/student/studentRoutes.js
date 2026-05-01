const express = require("express");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../constants/appConstants");
const {
  getProfile,
  updateProfile,
  getFavourites,
  addFavourite,
  removeFavourite,
} = require("../../controllers/student/studentController");
const {
  updateProfileValidator,
  favouriteRoomValidator,
  removeFavouriteValidator,
} = require("../../validators/studentValidators");

const router = express.Router();

router.use(auth, authorize(ROLES.STUDENT));

router.get("/me", getProfile);
router.patch("/me", validateRequest(updateProfileValidator), updateProfile);
router.get("/favourites", getFavourites);
router.post("/favourites", validateRequest(favouriteRoomValidator), addFavourite);
router.delete("/favourites/:roomId", validateRequest(removeFavouriteValidator), removeFavourite);

module.exports = router;
