const { StatusCodes } = require("http-status-codes");

function notFoundHandler(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const response = {
    success: false,
    message: error.message || "Internal server error",
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
