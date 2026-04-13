# Visaassist API Migration Notes

## Summary

This migration extends the existing API without breaking active admin contracts. Existing endpoints under `/api/v1/visaassist/*` used by dashboard, leads, applicants, and cases are preserved.

## Backward Compatibility

- Response envelope remains:
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, error: { message, code?, details? } }`
- List endpoints continue returning:
  - `{ success: true, data: { items, pagination } }`
- Existing auth fallback aliases are preserved:
  - `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout`
- Existing admin endpoints remain available.

## New Endpoint Families

- Public:
  - `/api/v1/public/eligibility-check`
  - `/api/v1/public/contact`
  - `/api/v1/public/applications`
  - `/api/v1/public/country-updates`
- Auth compatibility:
  - `/api/v1/auth/customer-login`
  - `/api/v1/auth/refresh`
  - `/api/v1/auth/me`
- Visaassist module completions:
  - Documents, appointments, payments, services, checklists, templates, country updates, reports, settings, compliance
- User account area:
  - `/api/v1/user/profile`
  - `/api/v1/user/applications`
  - `/api/v1/user/documents`
  - `/api/v1/user/payments`
  - `/api/v1/user/appointments`

## Data Model Notes

- `User.role` now supports `customer` (legacy `user` is still accepted in enum).
- Additional optional compatibility fields were added to lead/applicant/case/document/payment models.
- `Setting` model introduced for key-value configuration storage.

## Seed Updates

Visaassist seed now includes:

- additional staff roles: `adviser`, `support`
- sample checklist template
- sample communication template
- sample country update
- sample settings

## Frontend Integration Notes

- Admin placeholder routes now point to working module pages.
- User forms are wired to live APIs:
  - `/contact`
  - `/free-eligibility-check`
  - `/apply/:country/:visaType`
  - `/login`
  - `/signup`
- Frontend environment variables were added in `frontend/.env`.
