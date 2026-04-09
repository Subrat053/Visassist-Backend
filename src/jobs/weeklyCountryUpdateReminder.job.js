const CommunicationTemplate = require("../models/CommunicationTemplate.js");

const runWeeklyCountryUpdateReminder = async () => {
  const template = await CommunicationTemplate.findOne({
    key: "weekly-country-process-update",
    isActive: true,
  }).lean();

  return {
    job: "weekly-country-process-update",
    status: "placeholder",
    note: "Integrate this job with cron/queue and your notification channel.",
    templateFound: Boolean(template),
  };
};

module.exports = {
  runWeeklyCountryUpdateReminder,
};
