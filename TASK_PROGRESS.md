# Task Progress

## Priority 1: Connect Android App to Backend
- [x] Android app already configured with BASE_URL via BuildConfig (dev: 10.0.2.2:4000, staging/prod: configurable)
- [x] Retrofit configured in TagAlongRepository.kt with auth interceptor
- [x] Can override dev URL with -PTAGALONG_API_DEV=http://YOUR_IP:4000/ for physical device testing

## Priority 2: Add Core QR Functionality (Backend)
- [x] Create qr_codes table in database (db.js)
- [x] Create src/routes/qr.js with generate and list endpoints
- [x] Register qr routes in server.js
- [ ] Test QR endpoints (requires running server)

## Priority 3: Add Lemon Squeezy Payments
- [x] Create src/routes/billing.js with create-checkout endpoint
- [x] Add required environment variables to .env.example
- [x] Register billing routes in server.js
- [ ] Test billing endpoint (requires running server)

## Priority 4: Add Profile Management
- [x] Create src/routes/profile.js with get and update endpoints
- [x] Create profiles table in database (db.js)
- [x] Register profile routes in server.js
- [ ] Test profile endpoints (requires running server)