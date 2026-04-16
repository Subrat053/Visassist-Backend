const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const renderTableRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "<tr><td colspan=\"2\" style=\"padding:10px;border:1px solid #e2e8f0;color:#64748b;\">No details available.</td></tr>";
  }

  return rows
    .map(
      (row) =>
        `<tr><td style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:35%;vertical-align:top;\">${escapeHtml(
          row.label
        )}</td><td style=\"padding:10px;border:1px solid #e2e8f0;white-space:pre-wrap;word-break:break-word;\">${escapeHtml(
          row.value
        )}</td></tr>`
    )
    .join("");
};

const renderFileRows = (files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return "<tr><td colspan=\"6\" style=\"padding:10px;border:1px solid #e2e8f0;color:#64748b;\">No files uploaded.</td></tr>";
  }

  return files
    .map((file, index) => {
      return `<tr>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${index + 1}</td>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(file.label || "File")}</td>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(file.originalName || "-")}</td>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(file.mimeType || "-")}</td>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(file.size || "-")}</td>
  <td style=\"padding:10px;border:1px solid #e2e8f0;\">${
    file.url
      ? `<a href=\"${escapeHtml(file.url)}\" target=\"_blank\" rel=\"noopener noreferrer\">View</a>`
      : "-"
  }</td>
</tr>`;
    })
    .join("");
};

const buildFormSubmissionTemplate = ({
  appName,
  environmentLabel,
  formLabel,
  subject,
  submittedAt,
  source,
  recordId,
  primary,
  rows,
  files,
}) => {
  const safeAppName = appName || "Application";
  const safeFormLabel = formLabel || "Form Submission";
  const safeSource = source || "N/A";
  const safeRecordId = recordId || "N/A";
  const safePrimaryName = primary?.name || "N/A";
  const safePrimaryEmail = primary?.email || "N/A";
  const safePrimaryPhone = primary?.phone || "N/A";
  const safeEnv = environmentLabel || "Unknown";

  const html = `<!doctype html>
<html lang=\"en\">
  <body style=\"margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">
    <div style=\"max-width:860px;margin:24px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;\">
      <div style=\"background:#0f172a;color:#ffffff;padding:16px 20px;\">
        <div style=\"font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;\">${escapeHtml(safeAppName)}</div>
        <div style=\"font-size:24px;font-weight:700;margin-top:6px;\">${escapeHtml(safeFormLabel)}</div>
      </div>

      <div style=\"padding:20px;\">
        <p style=\"margin:0 0 12px 0;\"><strong>Environment:</strong> ${escapeHtml(safeEnv)}</p>
        <p style=\"margin:0 0 12px 0;\"><strong>Submitted At:</strong> ${escapeHtml(submittedAt)}</p>
        <p style=\"margin:0 0 12px 0;\"><strong>Source:</strong> ${escapeHtml(safeSource)}</p>
        <p style=\"margin:0 0 20px 0;\"><strong>Record ID:</strong> ${escapeHtml(safeRecordId)}</p>

        <h3 style=\"margin:0 0 10px 0;font-size:16px;\">Primary Contact</h3>
        <table role=\"presentation\" style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">
          <tr><td style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:35%;\">Name</td><td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(
            safePrimaryName
          )}</td></tr>
          <tr><td style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;\">Email</td><td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(
            safePrimaryEmail
          )}</td></tr>
          <tr><td style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;\">Phone</td><td style=\"padding:10px;border:1px solid #e2e8f0;\">${escapeHtml(
            safePrimaryPhone
          )}</td></tr>
        </table>

        <h3 style=\"margin:0 0 10px 0;font-size:16px;\">Submitted Details</h3>
        <table role=\"presentation\" style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">
          ${renderTableRows(rows)}
        </table>

        <h3 style=\"margin:0 0 10px 0;font-size:16px;\">Uploaded Files</h3>
        <table role=\"presentation\" style=\"width:100%;border-collapse:collapse;\">
          <thead>
            <tr>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">#</th>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">Label</th>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">Filename</th>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">MIME Type</th>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">Size</th>
              <th style=\"padding:10px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;\">Link</th>
            </tr>
          </thead>
          <tbody>
            ${renderFileRows(files)}
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>`;

  const textRows = (rows || []).map((row) => `${row.label}: ${row.value}`).join("\n");
  const textFiles = (files || [])
    .map(
      (file, index) =>
        `${index + 1}. ${file.label || "File"} | ${file.originalName || "-"} | ${file.mimeType || "-"} | ${
          file.size || "-"
        } | ${file.url || "-"}`
    )
    .join("\n");

  const text = [
    subject,
    "",
    `${safeAppName} - ${safeFormLabel}`,
    `Environment: ${safeEnv}`,
    `Submitted At: ${submittedAt}`,
    `Source: ${safeSource}`,
    `Record ID: ${safeRecordId}`,
    "",
    "Primary Contact:",
    `Name: ${safePrimaryName}`,
    `Email: ${safePrimaryEmail}`,
    `Phone: ${safePrimaryPhone}`,
    "",
    "Submitted Details:",
    textRows || "No details available.",
    "",
    "Uploaded Files:",
    textFiles || "No files uploaded.",
  ].join("\n");

  return {
    html,
    text,
  };
};

module.exports = {
  escapeHtml,
  buildFormSubmissionTemplate,
};
