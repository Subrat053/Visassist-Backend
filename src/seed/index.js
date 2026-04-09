require("dotenv").config();

const connectDB = require("../config/db.js");
const Country = require("../models/Country.js");
const Visa = require("../models/Visa.js");
const { countriesSeed } = require("./countries.js");
const { visasSeed } = require("./visas.js");

const runSeed = async () => {
  await connectDB();

  await Country.deleteMany({});
  await Visa.deleteMany({});

  const countries = await Country.insertMany(countriesSeed);
  const countryMap = new Map(countries.map((item) => [item.code, item._id]));

  const visas = visasSeed.map((item) => ({
    country: countryMap.get(item.countryCode),
    name: item.name,
    visaType: item.visaType,
    processingTimeDays: item.processingTimeDays,
    fee: item.fee,
    currency: item.currency,
    requirements: item.requirements,
    isActive: item.isActive,
  }));

  await Visa.insertMany(visas);

  console.log("Seed completed: countries and visas inserted.");
  process.exit(0);
};

runSeed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
