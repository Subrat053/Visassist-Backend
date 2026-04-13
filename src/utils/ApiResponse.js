const sendSuccess = (res, statusCode, data = null, message = undefined) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

const sendError = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
};

module.exports = { sendSuccess, sendError };
