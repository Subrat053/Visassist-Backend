const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken.js");
const { getTokenPair, verifyRefreshToken } = require("../utils/jwt.js");

const hashToken = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const refreshExpiryMs = () => {
  const value = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  if (value.endsWith("d")) {
    return Number(value.replace("d", "")) * 24 * 60 * 60 * 1000;
  }
  if (value.endsWith("h")) {
    return Number(value.replace("h", "")) * 60 * 60 * 1000;
  }
  return 7 * 24 * 60 * 60 * 1000;
};

const issueAuthTokens = async (user, context = {}) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const { token, refreshToken } = getTokenPair(payload);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshExpiryMs()),
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return { token, refreshToken };
};

const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

const rotateRefreshToken = async (refreshToken, context = {}) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const tokenDoc = await RefreshToken.findOne({
    tokenHash,
    user: payload.sub,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).populate("user");

  if (!tokenDoc || !tokenDoc.user) {
    return null;
  }

  if (tokenDoc.user.isDeleted || tokenDoc.user.isActive === false) {
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    return null;
  }

  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const freshTokens = await issueAuthTokens(tokenDoc.user, context);

  return {
    user: tokenDoc.user,
    ...freshTokens,
  };
};

module.exports = { hashToken, issueAuthTokens, revokeRefreshToken, rotateRefreshToken };
