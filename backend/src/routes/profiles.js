const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateId } = require('../auth');

const router = express.Router();
const profileSchema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(160).optional().default(''),
  title: z.string().max(160).optional().default(''),
  vCard: z.string().min(1).max(20000),
});

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, company, title, vcard as vCard, updated_at as updatedAt FROM dynamic_profiles WHERE user_id = ? ORDER BY updated_at DESC').all(req.auth.user.id);
  return res.status(200).json({ profiles: rows });
});

router.post('/', requireAuth, (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile payload' });
  const now = new Date().toISOString();
  const id = generateId('dyn');
  db.prepare('INSERT INTO dynamic_profiles (id, user_id, name, company, title, vcard, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.auth.user.id, parsed.data.name, parsed.data.company, parsed.data.title, parsed.data.vCard, now);
  return res.status(201).json({ id, ...parsed.data, updatedAt: now });
});

router.put('/:id', requireAuth, (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile payload' });
  const existing = db.prepare('SELECT id FROM dynamic_profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.auth.user.id);
  if (!existing) return res.status(404).json({ error: 'Profile not found' });
  const now = new Date().toISOString();
  db.prepare('UPDATE dynamic_profiles SET name = ?, company = ?, title = ?, vcard = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(parsed.data.name, parsed.data.company, parsed.data.title, parsed.data.vCard, now, req.params.id, req.auth.user.id);
  return res.status(200).json({ id: req.params.id, ...parsed.data, updatedAt: now });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM dynamic_profiles WHERE id = ? AND user_id = ?').run(req.params.id, req.auth.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Profile not found' });
  return res.status(204).send();
});

module.exports = router;
