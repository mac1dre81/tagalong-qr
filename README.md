# TagAlong

TagAlong now includes a deploy-ready backend API and an Android client that uses authenticated, server-backed data flows for subscriptions, dynamic profiles, and QR history.

## Repository layout

- `./android-app` — Android app (Kotlin + Compose + Retrofit)
- `./backend` — Node.js API service (Express + SQLite)
- `./index.html` — Web UI entry point
- `./login/` — Authentication web flows

## Backend setup

1. Install dependencies:

```bash
cd ./backend
npm install
```

2. Create env file:

```bash
cp ./backend/.env.example ./backend/.env
```

3. Configure required secrets and endpoints in `.env`:

- `JWT_SECRET` — Required. Generate a strong random secret for token signing.
- `BILLING_WEBHOOK_SECRET` — Required for webhook verification.
- `BILLING_CHECKOUT_BASE_URL` — Required for subscription checkout flow.
- `CORS_ORIGIN` — Optional. Comma-separated origins for CORS (default: `*`).
- `DATABASE_PATH` — Optional. Path to SQLite database file.

4. Start API locally:

```bash
cd ./backend
npm run dev
```

Health endpoint: `GET http://localhost:4000/health`

### Local HTTPS (for Android emulator)

For Android development with HTTPS, generate a self-signed certificate:

```bash
# Install mkcert for local certificate generation
npm install -g mkcert
mkcert -install
mkcert localhost 10.0.2.2
```

Then configure your backend to use HTTPS or use a reverse proxy like Caddy/Nginx.

## Android app setup

1. Ensure Android SDK + Android Studio are installed.
2. Open `./android-app` in Android Studio.
3. Choose flavor and build variant:
   - `devDebug`
   - `stagingDebug`
   - `prodRelease`
4. API base URLs are configured through Gradle properties in `gradle.properties`:
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

1. Start backend API (`npm run dev` in `./backend`).
2. Run Android `devDebug` build against local API.
3. Create account in app, verify authenticated session restoration.
4. Start checkout flow from app and verify webhook updates plan.
5. Verify dynamic profiles/history load from backend for the authenticated user.

### Troubleshooting

- **Certificate errors on Android**: Ensure your local HTTPS certificate is trusted by the emulator. Use `adb reverse tcp:4000 tcp:4000` to forward ports.
- **CORS errors**: Set `CORS_ORIGIN` to your web app's origin or comma-separated list of origins.
- **Rate limiting**: Backend allows 300 requests per 15 minutes per IP. Adjust in `server.js` if needed.
