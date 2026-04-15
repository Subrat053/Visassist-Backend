const fs = require("fs");
const path = require("path");

const readEnvFile = () => {
  const envPath = path.join(process.cwd(), ".env");
  const env = {};
  if (!fs.existsSync(envPath)) {
    return env;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
  }
  return env;
};

(async () => {
  const env = readEnvFile();
  const base = "http://127.0.0.1:5010/api/v1";
  const email = `apply.flow.${Date.now()}@example.com`;
  const password = "TestPass123";

  let response = await fetch(`${base}/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Apply", lastName: "Flow", email, password }),
  });
  let body = await response.json().catch(() => ({}));
  const userToken = body?.data?.token;

  response = await fetch(`${base}/public/visa-search`);
  body = await response.json().catch(() => ({}));
  const first = body?.data?.[0] || {};
  const countrySlug = first.countrySlug;
  const visaTypeSlug = first.visaTypeSlug;

  response = await fetch(`${base}/public/application-config/${countrySlug}/${visaTypeSlug}`);
  body = await response.json().catch(() => ({}));
  const requiredDocs = Array.isArray(body?.data?.requiredDocs) ? body.data.requiredDocs : [];
  const mandatoryDocs = requiredDocs.filter((doc) => doc?.isMandatory !== false);
  const submittedDocs = mandatoryDocs.map((doc, index) => ({
    docName: doc?.name || `Document ${index + 1}`,
    fileUrl: `https://example.com/${index + 1}.pdf`,
  }));

  response = await fetch(`${base}/public/visa-applications`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      countrySlug,
      visaTypeSlug,
      fullName: "Apply Flow",
      email,
      phone: "9999999999",
      nationality: "Indian",
      consentAccepted: true,
      disclaimerAccepted: true,
      refundPolicyAccepted: true,
      submittedDocs,
    }),
  });
  body = await response.json().catch(() => ({}));
  const applicationId = body?.data?._id;
  console.log("apply with auth:", response.status, body?.success, body?.error?.code || "OK");

  response = await fetch(`${base}/user/applications`, {
    headers: { authorization: `Bearer ${userToken}` },
  });
  body = await response.json().catch(() => ({}));
  const inUserHistory = (body?.data?.items || []).some((item) => String(item._id) === String(applicationId));
  console.log("user history contains app:", response.status, body?.success, inUserHistory);

  const adminEmail = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD;
  response = await fetch(`${base}/visaassist/auth/staff-login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  body = await response.json().catch(() => ({}));
  const adminToken = body?.data?.token;

  response = await fetch(`${base}/admin/applications?search=${encodeURIComponent(email)}`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  body = await response.json().catch(() => ({}));
  const inAdminList = (body?.data?.items || []).some((item) => item?.applicantDetails?.email === email);
  console.log("admin list contains app:", response.status, body?.success, inAdminList);
})();
