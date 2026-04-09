const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRouter = require("./routes/index.js");
const { errorHandler, notFoundHandler } = require("./middlewares/error.middleware.js");

const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";
const corsOrigins = corsOrigin
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const app = express();

app.set("trust proxy", 1);

app.use(
	cors({
		origin: corsOrigins,
		credentials: true,
	})
);
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(
	express.json({
		limit: "1mb",
		verify: (req, _res, buf) => {
			if (req.originalUrl.startsWith("/api/v1/payments/webhook")) {
				req.rawBody = buf;
			}
		},
	})
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
	res.status(200).json({ success: true, data: { status: "ok" } });
});

app.get("/", (_req, res) => {
    res.send("Y-Axis API is running.....");
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

