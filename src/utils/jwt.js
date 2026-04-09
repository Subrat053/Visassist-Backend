const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET || "access_secret_change_me";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh_secret_change_me";
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const signAccessToken = (payload) => {
	return jwt.sign(payload, accessSecret, {
		expiresIn: accessExpiresIn,
	});
};

const signRefreshToken = (payload) => {
	return jwt.sign(payload, refreshSecret, {
		expiresIn: refreshExpiresIn,
	});
};

const verifyAccessToken = (token) => {
	return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
	return jwt.verify(token, refreshSecret);
};

const getTokenPair = (payload) => {
	return {
		token: signAccessToken(payload),
		refreshToken: signRefreshToken(payload),
	};
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, getTokenPair };
