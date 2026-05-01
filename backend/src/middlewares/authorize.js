const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "You are not authorized to access this resource."));
    }

    return next();
  };
}

module.exports = authorize;
