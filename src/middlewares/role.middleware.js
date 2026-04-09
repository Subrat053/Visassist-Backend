const ApiError = require("../utils/ApiError.js");

const requireRoles = (...roles) => {
	return (req, _res, next) => {
		if (!req.user) {
			return next(new ApiError(401, "UNAUTHORIZED", "Authentication required"));
		}

		if (!roles.includes(req.user.role)) {
			return next(new ApiError(403, "FORBIDDEN", "Insufficient permissions"));
		}

		return next();
	};
};

module.exports = { requireRoles };
