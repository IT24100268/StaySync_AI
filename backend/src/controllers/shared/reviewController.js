const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const { createReview } = require("../../services/shared/reviewService");

const submitReview = catchAsync(async (req, res) => {
  const result = await createReview(req.user, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Review submitted successfully.",
    data: result,
  });
});

module.exports = {
  submitReview,
};
