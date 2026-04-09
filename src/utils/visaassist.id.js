const crypto = require("crypto");

const pad2 = (value) => String(value).padStart(2, "0");

const dateCode = () => {
  const now = new Date();
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
};

const randomCode = (size = 4) => {
  return crypto.randomBytes(size).toString("hex").toUpperCase();
};

const generateCaseId = () => {
  return `CASE-${dateCode()}-${randomCode(3)}`;
};

const generateInvoiceNumber = () => {
  return `INV-${dateCode()}-${randomCode(3)}`;
};

const generateReceiptNumber = () => {
  return `RCPT-${dateCode()}-${randomCode(3)}`;
};

module.exports = {
  generateCaseId,
  generateInvoiceNumber,
  generateReceiptNumber,
};
