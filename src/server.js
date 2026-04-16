require("dotenv").config();

const app = require("./app.js");
const connectDB = require("./config/db.js");
const { getMailRuntimeConfig, verifyTransporter } = require("./services/email");

const bootstrap = async () => {
  const port = Number(process.env.PORT) || 5000;
  await connectDB();

  const mailConfig = getMailRuntimeConfig();
  if (mailConfig.mailEnabled && !mailConfig.mailLogOnly && process.env.NODE_ENV !== "production") {
    try {
      await verifyTransporter();
    } catch (error) {
      console.error("[SMTP] Transport verification failed", {
        error: error.message,
      });
    }
  }

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
