# Visaassist.org Backend Implementation Guide

## Scope Disclaimer
This backend is designed for documentation support and process advisory workflows only. It does not offer legal immigration representation.

## 1) Recommended Folder Structure

```txt
backend/
  src/
    config/
      db.js
      cloudinary.js
      openapi.visaassist.js
    controllers/
    jobs/
      weeklyCountryUpdateReminder.job.js
    middlewares/
      auth.middleware.js
      role.middleware.js
      validate.middleware.js
      upload.middleware.js
      error.middleware.js
    models/
      Lead.js
      VisaCategory.js
      ServicePackage.js
      ChecklistTemplate.js
      Applicant.js
      Case.js
      CaseDocument.js
      Appointment.js
      Invoice.js
      PaymentTransaction.js
      CommunicationTemplate.js
      CountryProcessUpdate.js
      ConsentRecord.js
      AuditTrail.js
    modules/
      visaassist/
        visaassist.services.js
        visaassist.controllers.js
        visaassist.validators.js
        visaassist.routes.js
    routes/
      index.js
      visaassist.routes.js
    seed/
      visaassist.js
      visaassist.data.js
    services/
      auditTrail.service.js
      cloudinary.service.js
      token.service.js
    templates/
      email/
        pending-documents.template.txt
      whatsapp/
        appointment-reminder.template.txt
    utils/
      visaassist.constants.js
      visaassist.query.js
      visaassist.id.js
      documentNaming.js
      ApiError.js
      ApiResponse.js
      asyncHandler.js
```

## 2) Mongoose Schemas Added
- Lead: inquiry capture, stage tracking, assignment, notes, activity history.
- VisaCategory: dynamic visa category definitions.
- ServicePackage: country-wise and complexity-wise pricing + SOP guidance.
- ChecklistTemplate: versioned country + visa checklist templates.
- Applicant: profile, passport, travel/family/dependent info, compliance flags.
- Case: lifecycle state machine, timeline, checklist items, notes separation.
- CaseDocument: secure metadata, access level, archive support.
- Appointment: biometrics/submission/interview schedule + reschedule history.
- Invoice: service fees, engagement terms, payment state.
- PaymentTransaction: transaction audit and invoice linkage.
- CommunicationTemplate: email/WhatsApp/reminder templates with variables.
- CountryProcessUpdate: country advisory updates with weekly logs.
- ConsentRecord: disclaimers/consent/policy acknowledgements.
- AuditTrail: status, assignment, payment, and upload audit events.

## 3) REST API Routes (Primary)
Base: `/api/v1/visaassist`

- Auth and users:
  - `POST /auth/staff-login`
  - `POST /auth/refresh-token`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `GET /users/me`
  - `PATCH /users/me`
- Public lead capture:
  - `POST /public/leads`
- Leads CRM:
  - `GET /leads`
  - `PATCH /leads/:leadId/assign`
  - `POST /leads/:leadId/notes`
  - `PATCH /leads/:leadId/stage`
- Catalog and packages:
  - `POST /catalog/countries`, `GET /catalog/countries`
  - `POST /catalog/visa-categories`, `GET /catalog/visa-categories`
  - `POST /catalog/service-packages`, `GET /catalog/service-packages`
  - `PATCH /catalog/service-packages/:packageId/availability`
- Checklist:
  - `POST /checklists/templates`, `GET /checklists/templates`
  - `POST /cases/:caseId/checklists/generate`
  - `PATCH /cases/:caseId/checklists/items/:checklistItemId`
- Applicants:
  - `POST /applicants`, `GET /applicants`
- Cases:
  - `POST /cases`, `GET /cases`
  - `PATCH /cases/:caseId/status`
  - `POST /cases/:caseId/notes`
  - `PATCH /cases/:caseId/assign`
- Documents:
  - `POST /documents/upload`
  - `GET /documents`
  - `GET /documents/:documentId/access-url`
  - `PATCH /documents/:documentId/archive`
- Appointments:
  - `POST /appointments`
  - `PATCH /appointments/:appointmentId/reschedule`
  - `GET /appointments/upcoming`
- Billing:
  - `POST /billing/invoices`
  - `GET /billing/invoices`
  - `POST /billing/invoices/:invoiceId/payments`
  - `GET /billing/invoices/:invoiceId/download`
  - `GET /billing/invoices/:invoiceId/download/pdf`
- Communications:
  - `POST /communications/templates`
  - `GET /communications/templates`
  - `PATCH /communications/templates/:templateId`
  - `POST /communications/send-preview` (provider placeholder)
- Country updates:
  - `POST /country-updates`
  - `GET /country-updates`
- Reports and compliance:
  - `GET /reports/dashboard`
  - `POST /compliance/consents`
  - `GET /compliance/audit-trails`
- OpenAPI:
  - `GET /docs/openapi.json`

## 4) Controllers and Services Strategy
- Controllers are thin wrappers using `asyncHandler` + `sendSuccess`.
- All business logic lives in `visaassist.services.js`.
- Cross-cutting audit recording is centralized in `auditTrail.service.js`.
- IDs (`CASE-*`, `INV-*`, `RCPT-*`) and search/pagination helpers are utility-driven.

## 5) Middleware Strategy
- Auth: `requireAuth` (JWT access token).
- RBAC: `requireRoles(...ROLES)` for staff-only APIs.
- Validation: Zod schemas via `validate` middleware.
- Upload: Multer memory storage with strict MIME and size limits.
- Rate limiting: auth + CRM endpoint protection.
- Error handling: central ApiError + global handler.

## 6) Sample DTO / Validation Structures
- Lead create DTO: fullName, email, phone, nationality, destinationCountry, visaCategory, travelPurpose, urgency, priorRefusal.
- Case create DTO: applicantId, leadId, destinationCountry, visaCategory, packageId, assignedStaff[], priority.
- Invoice DTO: caseId, applicantId, lineItems[{description, quantity, unitPrice, taxPercent}], engagementTerms.
- Consent DTO: applicantId, caseId, consentType, accepted, source, textVersion.

## 7) Example Request/Response Payloads

### Create lead
Request:
```json
{
  "fullName": "Aisha Verma",
  "email": "aisha@example.com",
  "phone": "9876543210",
  "countryCode": "+91",
  "nationality": "Indian",
  "destinationCountry": "Canada",
  "visaCategory": "Student Visa",
  "travelPurpose": "Higher education",
  "urgency": "high",
  "priorRefusal": false,
  "source": "website"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "stage": "new",
    "fullName": "Aisha Verma"
  }
}
```

### Update case status
Request:
```json
{
  "caseStatus": "documents_received",
  "note": "All mandatory docs submitted"
}
```

### Record invoice payment
Request:
```json
{
  "amount": 500,
  "currency": "USD",
  "method": "bank_transfer",
  "transactionReference": "UTR12345",
  "status": "partial",
  "notes": "First milestone"
}
```

## 8) Step-by-Step Implementation Order
1. Configure env, DB connection, JWT secrets, Cloudinary credentials.
2. Run migrations/seed for countries, visa categories, package baseline.
3. Create staff users with new RBAC roles.
4. Integrate frontend lead capture to `POST /public/leads`.
5. Configure CRM ops screens (leads, applicants, cases, checklist).
6. Enable document upload + checklist item linking.
7. Enable billing + transaction recording + invoice download endpoint.
8. Enable appointment tracker and reminder template workflows.
9. Enable weekly country update workflow and dashboard analytics.
10. Harden logs, monitoring, and secret management in production.

## 9) Security Best Practices for Document Handling
- Use private bucket/folder policies with signed URL access (Cloudinary/S3).
- Never expose raw storage credentials to clients.
- Restrict MIME types and file size in upload middleware.
- Store metadata separately from access tokens/secure links.
- Enforce role + case assignment checks before serving documents.
- Log every upload/archive/view attempt in audit trails.
- Redact sensitive identifiers in logs and alerts.
- Prefer server-side malware scanning in async pipeline.

## 10) Frontend Admin Panel Integration Notes
- Keep master data dynamic: countries, visa categories, packages from APIs.
- Use status enums from backend constants to drive UI workflows.
- Build separate tabs for internal notes vs customer-visible notes.
- For forms, use field-level validation mirroring Zod schema constraints.
- Poll or subscribe to appointment and pending-document widgets for dashboards.
- Use role-aware routing in frontend to match backend RBAC restrictions.
- Show explicit disclaimer text during consent capture and invoice acceptance.
