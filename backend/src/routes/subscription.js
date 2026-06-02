const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { billingCheckoutBaseUrl } = require('../config');
const { generateId } = require('../auth');

const router = express.Router();
const checkoutSchema = z.object({
  plan: z.enum(['premium']),
  successUrl: z.string().url().max(500).optional(),
  cancelUrl: z.string().url().max(500).optional(),
});

router.get('/', requireAuth, (req, res) => {
  return res.status(200).json({ plan: req.auth.user.plan });
});

router.post('/checkout', requireAuth, (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid checkout payload' });

  const sessionId = generateId('chk');
  const target = new URL(billingCheckoutBaseUrl);
  target.searchParams.set('sessionId', sessionId);
  target.searchParams.set('userId', req.auth.user.id);
  target.searchParams.set('plan', parsed.data.plan);
  if (parsed.data.successUrl) target.searchParams.set('successUrl', parsed.data.successUrl);
  if (parsed.data.cancelUrl) target.searchParams.set('cancelUrl', parsed.data.cancelUrl);

  return res.status(200).json({ checkoutUrl: target.toString(), sessionId });
});

router.post('/internal/set-plan', requireAuth, (req, res) => {
  const plan = req.body?.plan;
  if (!['free', 'premium'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  db.prepare('UPDATE users SET plan = ?, updated_at = ? WHERE id = ?').run(plan, new Date().toISOString(), req.auth.user.id);
  return res.status(200).json({ plan });
});

module.exports = router;
