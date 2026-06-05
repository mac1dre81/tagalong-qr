const path = require('path');
require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

module.exports = {
  port: Number(getEnv('PORT', '4000')),
  databasePath: path.resolve(process.cwd(), getEnv('DATABASE_PATH', './data/tagalong.db')),
  corsOrigin: getEnv('CORS_ORIGIN', '*'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  billingCheckoutBaseUrl: requireEnv('BILLING_CHECKOUT_BASE_URL'),
  billingWebhookSecret: requireEnv('BILLING_WEBHOOK_SECRET'),
};
