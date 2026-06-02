const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const { port, corsOrigin } = require('./config');
require('./db');

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const profileRoutes = require('./routes/profiles');
const historyRoutes = require('./routes/history');
const webhookRoutes = require('./routes/webhooks');

const app = express();

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
});
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(':method :url :status :response-time ms reqId=:req[x-request-id]'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use((err, req, res, _next) => {
  console.error('Unhandled error', { requestId: req.requestId, message: err?.message });
  res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
});

app.listen(port, () => {
  console.log(`TagAlong backend listening on port ${port}`);
});
