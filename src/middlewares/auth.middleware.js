const User = require("../models/User.js");
const ApiError = require("../utils/ApiError.js");
const { verifyAccessToken } = require("../utils/jwt.js");

const getBearerToken = (req) => {
	const authHeader = req.headers.authorization || "";
	if (!authHeader.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.replace("Bearer ", "").trim();
};

const requireAuth = async (req, _res, next) => {
	try {
		const token = getBearerToken(req);
		if (!token) {
			throw new ApiError(401, "UNAUTHORIZED", "Missing bearer token");
		}

		const payload = verifyAccessToken(token);
		const user = await User.findById(payload.sub).select("-password");

		if (!user) {
			throw new ApiError(401, "UNAUTHORIZED", "Invalid token user");
		}

		req.user = user;
		next();
	} catch (error) {
		next(
			error instanceof ApiError
				? error
				: new ApiError(401, "UNAUTHORIZED", "Token is invalid or expired")
		);
	}
};

const optionalAuth = async (req, _res, next) => {
	try {
		const token = getBearerToken(req);
		if (!token) {
			return next();
		}

		const payload = verifyAccessToken(token);
		const user = await User.findById(payload.sub).select("-password");
		if (user) {
			req.user = user;
		}

		return next();
	} catch (_error) {
		return next();
	}
};

module.exports = { requireAuth, optionalAuth };
