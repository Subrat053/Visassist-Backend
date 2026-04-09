const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Visaassist.org Backend API",
    version: "1.0.0",
    description:
      "REST APIs for visa documentation and process advisory workflows. This platform does not provide legal immigration representation.",
  },
  servers: [{ url: "/api/v1/visaassist" }],
  tags: [
    { name: "Auth" },
    { name: "Leads CRM" },
    { name: "Catalog" },
    { name: "Checklist" },
    { name: "Applicants" },
    { name: "Cases" },
    { name: "Documents" },
    { name: "Appointments" },
    { name: "Billing" },
    { name: "Communication" },
    { name: "Country Updates" },
    { name: "Reports" },
    { name: "Compliance" },
  ],
  paths: {
    "/auth/staff-login": { post: { tags: ["Auth"], summary: "Staff login" } },
    "/auth/refresh-token": { post: { tags: ["Auth"], summary: "Refresh token" } },
    "/auth/forgot-password": { post: { tags: ["Auth"], summary: "Request password reset" } },
    "/auth/reset-password": { post: { tags: ["Auth"], summary: "Reset password" } },
    "/users/me": {
      get: { tags: ["Auth"], summary: "Get profile" },
      patch: { tags: ["Auth"], summary: "Update profile" },
    },
    "/public/leads": { post: { tags: ["Leads CRM"], summary: "Create website lead" } },
    "/leads": { get: { tags: ["Leads CRM"], summary: "List leads" } },
    "/leads/{leadId}/assign": { patch: { tags: ["Leads CRM"], summary: "Assign lead" } },
    "/leads/{leadId}/notes": { post: { tags: ["Leads CRM"], summary: "Add lead note" } },
    "/leads/{leadId}/stage": { patch: { tags: ["Leads CRM"], summary: "Update lead stage" } },
    "/catalog/countries": {
      post: { tags: ["Catalog"], summary: "Create country" },
      get: { tags: ["Catalog"], summary: "List countries" },
    },
    "/catalog/visa-categories": {
      post: { tags: ["Catalog"], summary: "Create visa category" },
      get: { tags: ["Catalog"], summary: "List visa categories" },
    },
    "/catalog/service-packages": {
      post: { tags: ["Catalog"], summary: "Create service package" },
      get: { tags: ["Catalog"], summary: "List service packages" },
    },
    "/checklists/templates": {
      post: { tags: ["Checklist"], summary: "Create checklist template" },
      get: { tags: ["Checklist"], summary: "List checklist templates" },
    },
    "/cases": {
      post: { tags: ["Cases"], summary: "Create case" },
      get: { tags: ["Cases"], summary: "List cases" },
    },
    "/documents/upload": { post: { tags: ["Documents"], summary: "Upload case document" } },
    "/documents/{documentId}/access-url": {
      get: { tags: ["Documents"], summary: "Get short-lived signed document URL" },
    },
    "/appointments": { post: { tags: ["Appointments"], summary: "Create appointment" } },
    "/appointments/upcoming": { get: { tags: ["Appointments"], summary: "List upcoming appointments" } },
    "/billing/invoices": {
      post: { tags: ["Billing"], summary: "Create invoice" },
      get: { tags: ["Billing"], summary: "List invoices" },
    },
    "/billing/invoices/{invoiceId}/download/pdf": {
      get: { tags: ["Billing"], summary: "Download rendered invoice PDF" },
    },
    "/communications/templates": {
      post: { tags: ["Communication"], summary: "Create communication template" },
      get: { tags: ["Communication"], summary: "List communication templates" },
    },
    "/country-updates": {
      post: { tags: ["Country Updates"], summary: "Create country process update" },
      get: { tags: ["Country Updates"], summary: "List country process updates" },
    },
    "/reports/dashboard": { get: { tags: ["Reports"], summary: "Dashboard summary" } },
    "/compliance/consents": { post: { tags: ["Compliance"], summary: "Record consent" } },
    "/compliance/audit-trails": { get: { tags: ["Compliance"], summary: "List audit trails" } },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

module.exports = openApiSpec;
