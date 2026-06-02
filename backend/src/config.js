const path = require('path');
require('dotenv').config();

function requireEnv(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/tagalong.db'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: requireEnv('JWT_SECRET', ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  billingCheckoutBaseUrl: requireEnv('BILLING_CHECKOUT_BASE_URL', ''),
  billingWebhookSecret: requireEnv('BILLING_WEBHOOK_SECRET', ''),
};
