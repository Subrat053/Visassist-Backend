const sanitizeToken = (value) => {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
};

const buildDocumentName = ({ caseId, applicantId, documentType, extension }) => {
  const caseToken = sanitizeToken(caseId);
  const applicantToken = sanitizeToken(applicantId);
  const typeToken = sanitizeToken(documentType);
  const ext = sanitizeToken(extension || "bin");
  const ts = Date.now();

  return `${caseToken}__${applicantToken}__${typeToken}__${ts}.${ext}`;
};

module.exports = {
  buildDocumentName,
};
