const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/apiError");
const { ROLES } = require("../../constants/appConstants");
const StudentProfile = require("../../models/StudentProfile");
const OwnerProfile = require("../../models/OwnerProfile");
const RestaurantProfile = require("../../models/RestaurantProfile");
const DeliveryPartnerProfile = require("../../models/DeliveryPartnerProfile");
const Restaurant = require("../../models/Restaurant");

function getProfileModel(role) {
  switch (role) {
    case ROLES.STUDENT:
      return StudentProfile;
    case ROLES.OWNER:
      return OwnerProfile;
    case ROLES.RESTAURANT:
      return RestaurantProfile;
    case ROLES.DELIVERY:
      return DeliveryPartnerProfile;
    default:
      return null;
  }
}

async function getProfileByUser(user) {
  const ProfileModel = getProfileModel(user.role);

  if (!ProfileModel) {
    return null;
  }

  return ProfileModel.findOne({ user: user._id }).populate("user", "-password");
}

async function requireProfile(user) {
  const profile = await getProfileByUser(user);

  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, `${user.role} profile was not found.`);
  }

  return profile;
}

async function createRoleProfile(user, payload = {}) {
  switch (user.role) {
    case ROLES.STUDENT:
      return StudentProfile.create({
        user: user._id,
        fullName: payload.fullName || user.name,
        institutionName: payload.institutionName,
        course: payload.course,
        yearOfStudy: payload.yearOfStudy,
      });
    case ROLES.OWNER:
      return OwnerProfile.create({
        user: user._id,
        businessName: payload.businessName || user.name,
        hostelName: payload.hostelName,
        address: payload.address,
        city: payload.city,
      });
    case ROLES.RESTAURANT: {
      const profile = await RestaurantProfile.create({
        user: user._id,
        restaurantName: payload.restaurantName || user.name,
        cuisineTypes: payload.cuisineTypes || [],
        address: payload.address,
        city: payload.city,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });

      await Restaurant.create({
        profile: profile._id,
        name: profile.restaurantName || user.name,
        address: payload.address,
        city: payload.city,
        cuisines: payload.cuisineTypes || [],
        latitude: payload.latitude,
        longitude: payload.longitude,
      });

      return profile;
    }
    case ROLES.DELIVERY:
      return DeliveryPartnerProfile.create({
        user: user._id,
        vehicleType: payload.vehicleType,
        licenseNumber: payload.licenseNumber,
        serviceAreas: payload.serviceAreas || [],
      });
    default:
      return null;
  }
}

module.exports = {
  getProfileModel,
  getProfileByUser,
  requireProfile,
  createRoleProfile,
};
