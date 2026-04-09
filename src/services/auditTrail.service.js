const AuditTrail = require("../models/AuditTrail.js");

const logAuditEvent = async ({
  actionType,
  entityType,
  entityId,
  actorId,
  caseId = null,
  leadId = null,
  message,
  metadata = {},
  sensitivity = "normal",
}) => {
  if (!actorId) {
    return null;
  }

  return AuditTrail.create({
    actionType,
    entityType,
    entityId: String(entityId),
    actorId,
    caseId,
    leadId,
    message,
    metadata,
    sensitivity,
  });
};

module.exports = {
  logAuditEvent,
};
