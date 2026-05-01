const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/apiError");

function validateRequest(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const result = validationResult(req);

    if (result.isEmpty()) {
      return next();
    }

    return next(new ApiError(StatusCodes.BAD_REQUEST, "Validation failed.", result.array()));
  };
}

module.exports = validateRequest;
