const app = require("../src/app");

const checks = [
  // Auth compatibility
  { id: "auth.staffLogin", method: "POST", path: "/api/v1/visaassist/auth/staff-login", body: {} },
  { id: "auth.loginFallback", method: "POST", path: "/api/v1/auth/login", body: {} },
  { id: "auth.customerLogin", method: "POST", path: "/api/v1/auth/customer-login", body: {} },
  { id: "auth.forgot.vsa", method: "POST", path: "/api/v1/visaassist/auth/forgot-password", body: {} },
  { id: "auth.forgot.core", method: "POST", path: "/api/v1/auth/forgot-password", body: {} },
  { id: "auth.reset.vsa", method: "POST", path: "/api/v1/visaassist/auth/reset-password", body: {} },
  { id: "auth.reset.core", method: "POST", path: "/api/v1/auth/reset-password", body: {} },
  { id: "auth.refresh", method: "POST", path: "/api/v1/auth/refresh", body: {} },
  { id: "auth.logout", method: "POST", path: "/api/v1/auth/logout", body: {} },
  { id: "auth.me", method: "GET", path: "/api/v1/auth/me" },

  // Public flows
  { id: "public.eligibility", method: "POST", path: "/api/v1/public/eligibility-check", body: {} },
  { id: "public.contact", method: "POST", path: "/api/v1/public/contact", body: {} },
  { id: "public.applications", method: "POST", path: "/api/v1/public/applications", body: {} },
  { id: "public.countryUpdates", method: "GET", path: "/api/v1/public/country-updates" },

  // Visaassist public aliases
  { id: "vsa.public.eligibility", method: "POST", path: "/api/v1/visaassist/public/eligibility-check", body: {} },
  { id: "vsa.public.contact", method: "POST", path: "/api/v1/visaassist/public/contact", body: {} },
  { id: "vsa.public.applications", method: "POST", path: "/api/v1/visaassist/public/applications", body: {} },
  { id: "vsa.public.countryUpdates", method: "GET", path: "/api/v1/visaassist/public/country-updates" },

  // User-side API
  { id: "user.profile.get", method: "GET", path: "/api/v1/user/profile" },
  { id: "user.profile.patch", method: "PATCH", path: "/api/v1/user/profile", body: {} },
  { id: "user.apps", method: "GET", path: "/api/v1/user/applications" },
  { id: "user.docs", method: "GET", path: "/api/v1/user/documents" },
  { id: "user.payments", method: "GET", path: "/api/v1/user/payments" },
  { id: "user.appointments", method: "GET", path: "/api/v1/user/appointments" },

  // Admin modules (expected to be auth-protected)
  { id: "vsa.dashboard", method: "GET", path: "/api/v1/visaassist/reports/dashboard" },
  { id: "vsa.leads", method: "GET", path: "/api/v1/visaassist/leads" },
  { id: "vsa.applicants", method: "GET", path: "/api/v1/visaassist/applicants" },
  { id: "vsa.cases", method: "GET", path: "/api/v1/visaassist/cases" },
  { id: "vsa.documents", method: "GET", path: "/api/v1/visaassist/documents" },
  { id: "vsa.appointments", method: "GET", path: "/api/v1/visaassist/appointments" },
  { id: "vsa.payments", method: "GET", path: "/api/v1/visaassist/payments" },
  { id: "vsa.services", method: "GET", path: "/api/v1/visaassist/services" },
  { id: "vsa.checklists", method: "GET", path: "/api/v1/visaassist/checklists" },
  { id: "vsa.templates", method: "GET", path: "/api/v1/visaassist/templates" },
  { id: "vsa.countryUpdates", method: "GET", path: "/api/v1/visaassist/country-updates" },
  { id: "vsa.reports.revenue", method: "GET", path: "/api/v1/visaassist/reports/revenue" },
  { id: "vsa.reports.conversion", method: "GET", path: "/api/v1/visaassist/reports/conversion" },
  { id: "vsa.reports.staff", method: "GET", path: "/api/v1/visaassist/reports/staff-performance" },
  { id: "vsa.reports.applications", method: "GET", path: "/api/v1/visaassist/reports/applications" },
  { id: "vsa.settings", method: "GET", path: "/api/v1/visaassist/settings" },
  { id: "vsa.compliance.logs", method: "GET", path: "/api/v1/visaassist/compliance/logs" },
  { id: "vsa.compliance.summary", method: "GET", path: "/api/v1/visaassist/compliance/summary" },
];

const allowedStatuses = new Set([200, 201, 400, 401, 403, 404, 405, 409, 415, 422, 429, 500]);

const callEndpoint = async (baseUrl, check) => {
  const headers = {};
  const options = { method: check.method, headers };

  if (typeof check.body !== "undefined") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(check.body);
  }

  const response = await fetch(`${baseUrl}${check.path}`, options);
  const contentType = response.headers.get("content-type") || "";

  let parsed = null;
  if (contentType.includes("application/json")) {
    parsed = await response.json();
  } else {
    parsed = { raw: await response.text() };
  }

  return {
    ...check,
    status: response.status,
    okStatus: allowedStatuses.has(response.status),
    notFound: response.status === 404,
    hasErrorEnvelope:
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      Object.prototype.hasOwnProperty.call(parsed, "error"),
    hasSuccessEnvelope:
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      Object.prototype.hasOwnProperty.call(parsed, "success"),
    parsed,
  };
};

(async () => {
  const targetBaseUrl = process.env.SMOKE_BASE_URL ? String(process.env.SMOKE_BASE_URL).replace(/\/$/, "") : "";
  const useExternalServer = Boolean(targetBaseUrl);

  let server = null;
  let baseUrl = targetBaseUrl;

  if (!useExternalServer) {
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  }

  try {
    const results = [];
    for (const check of checks) {
      results.push(await callEndpoint(baseUrl, check));
    }

    const routeMisses = results.filter((item) => item.notFound);
    const envelopeMismatches = results.filter(
      (item) => item.status >= 400 && item.status !== 404 && !item.hasErrorEnvelope
    );

    const summary = {
      total: results.length,
      routeMisses: routeMisses.length,
      envelopeMismatches: envelopeMismatches.length,
      nonStandardStatuses: results.filter((item) => !item.okStatus).length,
    };

    console.log(
      JSON.stringify(
        {
          mode: useExternalServer ? "external" : "in-memory",
          baseUrl,
          summary,
          routeMisses,
          envelopeMismatches,
          results,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Contract smoke script failed", error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
})();
