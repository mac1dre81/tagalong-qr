const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { billingWebhookSecret } = require('../config');

const router = express.Router();
const eventSchema = z.object({
  type: z.enum(['subscription.updated']),
  data: z.object({
    userId: z.string().min(1),
    plan: z.enum(['free', 'premium']),
  }),
});

router.post('/billing', (req, res) => {
  const sharedSecret = req.headers['x-webhook-secret'];
  if (sharedSecret !== billingWebhookSecret) {
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid webhook payload' });

  const { userId, plan } = parsed.data.data;
  db.prepare('UPDATE users SET plan = ?, updated_at = ? WHERE id = ?').run(plan, new Date().toISOString(), userId);
  return res.status(200).json({ received: true });
});

module.exports = router;
