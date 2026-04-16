const {
  parseBoolean,
  parseRecipientList,
  getMailRuntimeConfig,
  getTransporter,
  verifyTransporter,
  sendMail,
} = require("./transporter.js");
const {
  FIELD_LABELS,
  FORM_LABELS,
  FORM_FIELD_PRIORITY,
  normalizeFormFields,
  extractPrimaryIdentity,
  sendAdminFormNotification,
} = require("./formNotification.service.js");

module.exports = {
  parseBoolean,
  parseRecipientList,
  getMailRuntimeConfig,
  getTransporter,
  verifyTransporter,
  sendMail,
  FIELD_LABELS,
  FORM_LABELS,
  FORM_FIELD_PRIORITY,
  normalizeFormFields,
  extractPrimaryIdentity,
  sendAdminFormNotification,
};
