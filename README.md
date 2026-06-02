# TagAlong

TagAlong now includes a deploy-ready backend API and an Android client that uses authenticated, server-backed data flows for subscriptions, dynamic profiles, and QR history.

## Repository layout

- `/tmp/workspace/mac1dre81/tagalong-qr/android-app` — Android app (Kotlin + Compose + Retrofit)
- `/tmp/workspace/mac1dre81/tagalong-qr/backend` — Node.js API service (Express + SQLite)
- `/tmp/workspace/mac1dre81/tagalong-qr/index.html` — Existing web UI entry point

## Backend setup

1. Install dependencies:

```bash
cd /tmp/workspace/mac1dre81/tagalong-qr/backend
npm install
```

2. Create env file:

```bash
cp /tmp/workspace/mac1dre81/tagalong-qr/backend/.env.example /tmp/workspace/mac1dre81/tagalong-qr/backend/.env
```

3. Configure required secrets and endpoints in `.env`:

- `JWT_SECRET`
- `BILLING_WEBHOOK_SECRET`
- `BILLING_CHECKOUT_BASE_URL`
- `CORS_ORIGIN`
- `DATABASE_PATH`

4. Start API locally:

```bash
cd /tmp/workspace/mac1dre81/tagalong-qr/backend
npm run dev
```

Health endpoint: `GET http://localhost:4000/health`

## Android app setup

1. Ensure Android SDK + Android Studio are installed.
2. Open `/tmp/workspace/mac1dre81/tagalong-qr/android-app` in Android Studio.
3. Choose flavor and build variant:
   - `devDebug`
   - `stagingDebug`
   - `prodRelease`
4. API base URLs are configured through Gradle properties:
   - `TAGALONG_API_DEV`
   - `TAGALONG_API_STAGING`
   - `TAGALONG_API_PROD`

Default dev URL points emulator traffic to local backend: `https://10.0.2.2:4000/`.

## API flows implemented

- Authentication/session:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/session`
- Subscription/billing:
  - `GET /api/subscription`
  - `POST /api/subscription/checkout`
  - `POST /api/webhooks/billing`
- Dynamic profile CRUD:
  - `GET /api/profiles`
  - `POST /api/profiles`
  - `PUT /api/profiles/:id`
  - `DELETE /api/profiles/:id`
- History persistence:
  - `GET /api/history`
  - `POST /api/history`
  - `DELETE /api/history/:id`

## Billing webhook

Use `POST /api/webhooks/billing` with header:

- `x-webhook-secret: <BILLING_WEBHOOK_SECRET>`

Supported event payload:

```json
{
  "type": "subscription.updated",
  "data": {
    "userId": "usr_...",
    "plan": "premium"
  }
}
```

## Security and reliability

The backend includes:

- Helmet hardening headers
- Request rate limiting
- Strict payload validation with Zod
- Auth guards on protected routes
- Request ID tracing and structured request logging
- Secret/config management via environment variables

## Local development runbook

1. Start backend API (`npm run dev` in `/backend`).
2. Run Android `devDebug` build against local API.
3. Create account in app, verify authenticated session restoration.
4. Start checkout flow from app and verify webhook updates plan.
5. Verify dynamic profiles/history load from backend for the authenticated user.
