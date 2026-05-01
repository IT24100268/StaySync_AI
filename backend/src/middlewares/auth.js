const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication token is required."));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid authentication token."));
    }

    if (user.status === "blocked") {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Your account has been blocked."));
    }

    req.user = user;
    req.auth = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication failed."));
  }
}

module.exports = authMiddleware;
