const visasSeed = [
  {
    countryCode: "CA",
    name: "Express Entry",
    visaType: "permanent",
    processingTimeDays: 180,
    fee: 1325,
    currency: "USD",
    requirements: ["Language test", "ECA report", "Proof of funds"],
    isActive: true,
  },
  {
    countryCode: "AU",
    name: "Skilled Independent Visa (Subclass 189)",
    visaType: "work",
    processingTimeDays: 240,
    fee: 3100,
    currency: "USD",
    requirements: ["Skills assessment", "English proficiency", "Points test"],
    isActive: true,
  },
  {
    countryCode: "GB",
    name: "Skilled Worker Visa",
    visaType: "work",
    processingTimeDays: 90,
    fee: 900,
    currency: "USD",
    requirements: ["Job offer", "Sponsorship certificate", "English proficiency"],
    isActive: true,
  },
];

module.exports = { visasSeed };
