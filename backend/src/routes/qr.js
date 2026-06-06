const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { generateId } = require('../auth');
const db = require('../db');
const router = express.Router();

const qrSaveSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['url', 'vcard', 'text', 'wifi', 'event']).default('text'),
  name: z.string().max(200).optional(),
});

// Save scanned QR code
router.post('/save', requireAuth, (req, res) => {
  const parsed = qrSaveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid QR save payload' });
  }

  const { content, type, name } = parsed.data;
  const now = new Date().toISOString();
  const id = generateId('qr');

  // Check user plan for limit (premium gets 1000, free gets 25)
  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.auth.user.id);
  const qrCount = db.prepare('SELECT COUNT(*) as count FROM qr_scans WHERE user_id = ?').get(req.auth.user.id);
  const maxScans = user.plan === 'premium' ? 100 : 25;

  if (qrCount.count >= maxScans) {
    return res.status(403).json({ error: 'QR scan limit reached. Upgrade to Premium.' });
  }

  db.prepare(`
    INSERT INTO qr_scans (id, user_id, content, type, name, scanned_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.auth.user.id, content, type, name || null, now);

  return res.status(201).json({ id, content, type, name, scannedAt: now });
});

// Get user's QR scan history
router.get('/history', requireAuth, (req, res) => {
  const limit = req.auth.user.plan === 'premium' ? 100 : 25;
  const history = db.prepare(`
    SELECT id, content, type, name, scanned_at as scannedAt
    FROM qr_scans
    WHERE user_id = ?
    ORDER BY scanned_at DESC
    LIMIT ?
  `).all(req.auth.user.id, limit);

  return res.status(200).json({ scans: history });
});

// Delete a QR scan
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(`
    DELETE FROM qr_scans
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.auth.user.id);

  if (!result.changes) {
    return res.status(404).json({ error: 'QR scan not found' });
  }

  return res.status(204).send();
});

// Generate QR code (existing)
router.post('/generate', requireAuth, async (req, res) => {
  const { content, type } = req.body;
  const qrId = generateId('qr');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO qr_codes (id, user_id, content, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(qrId, req.auth.user.id, content, type, now);

  res.json({ id: qrId, content, type });
});

// Get user's QR codes (existing)
router.get('/my-qrs', requireAuth, (req, res) => {
  const qrs = db.prepare(`
    SELECT * FROM qr_codes
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.auth.user.id);

  res.json(qrs);
});

module.exports = router;