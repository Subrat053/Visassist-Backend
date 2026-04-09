const PDFDocument = require("pdfkit");

const formatCurrency = (value, currency = "USD") => {
  const normalized = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized);
  } catch (_error) {
    return `${currency} ${normalized.toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toISOString().slice(0, 10);
};

const generateInvoicePdfBuffer = ({ invoice, legalNotice }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const applicant = invoice.applicantId || {};
    const caseInfo = invoice.caseId || {};
    const currency = invoice.currency || "USD";

    doc.fontSize(20).text("Visaassist.org", { align: "left" });
    doc.moveDown(0.2);
    doc.fontSize(12).text("Service Invoice", { align: "left" });
    doc.moveDown(1);

    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber || "-"}`);
    doc.text(`Receipt Number: ${invoice.receiptNumber || "-"}`);
    doc.text(`Issued Date: ${formatDate(invoice.issuedAt || invoice.createdAt)}`);
    doc.text(`Due Date: ${formatDate(invoice.dueAt)}`);
    doc.text(`Case ID: ${caseInfo.caseId || caseInfo._id || "-"}`);
    doc.moveDown(1);

    doc.fontSize(11).text("Bill To", { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${applicant.fullName || "-"}`);
    doc.text(`Email: ${applicant.email || "-"}`);
    doc.text(`Phone: ${applicant.phone || "-"}`);
    doc.moveDown(1);

    doc.fontSize(11).text("Line Items", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10);

    const lineStartY = doc.y;
    doc.text("Description", 50, lineStartY);
    doc.text("Qty", 310, lineStartY, { width: 40, align: "right" });
    doc.text("Unit", 360, lineStartY, { width: 80, align: "right" });
    doc.text("Total", 450, lineStartY, { width: 90, align: "right" });

    doc.moveTo(50, lineStartY + 14).lineTo(545, lineStartY + 14).stroke();

    let y = lineStartY + 22;
    for (const item of invoice.lineItems || []) {
      if (y > 730) {
        doc.addPage();
        y = 50;
      }

      doc.text(item.description || "-", 50, y, { width: 245 });
      doc.text(String(item.quantity || 1), 310, y, { width: 40, align: "right" });
      doc.text(formatCurrency(item.unitPrice || 0, currency), 360, y, { width: 80, align: "right" });
      doc.text(formatCurrency(item.amount || 0, currency), 450, y, { width: 90, align: "right" });
      y += 18;
    }

    doc.moveTo(50, y + 4).lineTo(545, y + 4).stroke();
    y += 14;

    doc.fontSize(10);
    doc.text(`Subtotal: ${formatCurrency(invoice.subTotal || 0, currency)}`, 360, y, { width: 180, align: "right" });
    y += 16;
    doc.text(`Tax: ${formatCurrency(invoice.taxTotal || 0, currency)}`, 360, y, { width: 180, align: "right" });
    y += 16;
    doc.font("Helvetica-Bold").text(`Total: ${formatCurrency(invoice.totalAmount || 0, currency)}`, 360, y, {
      width: 180,
      align: "right",
    });
    y += 16;
    doc.font("Helvetica").text(`Paid: ${formatCurrency(invoice.paidAmount || 0, currency)}`, 360, y, {
      width: 180,
      align: "right",
    });
    y += 16;
    doc.text(`Balance Due: ${formatCurrency(invoice.balanceDue || 0, currency)}`, 360, y, {
      width: 180,
      align: "right",
    });
    y += 22;

    if (invoice.engagementTerms) {
      doc.fontSize(10).font("Helvetica-Bold").text("Engagement Terms", 50, y);
      y += 14;
      doc.font("Helvetica").fontSize(9).text(invoice.engagementTerms, 50, y, { width: 495 });
      y = doc.y + 10;
    }

    doc.fontSize(9).fillColor("#444444").text(legalNotice || "", 50, y, { width: 495 });
    doc.moveDown(1.2);
    doc.fontSize(8).fillColor("#666666").text("Generated electronically by Visaassist.org backend.", {
      align: "left",
    });

    doc.end();
  });
};

module.exports = {
  generateInvoicePdfBuffer,
};
