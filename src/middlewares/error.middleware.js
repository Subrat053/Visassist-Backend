const ApiError = require("../utils/ApiError.js");

const notFoundHandler = (req, _res, next) => {
	next(new ApiError(404, "NOT_FOUND", `Route ${req.originalUrl} not found`));
};

const errorHandler = (error, _req, res, _next) => {
	const statusCode = error.statusCode || 500;
	const code = error.code || "INTERNAL_SERVER_ERROR";
	const message = error.message || "Unexpected error";

	return res.status(statusCode).json({
		success: false,
		error: {
			code,
			message,
			...(error.details ? { details: error.details } : {}),
		},
	});
};

module.exports = { notFoundHandler, errorHandler };
