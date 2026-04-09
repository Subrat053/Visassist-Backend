# Y-Axis Backend (Express 5 + MongoDB + Cloudinary + Stripe)

Production-ready backend for the Y-Axis frontend with modular architecture and REST APIs under `/api/v1`.

## Stack
- Express 5 (CommonJS)
- MongoDB + Mongoose
- JWT access/refresh auth
- Cloudinary upload stream (raw upload for pdf/doc files)
- Stripe Payment Intents + webhook updates
- Zod request validation
- Express rate limiting

## Folder Structure

```txt
src/
  app.js
  server.js
  config/
    db.js
    cloudinary.js
    stripe.js
  models/
    User.js
    RefreshToken.js
    Consultation.js
    Assessment.js
    Application.js
    Document.js
    Country.js
    Visa.js
    Job.js
    University.js
    Course.js
    BlogPost.js
    SuccessStory.js
    ContactMessage.js
    NewsletterSubscriber.js
    Payment.js
  controllers/
  routes/
  services/
  middlewares/
  utils/
  validators/
  seed/
```

## Environment Variables

Create `.env` in `backend/`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/y_axis

JWT_ACCESS_SECRET=replace_with_secure_secret
JWT_REFRESH_SECRET=replace_with_secure_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=example@example.com
SMTP_PASS=your_password
EMAIL_FROM=no-reply@y-axis.com
```

## Scripts

```bash
npm install
npm run dev
npm run start
npm run seed
```

## API Base URL

`/api/v1`

## Endpoint Summary

### Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh-token`

### Consultations
- `POST /api/v1/consultations/migrate`
- `POST /api/v1/consultations/work`
- `POST /api/v1/consultations/study`

### Assessment
- `POST /api/v1/assessments/eligibility`

### Countries / Visas
- `GET /api/v1/countries`
- `GET /api/v1/countries/:countryId`
- `GET /api/v1/countries/:countryId/visas`

### Jobs / Applications
- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:jobId`
- `POST /api/v1/jobs/:jobId/apply`

### Study
- `GET /api/v1/study/destinations`
- `GET /api/v1/study/courses`
- `GET /api/v1/study/universities/:universityId`

### Blog
- `GET /api/v1/blog/posts`
- `GET /api/v1/blog/posts/:postId`

### Contact / Newsletter
- `POST /api/v1/contact`
- `POST /api/v1/newsletter/subscribe`

### User Dashboard
- `GET /api/v1/user/profile`
- `PUT /api/v1/user/profile`
- `GET /api/v1/user/applications`
- `GET /api/v1/user/applications/:applicationId`
- `POST /api/v1/user/applications/:applicationId/documents`

### Payments
- `POST /api/v1/payments/initiate`
- `POST /api/v1/payments/webhook`

## Response Shape

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable error message"
  }
}
```

## Notes for Frontend
- CORS is configured for Vite frontend URL(s) from `CORS_ORIGIN`.
- Auth endpoints return both `token` and `refreshToken`.
- Upload endpoint accepts `multipart/form-data` with `file` field.
- User dashboard endpoints require `Authorization: Bearer <token>`.
- Payment initiate returns Stripe `clientSecret` for frontend confirmation.
- Webhook endpoint updates persisted payment status.

## Seed Data
Run `npm run seed` to populate sample countries and visas.
