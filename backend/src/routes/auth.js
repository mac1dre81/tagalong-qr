const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db');
const { generateId, signSession } = require('../auth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const credentialsSchema = z.object({
  email: z.string().email().max(200).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(72),
});

function createSession(user) {
  const token = signSession(user);
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  const now = new Date().toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(token, user.id, new Date(payload.exp * 1000).toISOString(), now);
  return token;
}

router.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid registration payload' });

  const { email, password } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Account already exists' });

  const now = new Date().toISOString();
  const user = {
    id: generateId('usr'),
    email,
    plan: 'free',
    password_hash: await bcrypt.hash(password, 12),
  };

  db.prepare('INSERT INTO users (id, email, password_hash, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user.id, user.email, user.password_hash, user.plan, now, now);

  const token = createSession(user);
  return res.status(201).json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
});

router.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid login payload' });

  const { email, password } = parsed.data;
  const user = db.prepare('SELECT id, email, plan, password_hash FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = createSession(user);
  return res.status(200).json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
});

router.post('/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.auth.token);
  return res.status(204).send();
});

router.get('/session', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.auth.user });
});

module.exports = router;
