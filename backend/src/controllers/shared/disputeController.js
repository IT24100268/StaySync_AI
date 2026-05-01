const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const { createDispute } = require("../../services/shared/disputeService");

const createNewDispute = catchAsync(async (req, res) => {
  const dispute = await createDispute(req.user, req.body);
  return successResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Dispute created successfully.",
    data: dispute,
  });
});

module.exports = {
  createNewDispute,
};
