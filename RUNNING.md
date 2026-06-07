# How to Run the TagAlong App

## Backend API Server

### 1. Install Dependencies
```bash
cd tagalong-qr/backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (at minimum, generate a JWT_SECRET)
# Generate a secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the Server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:4000` (or the PORT in your .env)

### 4. Verify It's Running
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok"}
```

### API Endpoints Available:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/session` - Get current session (requires auth)
- `POST /api/auth/logout` - Logout
- `POST /api/qr/generate` - Create QR code (requires auth)
- `GET /api/qr/my-qrs` - List user's QR codes (requires auth)
- `POST /api/billing/create-checkout` - Create Lemon Squeezy checkout (requires auth)
- `GET /api/profile` - Get profile (requires auth)
- `PUT /api/profile` - Update profile (requires auth)

---

## Android App

### Prerequisites
- Android Studio (latest)
- Android SDK 35

### Running on Emulator
1. Open `tagalong-qr/android-app` in Android Studio
2. Let Gradle sync complete
3. Create an AVD (emulator) with API level 26+
4. Click **Run** ▶️ or press `Shift+F10`

The dev build variant uses `10.0.2.2:4000` which is the emulator's special IP for accessing the host machine's localhost.

### Running on Physical Device
You need to override the API base URL to point to your computer's LAN IP:

```bash
# Find your computer's IP (Windows)
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.50)

# Build with custom API URL
./gradlew assembleDevDebug -PTAGALONG_API_DEV=http://192.168.1.50:4000/
```

Or in Android Studio:
1. Go to **Build** → **Edit Build Types**
2. Add `-PTAGALONG_API_DEV=http://YOUR_IP:4000/` to Command-line Options

### Testing Authentication
The app includes a login/register flow. You can test the backend directly:

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# Use the returned token for authenticated requests
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/qr/my-qrs
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 4000 in use | Change PORT in .env |
| CORS errors | Check CORS_ORIGIN in .env matches your frontend URL |
| DB errors | Delete `backend/data/tagalong.db` to reset |
| Android can't connect | Ensure backend is running and accessible (firewall) |
| Emulator uses 10.0.2.2 | This is correct for localhost on host machine |