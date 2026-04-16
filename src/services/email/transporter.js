const nodemailer = require("nodemailer");

const SMTP_LOG_TAG = "[SMTP]";
const DEFAULT_SMTP_PORT = 587;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parsePort = (value, fallback = DEFAULT_SMTP_PORT) => {
  const port = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return fallback;
  }
  return port;
};

const parseRecipientList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getMailRuntimeConfig = () => {
  const mailEnabled = parseBoolean(process.env.MAIL_ENABLED, true);
  const mailLogOnly = parseBoolean(process.env.MAIL_LOG_ONLY, false);

  const smtpPort = parsePort(process.env.SMTP_PORT, DEFAULT_SMTP_PORT);
  if (process.env.SMTP_PORT && String(parsePort(process.env.SMTP_PORT, NaN)) === "NaN") {
    console.warn(`${SMTP_LOG_TAG} Invalid SMTP_PORT provided. Falling back to ${DEFAULT_SMTP_PORT}.`);
  }

  const secureFromEnv = parseBoolean(process.env.SMTP_SECURE, smtpPort === 465);
  const fromEmail = String(process.env.SMTP_FROM_EMAIL || "").trim();
  const fromName = String(process.env.SMTP_FROM_NAME || process.env.APP_NAME || "").trim();
  const fallbackFrom = String(process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();

  return {
    appName: String(process.env.APP_NAME || "Visaassist").trim() || "Visaassist",
    nodeEnv: String(process.env.NODE_ENV || "development").trim() || "development",
    frontendUrl: String(process.env.FRONTEND_URL || process.env.CLIENT_URL || "").trim(),
    backendUrl: String(process.env.BACKEND_URL || "").trim(),
    mailEnabled,
    mailLogOnly,
    smtpHost: String(process.env.SMTP_HOST || "").trim(),
    smtpPort,
    smtpSecure: secureFromEnv,
    smtpUser: String(process.env.SMTP_USER || "").trim(),
    smtpPass: String(process.env.SMTP_PASS || "").trim(),
    smtpConnectionTimeout: parsePort(process.env.SMTP_CONNECTION_TIMEOUT, 10000),
    smtpGreetingTimeout: parsePort(process.env.SMTP_GREETING_TIMEOUT, 10000),
    smtpSocketTimeout: parsePort(process.env.SMTP_SOCKET_TIMEOUT, 20000),
    fromEmail: fromEmail || fallbackFrom,
    fromName,
    adminNotificationTo: parseRecipientList(process.env.ADMIN_NOTIFICATION_EMAIL),
    adminNotificationCc: parseRecipientList(process.env.ADMIN_NOTIFICATION_CC),
    adminNotificationBcc: parseRecipientList(process.env.ADMIN_NOTIFICATION_BCC),
  };
};

const buildFromAddress = (config) => {
  if (!config.fromEmail) {
    return "no-reply@example.com";
  }

  if (!config.fromName) {
    return config.fromEmail;
  }

  return `"${config.fromName.replace(/"/g, "")}" <${config.fromEmail}>`;
};

let cachedTransporter = null;
let cachedTransporterKey = "";

const buildTransporterCacheKey = (config) => {
  return [
    config.smtpHost,
    config.smtpPort,
    config.smtpSecure,
    config.smtpUser,
    config.smtpPass ? "***" : "",
    config.mailEnabled,
    config.mailLogOnly,
  ].join("|");
};

const createTransporter = (config) => {
  if (!config.mailEnabled || config.mailLogOnly) {
    return null;
  }

  if (!config.smtpHost || !config.smtpPort) {
    console.warn(`${SMTP_LOG_TAG} SMTP host/port not configured. Mail delivery is skipped.`);
    return null;
  }

  if (!config.smtpUser || !config.smtpPass) {
    console.warn(`${SMTP_LOG_TAG} SMTP credentials missing. Mail delivery is skipped.`);
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: Boolean(config.smtpSecure),
    requireTLS: !config.smtpSecure && config.smtpPort === 587,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    connectionTimeout: config.smtpConnectionTimeout,
    greetingTimeout: config.smtpGreetingTimeout,
    socketTimeout: config.smtpSocketTimeout,
  });

  return transporter;
};

const getTransporter = () => {
  const config = getMailRuntimeConfig();
  const key = buildTransporterCacheKey(config);

  if (!cachedTransporter || cachedTransporterKey !== key) {
    cachedTransporter = createTransporter(config);
    cachedTransporterKey = key;
  }

  return {
    transporter: cachedTransporter,
    config,
  };
};

const verifyTransporter = async () => {
  const { transporter, config } = getTransporter();

  if (!config.mailEnabled) {
    console.info(`${SMTP_LOG_TAG} MAIL_ENABLED=false. SMTP verification skipped.`);
    return { skipped: true, reason: "MAIL_DISABLED" };
  }

  if (config.mailLogOnly) {
    console.info(`${SMTP_LOG_TAG} MAIL_LOG_ONLY=true. SMTP verification skipped.`);
    return { skipped: true, reason: "MAIL_LOG_ONLY" };
  }

  if (!transporter) {
    return { skipped: true, reason: "TRANSPORTER_NOT_CONFIGURED" };
  }

  await transporter.verify();
  console.info(
    `${SMTP_LOG_TAG} SMTP verified for ${config.smtpHost}:${config.smtpPort} (${config.smtpSecure ? "secure" : "starttls"}).`
  );
  return { verified: true };
};

const sendMail = async ({ to, cc, bcc, subject, html, text, replyTo }) => {
  const { transporter, config } = getTransporter();

  if (!config.mailEnabled) {
    console.info(`${SMTP_LOG_TAG} MAIL_ENABLED=false. Mail skipped. Subject: ${subject || "(no-subject)"}`);
    return { skipped: true, reason: "MAIL_DISABLED" };
  }

  const recipients = parseRecipientList(to);
  if (recipients.length === 0) {
    console.warn(`${SMTP_LOG_TAG} Missing recipients. Mail skipped. Subject: ${subject || "(no-subject)"}`);
    return { skipped: true, reason: "MISSING_RECIPIENTS" };
  }

  const payload = {
    from: buildFromAddress(config),
    to: recipients.join(", "),
    cc: parseRecipientList(cc).join(", ") || undefined,
    bcc: parseRecipientList(bcc).join(", ") || undefined,
    subject,
    html,
    text,
    replyTo: replyTo || undefined,
  };

  if (config.mailLogOnly) {
    console.info(`${SMTP_LOG_TAG} MAIL_LOG_ONLY=true. Mail payload logged instead of sending.`, {
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
    });
    return { skipped: true, reason: "MAIL_LOG_ONLY", logged: true };
  }

  if (!transporter) {
    return { skipped: true, reason: "TRANSPORTER_NOT_CONFIGURED" };
  }

  return transporter.sendMail(payload);
};

module.exports = {
  parseBoolean,
  parseRecipientList,
  getMailRuntimeConfig,
  getTransporter,
  verifyTransporter,
  sendMail,
};
