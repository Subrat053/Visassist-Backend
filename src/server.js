require("dotenv").config();

const app = require("./app.js");
const connectDB = require("./config/db.js");

const bootstrap = async () => {
  const port = Number(process.env.PORT) || 5000;
  await connectDB();

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
