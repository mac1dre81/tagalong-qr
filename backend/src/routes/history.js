const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateId } = require('../auth');

const router = express.Router();
const itemSchema = z.object({
  name: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional().default(''),
  website: z.string().max(500).optional().default(''),
  vCard: z.string().min(1).max(20000),
  dataUrl: z.string().startsWith('data:image/png;base64,').max(500000),
  dynamicId: z.string().max(100).optional().default(''),
});

router.get('/', requireAuth, (req, res) => {
  const items = db.prepare('SELECT id, name, subtitle, website, vcard as vCard, data_url as dataUrl, dynamic_id as dynamicId, created_at as createdAt FROM history_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.auth.user.id);
  return res.status(200).json({ history: items });
});

router.post('/', requireAuth, (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid history payload' });
  const now = new Date().toISOString();
  const id = generateId('hst');
  db.prepare('INSERT INTO history_items (id, user_id, name, subtitle, website, vcard, data_url, dynamic_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.auth.user.id, parsed.data.name, parsed.data.subtitle, parsed.data.website, parsed.data.vCard, parsed.data.dataUrl, parsed.data.dynamicId, now);
  return res.status(201).json({ id, ...parsed.data, createdAt: now });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM history_items WHERE id = ? AND user_id = ?').run(req.params.id, req.auth.user.id);
  if (!result.changes) return res.status(404).json({ error: 'History item not found' });
  return res.status(204).send();
});

module.exports = router;
