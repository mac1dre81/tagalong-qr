const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

// Mock config and db for isolated testing
jest.mock('../src/config', () => ({
  port: 4000,
  databasePath: ':memory:',
  corsOrigin: '*',
  jwtSecret: 'test-secret-key-for-testing-only',
  jwtExpiresIn: '7d',
  billingCheckoutBaseUrl: 'https://test.checkout.example.com',
  billingWebhookSecret: 'test-webhook-secret',
}));

// Mock database with in-memory SQLite
const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.pragma('journal_mode = WAL');
mockDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

jest.mock('../src/db', () => mockDb);

const authRoutes = require('../src/routes/auth');
const webhookRoutes = require('../src/routes/webhooks');

function createTestApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/webhooks', webhookRoutes);
  return app;
}

describe('Auth routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    // Clean tables
    mockDb.prepare('DELETE FROM sessions').run();
    mockDb.prepare('DELETE FROM users').run();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password123' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid registration payload');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short' });
      expect(response.status).toBe(400);
    });

    it('should create user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });
      expect(response.status).toBe(401);
    });

    it('should login with correct credentials', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: 'password123' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('GET /api/auth/session', () => {
    it('should reject request without auth token', async () => {
      const response = await request(app).get('/api/auth/session');
      expect(response.status).toBe(401);
    });
  });
});

describe('Webhook routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/webhooks/billing', () => {
    it('should reject webhook without secret', async () => {
      const response = await request(app)
        .post('/api/webhooks/billing')
        .send({ type: 'subscription.updated', data: { userId: 'usr_123', plan: 'premium' } });
      expect(response.status).toBe(401);
    });

    it('should reject webhook with invalid secret', async () => {
      const response = await request(app)
        .post('/api/webhooks/billing')
        .set('x-webhook-secret', 'wrong-secret')
        .send({ type: 'subscription.updated', data: { userId: 'usr_123', plan: 'premium' } });
      expect(response.status).toBe(401);
    });

    it('should accept valid webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/billing')
        .set('x-webhook-secret', 'test-webhook-secret')
        .send({ type: 'subscription.updated', data: { userId: 'usr_123', plan: 'premium' } });
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });
});